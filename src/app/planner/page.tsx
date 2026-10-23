'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { addPantryItem } from '@/lib/pantryRepo';
import {
  Sparkles,
  Camera,
  Upload,
  Calendar,
  ChefHat,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Sprout,
  ShoppingCart,
  Clock,
  RefreshCw,
  Utensils,
  Layers,
  Trash2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface ScannedItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'pcs';
  category: 'produce' | 'dairy' | 'meat' | 'grains' | 'pantry' | 'frozen' | 'other';
  storage: 'fridge' | 'freezer' | 'shelf';
  shelfLifeDays: number;
  expiresAt: string;
}

interface MealPlanMeal {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeName: string;
  usedPantryItems: string[];
  missingIngredients: string[];
  instructions: string;
}

interface MealPlanDay {
  day: number;
  dayName: string;
  date: string;
  meals: MealPlanMeal[];
}

interface MealPlanData {
  planTitle: string;
  summary: string;
  days: MealPlanDay[];
  shoppingList: Array<{ name: string; quantity: number; unit: string }>;
  projectedImpact: {
    totalItemsUsed: number;
    expiringItemsSaved: number;
    estimatedMoneySavedUSD: number;
    foodWasteDivertedKg: number;
    carbonFootprintPreventedKgCo2: number;
    projectedWasteReductionPct: number;
  };
}

