import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  PieChart, 
  Calendar, 
  Users, 
  AlertTriangle, 
  ChevronRight
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { dashboardApi } from '../../features/dashboard/api';
import type { TripDashboardData } from '../../features/dashboard/types';

interface TripDashboardTabProps {
  tripId: string;
  onNavigateToTab?: (tab: 'expenses' | 'balances') => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Food: { bg: 'bg-orange-500/10', text: 'text-orange-400', bar: 'bg-orange-500' },
  Transport: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
  Fuel: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
  Stay: { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500' },
  Activities: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  Tickets: { bg: 'bg-pink-500/10', text: 'text-pink-400', bar: 'bg-pink-500' },
  Shopping: { bg: 'bg-teal-500/10', text: 'text-teal-400', bar: 'bg-teal-500' },
  Drinks: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500' },
  Emergency: { bg: 'bg-red-500/10', text: 'text-red-400', bar: 'bg-red-500' },
  Miscellaneous: { bg: 'bg-slate-500/10', text: 'text-slate-400', bar: 'bg-slate-500' },
};

export const TripDashboardTab: React.FC<TripDashboardTabProps> = ({
  tripId,
  onNavigateToTab,
}) => {
  const [data, setData] = useState<TripDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const dash = await dashboardApi.getTripDashboard(tripId);
      setData(dash);
    } catch (err) {
      console.error('Failed to load trip dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Loading trip metrics, velocity, and analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-slate-400">
        Failed to load dashboard data.
      </div>
    );
  }

  const { currency, financials, category_breakdown, daily_trends, member_contributions, largest_expenses, settlements_summary } = data;
  const sym = currency === 'INR' ? '₹' : currency;

  const totalSpentNum = Number(financials.total_spent);
  const budgetNum = financials.total_budget ? Number(financials.total_budget) : null;
  const remainingBudgetNum = financials.remaining_budget !== null && financials.remaining_budget !== undefined ? Number(financials.remaining_budget) : null;
  const pctUsed = financials.percentage_used ? Number(financials.percentage_used) : 0;

  // Velocity bar color
  let velocityColor = 'bg-emerald-500';
  if (financials.budget_status === 'CAUTION') velocityColor = 'bg-amber-500';
  if (financials.budget_status === 'OVER_BUDGET') velocityColor = 'bg-rose-500';

  // Find max daily spend for bar scaling
  const maxDailyAmount = daily_trends.reduce((max, d) => Math.max(max, Number(d.amount)), 1);

