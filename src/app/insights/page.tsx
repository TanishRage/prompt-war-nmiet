'use client';

import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { BarChart3, TrendingDown, DollarSign, Sprout, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function InsightsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>Household Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Food Waste Insights
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Measure food waste reduction, estimated financial savings, and household sustainability.
        </p>
      </div>

      {/* Metric Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Waste Reduction Rate</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">-- %</span>
            <span className="text-xs text-emerald-600 font-medium">Tracking</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Based on Used vs Wasted items</p>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Estimated Savings</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">$ --</span>
            <span className="text-xs text-slate-400 font-medium">Accumulating</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">From salvaged expiring ingredients</p>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Carbon Footprint Prevented</span>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">-- kg CO2</span>
            <span className="text-xs text-slate-400 font-medium">Calculated</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Food waste diverted from landfill</p>
        </Card>
      </div>

      <EmptyState
        icon={BarChart3}
        title="More Data Needed to Generate Insights"
        description="As you mark items as 'Used' or 'Wasted' in your pantry, PantryPilot aggregates the statistics here into trends, charts, and actionable food savings metrics."
        actionLabel="Go to Pantry"
        onAction={() => {
          window.location.href = '/pantry';
        }}
      />
    </div>
  );
}
