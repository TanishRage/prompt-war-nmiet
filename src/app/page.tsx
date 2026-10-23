'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchPantryItems } from '@/lib/pantryRepo';
import { PantryItem } from '@/types';
import { getExpiryStatus } from '@/lib/expiry';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle,
  Refrigerator,
  Plus,
  ArrowRight,
  TrendingDown,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const fetched = await fetchPantryItems(user.uid);
          setItems(fetched);
        } catch (err) {
          console.error('Failed to load dashboard items:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [user]);

  const activeItems = items.filter((i) => i.status === 'active');
  const expiredItems = activeItems.filter((i) => getExpiryStatus(i.expiresAt) === 'expired');
  const expiringItems = activeItems.filter((i) => getExpiryStatus(i.expiresAt) === 'expiring');
  const freshItems = activeItems.filter((i) => getExpiryStatus(i.expiresAt) === 'fresh');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {greeting()},{' '}
            <span className="text-emerald-600 dark:text-emerald-400">
              {user?.displayName ? user.displayName.split(' ')[0] : 'Cook'}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here is your kitchen snapshot. Let&apos;s keep pantry waste close to zero today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/pantry">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Open Pantry
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Shell */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expiring Soon */}
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Expiring Soon (&le;3 days)
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {expiringItems.length}
              </div>
            )}
            <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-1">
              Priority ingredients to consume
            </p>
          </CardContent>
        </Card>

        {/* Expired Items */}
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-200">
              Expired Items
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {expiredItems.length}
              </div>
            )}
            <p className="text-xs text-red-800/80 dark:text-red-400/80 mt-1">
              Review and discard or update
            </p>
          </CardContent>
        </Card>

        {/* Fresh Items */}
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              Fresh Inventory
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {freshItems.length}
              </div>
            )}
            <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-1">
              Safely stored &gt;3 days
            </p>
          </CardContent>
        </Card>

        {/* Total Active Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Total In Pantry
            </CardTitle>
            <Refrigerator className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {activeItems.length}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Across fridge, freezer & shelf
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action shortcuts & Upcoming Expiring Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Items List Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Needs Attention First</span>
            </h2>
            <Link
              href="/pantry"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : expiringItems.length === 0 && expiredItems.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-slate-900">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                All ingredients are fresh!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No items are expiring within the next 3 days.
              </p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {[...expiredItems, ...expiringItems].slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {item.quantity} {item.unit} &bull; {item.storage}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getExpiryStatus(item.expiresAt)} size="sm">
                    {new Date(item.expiresAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI & Quick Insights Cards */}
        <div className="space-y-4">
          <Card className="p-5 border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Smart Meal Planner (AI)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Turn ingredients expiring soon into personalized, zero-waste recipes tailored for your household.
            </p>
            <Link href="/planner">
              <Button size="sm" variant="secondary" className="w-full text-xs">
                Preview Meal Planner
              </Button>
            </Link>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-sm mb-2">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              <span>Household Impact</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Households tracking food expiry with PantryPilot cut grocery spoilage by an average of 34%.
            </p>
            <Link href="/insights">
              <Button size="sm" variant="outline" className="w-full text-xs">
                View Waste Insights
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