  return (
    <div className="space-y-6">
      {/* 1. Core Financial Velocity & Burn Rate Card */}
      <Card variant="glass" className="p-5 sm:p-6 border-slate-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          {/* Main Spend & Budget Numbers */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Trip Budget & Velocity
              </span>
              {financials.budget_status === 'ON_TRACK' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  On Track ({pctUsed.toFixed(1)}% Used)
                </span>
              )}
              {financials.budget_status === 'CAUTION' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Caution ({pctUsed.toFixed(1)}% Used)
                </span>
              )}
              {financials.budget_status === 'OVER_BUDGET' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  Over Budget ({pctUsed.toFixed(1)}%)
                </span>
              )}
              {financials.budget_status === 'NO_BUDGET' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                  No Budget Set
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                <span className="text-brand-400">{sym}</span>
                {totalSpentNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {budgetNum !== null && (
                <span className="text-sm font-semibold text-slate-400">
                  of {sym}{budgetNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} target
                </span>
              )}
            </div>

            {/* Velocity Progress Bar */}
            {budgetNum !== null && (
              <div className="space-y-1.5 pt-2 max-w-xl">
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full ${velocityColor} transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.min(100, Math.max(0, pctUsed))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>
                    {remainingBudgetNum !== null && remainingBudgetNum >= 0 ? (
                      <span className="text-emerald-400 font-semibold">
                        {sym}{remainingBudgetNum.toLocaleString()} remaining
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold">
                        {sym}{Math.abs(remainingBudgetNum || 0).toLocaleString()} exceeded
                      </span>
                    )}
                  </span>
                  <span>{pctUsed.toFixed(1)}% of total budget</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg / Person</span>
              <span className="text-sm font-extrabold text-white">
                {sym}{Number(financials.average_per_person).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Daily Average</span>
              <span className="text-sm font-extrabold text-white">
                {sym}{Number(financials.average_daily_spend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {financials.remaining_daily_budget !== null && financials.remaining_daily_budget !== undefined ? (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Daily Allowance</span>
                <span className="text-sm font-extrabold text-emerald-400">
                  {sym}{Number(financials.remaining_daily_budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Timeline</span>
                <span className="text-xs font-bold text-slate-300">
                  {financials.total_days ? `${financials.days_elapsed || 0} / ${financials.total_days} Days` : 'Flexible'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Banner: Settlement Quick Callout */}
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Settlements:</span>
            <span className="text-emerald-400 font-bold">
              {sym}{Number(settlements_summary.total_settled_amount).toLocaleString()} settled ({settlements_summary.settled_count})
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">
              {sym}{Number(settlements_summary.total_pending_amount).toLocaleString()} pending ({settlements_summary.pending_count})
            </span>
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('balances')}
              className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
            >
              View Balances & Settle <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </Card>

      {/* 2. Category Spending Distribution & Daily Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-400" />
              Spending by Category
            </h3>
            <span className="text-xs text-slate-500">{category_breakdown.length} Categories</span>
          </div>

          {category_breakdown.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-slate-400">
              No expenses recorded yet to categorize.
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Multi-segmented distribution bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                {category_breakdown.map((cat, idx) => {
                  const style = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Miscellaneous;
                  const pct = Number(cat.percentage);
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={idx}
                      className={`h-full ${style.bar} transition-all duration-300 hover:opacity-80`}
                      style={{ width: `${pct}%` }}
                      title={`${cat.category}: ${pct.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Category Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {category_breakdown.map(cat => {
                  const style = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Miscellaneous;
                  return (
                    <Card
                      key={cat.category}
                      variant="glass"
                      className="p-3 flex items-center justify-between border-slate-800/80 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${style.bar}`} />
                        <div>
                          <span className="text-xs font-bold text-white block">{cat.category}</span>
                          <span className="text-[10px] text-slate-400">{cat.count} expense{cat.count > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-white block">
                          {sym}{Number(cat.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {Number(cat.percentage).toFixed(1)}%
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Daily Spending Timeline (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Daily Spending Timeline
            </h3>
            <span className="text-xs text-slate-500">{daily_trends.length} active days</span>
          </div>

          {daily_trends.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-slate-400">
              No daily expenses logged yet.
            </Card>
          ) : (
            <Card variant="glass" className="p-4 space-y-4">
              <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2">
                {daily_trends.map(d => {
                  const amtNum = Number(d.amount);
                  const heightPct = Math.max(12, Math.min(100, (amtNum / maxDailyAmount) * 100));
                  const shortDate = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {sym}{amtNum.toLocaleString()}
                      </span>
                      <div 
                        className="w-full max-w-[28px] bg-brand-500/30 group-hover:bg-brand-500 border border-brand-500/50 rounded-t-lg transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] text-slate-500 font-semibold truncate">
                        {shortDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 3. Member Contributions & Largest Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Member Spending Shares (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              Member Spending Contributions
            </h3>
            <span className="text-xs text-slate-500">{member_contributions.length} Members</span>
          </div>

          <div className="space-y-2.5">
            {member_contributions.map(m => {
              const paidNum = Number(m.total_paid);
              const shareNum = Number(m.total_share);
              const netNum = Number(m.net_balance);
              const pct = Number(m.percentage_of_total_paid);

              return (
                <Card
                  key={m.member_id}
                  variant="glass"
                  className="p-3.5 space-y-2 border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                        {m.display_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{m.display_name}</span>
                        <span className="text-[10px] text-slate-400">
                          Paid: {sym}{paidNum.toLocaleString()} ({pct.toFixed(1)}%) • Share: {sym}{shareNum.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {netNum > 0 && (
                        <span className="text-xs font-extrabold text-emerald-400 block">
                          +{sym}{netNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      {netNum < 0 && (
                        <span className="text-xs font-extrabold text-rose-400 block">
                          -{sym}{Math.abs(netNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      {netNum === 0 && (
                        <span className="text-xs font-bold text-slate-400 block">
                          {sym}0.00
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-medium">Net</span>
                    </div>
                  </div>

                  {/* Visual Share Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Largest Expenses (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Largest Expenses
            </h3>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('expenses')}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                View all
              </button>
            )}
          </div>

          {largest_expenses.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-slate-400">
              No expenses recorded yet.
            </Card>
          ) : (
            <div className="space-y-2">
              {largest_expenses.map(e => (
                <Card
                  key={e.id}
                  variant="glass"
                  className="p-3 flex items-center justify-between border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">{e.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {e.category} • Paid by <span className="text-slate-300 font-medium">{e.paid_by_name}</span>
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-white">
                    {sym}{Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