export default function PlannerPage() {
  const { user, getIdToken } = useAuth();
  const { addToast } = useToast();

  const [mode, setMode] = useState<'scan' | 'plan'>('plan');
  const [goal, setGoal] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');

  const [isRunning, setIsRunning] = useState(false);
  const [traces, setTraces] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Results
  const [planResult, setPlanResult] = useState<MealPlanData | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isSavingScanned, setIsSavingScanned] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      addToast('Image exceeds 4MB limit', 'error');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setImageBase64(b64);
      setImagePreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAgent = async () => {
    if (mode === 'scan' && !imageBase64) {
      addToast('Please upload or snap a photo of your groceries/pantry first.', 'warning');
      return;
    }

    setIsRunning(true);
    setErrorMsg(null);
    setTraces([]);
    if (mode === 'plan') setPlanResult(null);
    if (mode === 'scan') setScannedItems([]);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode,
          goal: goal.trim() || undefined,
          image: mode === 'scan' ? imageBase64 : undefined,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Request failed with status ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No readable response received from agent.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const event = JSON.parse(dataStr);
            if (event.type === 'trace') {
              setTraces((prev) => [...prev, event.message]);
            } else if (event.type === 'result') {
              if (event.data?.mode === 'scan') {
                setScannedItems(event.data.items || []);
                addToast('Groceries scanned and categorized!', 'success');
              } else if (event.data?.mode === 'plan') {
                setPlanResult(event.data.plan);
                addToast('Zero-waste meal plan ready!', 'success');
              }
            } else if (event.type === 'error') {
              setErrorMsg(event.message);
              addToast(event.message, 'error');
            }
          } catch (err) {
            console.error('Error parsing SSE event chunk:', err);
          }
        }
      }
    } catch (err: any) {
      console.error('Agent invocation failed:', err);
      setErrorMsg(err.message || 'An error occurred while communicating with the agent.');
      addToast(err.message || 'AI Agent failed. Manual pantry is fully available.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveScannedToPantry = async () => {
    if (!user || scannedItems.length === 0) return;
    setIsSavingScanned(true);

    try {
      for (const item of scannedItems) {
        await addPantryItem(user.uid, {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          storage: item.storage,
          addedAt: new Date().toISOString(),
          expiresAt: item.expiresAt,
          status: 'active',
          source: 'ai',
        });
      }

      addToast(`Added ${scannedItems.length} items to your pantry!`, 'success');
      setScannedItems([]);
      setImagePreview('');
      setImageBase64('');
    } catch (err: any) {
      addToast(err.message || 'Failed to save scanned items to pantry', 'error');
    } finally {
      setIsSavingScanned(false);
    }
  };

  const handleRemoveScannedItem = (id: string) => {
    setScannedItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Autonomous Gemini 2.5 Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Pantry & Meal Planner
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Scan fridge photos to auto-stock items or let the agent construct zero-waste meal plans.
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 self-start sm:self-center">
          <button
            onClick={() => {
              setMode('plan');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              mode === 'plan'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Plan Meals</span>
          </button>
          <button
            onClick={() => {
              setMode('scan');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              mode === 'scan'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Vision Scan</span>
          </button>
        </div>
      </div>

      {/* Main Configuration Card */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {mode === 'plan' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Household Goal or Preferences (Optional)
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                maxLength={200}
                placeholder="e.g. Vegetarian only, quick 20-min dinners, high protein for 2 people"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                The agent inspects active pantry items, identifies what expires within 72h, and builds a 3-day meal plan.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleRunAgent}
                isLoading={isRunning}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRunning ? 'Agent Synthesizing Plan...' : 'Generate 3-Day Meal Plan'}</span>
              </Button>
              <Link href="/pantry">
                <Button variant="outline" className="gap-2">
                  <span>View Pantry Inventory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-900 dark:text-white">
              Upload or Snap Fridge / Receipt Photo
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-950/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview ? (
                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Pantry upload preview"
                    className="max-h-56 rounded-xl object-contain shadow-subtle mb-3"
                  />
                  <span className="text-xs text-emerald-600 font-medium">Click to choose a different photo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drop grocery photo
                  </span>
                  <span className="text-xs text-slate-400">JPEG, PNG, or WebP up to 4MB</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleRunAgent}
                isLoading={isRunning}
                disabled={!imageBase64}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRunning ? 'Analyzing Image...' : 'Identify Ingredients with AI'}</span>
              </Button>
              {imageBase64 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setImagePreview('');
                    setImageBase64('');
                  }}
                >
                  Clear Photo
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Live Reasoning Trace Panel */}
      {(isRunning || traces.length > 0) && (
        <Card className="p-5 border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Autonomous Reasoning Trace</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {isRunning ? 'Running Tool Calls in Parallel...' : 'Completed'}
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-2">
            {traces.map((trace, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-emerald-500 font-bold">›</span>
                <span>{trace}</span>
              </div>
            ))}
            {isRunning && (
              <div className="flex items-center gap-2 text-emerald-400/80 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>Agent thinking & validating tool output...</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error Card */}
      {errorMsg && (
        <Card className="p-5 border-rose-300 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                AI Agent Execution Note
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{errorMsg}</p>
              <div className="mt-3 flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={handleRunAgent}>
                  Try Again
                </Button>
                <Link href="/pantry">
                  <span className="text-xs text-slate-600 dark:text-slate-400 underline hover:text-slate-900">
                    Manage pantry manually
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SCAN REVIEW VIEW */}
      {scannedItems.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Review Scanned Items ({scannedItems.length})
              </h2>
              <p className="text-xs text-slate-500">
                Verify detected quantities and shelf life estimates before confirming to your pantry.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleSaveScannedToPantry}
              isLoading={isSavingScanned}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Add to Pantry</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {scannedItems.map((item) => (
              <Card key={item.id} className="p-4 border-slate-200 dark:border-slate-800 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.quantity} {item.unit} • {item.storage}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveScannedItem(item.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Badge variant="neutral">{item.category}</Badge>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    ~{item.shelfLifeDays} days shelf life
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PLAN VIEW */}
      {planResult && (
        <div className="space-y-8 animate-in fade-in">
          {/* Projected Impact Cards */}
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>Projected Plan Impact</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Expiring Saved</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {planResult.projectedImpact.expiringItemsSaved} items
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Diverted from waste</p>
              </Card>

              <Card className="p-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Estimated Savings</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${planResult.projectedImpact.estimatedMoneySavedUSD.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">In household food costs</p>
              </Card>

              <Card className="p-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Waste Diverted</span>
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {planResult.projectedImpact.foodWasteDivertedKg.toFixed(1)} kg
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Physical food weight</p>
              </Card>

              <Card className="p-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>CO2 Footprint</span>
                  <Sprout className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {planResult.projectedImpact.carbonFootprintPreventedKgCo2.toFixed(1)} kg
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Emissions prevented</p>
              </Card>
            </div>
          </div>

          {/* 3 Days Meal Breakdown */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {planResult.planTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{planResult.summary}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {planResult.days.map((day) => (
                <Card
                  key={day.day}
                  className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Day {day.day}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {day.dayName}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{day.date}</span>
                    </div>

                    <div className="space-y-4">
                      {day.meals.map((meal, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              {meal.mealType}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {meal.recipeName}
                          </h4>

                          {meal.usedPantryItems.length > 0 && (
                            <div className="mt-2 text-xs">
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold block text-[11px]">
                                Pantry Used:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {meal.usedPantryItems.map((item, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50"
                                  >
                                    ✓ {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {meal.instructions}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Shopping Gaps List */}
          {planResult.shoppingList.length > 0 && (
            <Card className="p-6 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Missing Ingredients Shopping List
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                These ingredients are required by the recipes but not currently in your pantry.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {planResult.shoppingList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-slate-400 font-mono">
                      x{item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
