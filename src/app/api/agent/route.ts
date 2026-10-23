import { NextRequest } from 'next/server';
import { agentInputSchema } from '@/lib/agent/schemas';
import { agentRateLimiter } from '@/lib/agent/rateLimiter';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { runAgentLoop, AgentStreamEvent } from '@/lib/agent/loop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const reqStart = Date.now();

  try {
    // 1. Verify authentication header with firebase-admin
    const authHeader = req.headers.get('authorization');
    let user: { uid: string; email?: string; isGuest?: boolean };
    try {
      user = await verifyAuthToken(authHeader);
    } catch (authErr: any) {
      console.warn('[Agent API] Auth failed:', authErr?.message);
      return new Response(
        JSON.stringify({ error: authErr?.message || 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Per-user rate limiting (10 requests / hour)
    const rateCheck = agentRateLimiter.check(user.uid);
    if (!rateCheck.allowed) {
      const waitMinutes = Math.ceil((rateCheck.resetTimeMs - Date.now()) / 60000);
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded. You have reached the limit of 10 AI operations per hour. Please try again in ${waitMinutes} minutes.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateCheck.resetTimeMs - Date.now()) / 1000)),
          },
        }
      );
    }

    // 3. Parse and validate input body with Zod
    const body = await req.json().catch(() => null);
    const parsedInput = agentInputSchema.safeParse(body);

    if (!parsedInput.success) {
      const errorMsg = parsedInput.error.errors.map((e) => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: `Invalid input parameters: ${errorMsg}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { mode, goal, image } = parsedInput.data;

    // Additional check: scan mode requires an image
    if (mode === 'scan' && !image) {
      return new Response(
        JSON.stringify({ error: 'Scan mode requires an image input to analyze.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Set up Server-Sent Events (SSE) Stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: AgentStreamEvent) => {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };

        try {
          sendEvent({
            type: 'trace',
            message: `🤖 Autonomous Gemini Agent initialized (${mode.toUpperCase()} mode)...`,
          });

          await runAgentLoop(parsedInput.data, user.uid, sendEvent);

          // Signal completion
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          const totalLatency = Date.now() - reqStart;
          console.log(`[Agent API] Request completed successfully in ${totalLatency}ms for user=${user.uid.slice(0, 8)}...`);
        } catch (loopError: any) {
          console.error('[Agent API] Loop error:', loopError?.message || loopError);
          sendEvent({
            type: 'error',
            message:
              loopError?.message ||
              'An unexpected error occurred during AI agent execution. Your manual pantry remains fully available.',
          });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-RateLimit-Limit': String(rateCheck.limit),
        'X-RateLimit-Remaining': String(rateCheck.remaining),
      },
    });
  } catch (err: any) {
    console.error('[Agent API] Unhandled route error:', err?.message || err);
    return new Response(
      JSON.stringify({
        error: 'A server error occurred while contacting the AI agent. Please try again later.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
