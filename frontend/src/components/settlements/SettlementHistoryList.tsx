import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Trash2, 
  MessageCircle, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { settlementsApi } from '../../features/settlements/api';
import type { Settlement, SettlementsSummary, SettlementStatus } from '../../features/settlements/types';
import { openWhatsApp, generateSettlementReceiptText } from '../../services/whatsapp';

interface SettlementHistoryListProps {
  tripId: string;
  tripName: string;
  currency: string;
  onSettlementChanged: () => void;
  onOpenRecordModal?: () => void;
}

export const SettlementHistoryList: React.FC<SettlementHistoryListProps> = ({
  tripId,
  tripName,
  currency,
  onSettlementChanged,
  onOpenRecordModal,
}) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<SettlementsSummary | null>(null);
  const [filter, setFilter] = useState<'ALL' | SettlementStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const sym = currency === 'INR' ? '₹' : currency;

  const loadSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await settlementsApi.listSettlements(tripId, filter);
      setSettlements(data.settlements);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load settlements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tripId, filter]);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const handleMarkAsPaid = async (s: Settlement) => {
    try {
      setActionLoadingId(s.id);
      await settlementsApi.updateSettlement(tripId, s.id, { status: 'PAID' });
      await loadSettlements();
      onSettlementChanged();
    } catch (err) {
      console.error('Failed to mark settlement as paid:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelSettlement = async (s: Settlement) => {
    if (!window.confirm(`Are you sure you want to cancel this pending payment of ${sym}${Number(s.amount).toLocaleString()}?`)) {
      return;
    }
    try {
      setActionLoadingId(s.id);
      await settlementsApi.updateSettlement(tripId, s.id, { status: 'CANCELLED' });
      await loadSettlements();
      onSettlementChanged();
    } catch (err) {
      console.error('Failed to cancel settlement:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteSettlement = async (s: Settlement) => {
    if (!window.confirm(`Delete this settlement record? If it was marked PAID, the members' net balance will revert.`)) {
      return;
    }
    try {
      setActionLoadingId(s.id);
      await settlementsApi.deleteSettlement(tripId, s.id);
      await loadSettlements();
      onSettlementChanged();
    } catch (err) {
      console.error('Failed to delete settlement:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleShareReceipt = (s: Settlement) => {
    const text = generateSettlementReceiptText(tripName, tripId, {
      from_member_name: s.from_member_name,
      to_member_name: s.to_member_name,
      amount: s.amount,
      currency: s.currency,
      payment_method: s.payment_method,
      payment_date: s.payment_date,
      notes: s.notes,
    });
    openWhatsApp(text);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-800">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Settlement Payment History
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
            {(['ALL', 'PAID', 'PENDING', 'CANCELLED'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filter === tab
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {onOpenRecordModal && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-brand-400 border-brand-500/30 hover:bg-brand-500/10"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={onOpenRecordModal}
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Settled</span>
            <span className="text-base font-extrabold text-emerald-400">
              {sym}{Number(summary.total_settled_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Settled Payments</span>
            <span className="text-base font-extrabold text-white">
              {summary.settled_count}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending Transfers</span>
            <span className="text-base font-extrabold text-amber-400">
              {sym}{Number(summary.total_pending_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending Count</span>
            <span className="text-base font-extrabold text-white">
              {summary.pending_count}
            </span>
          </div>
        </div>
      )}

      {/* List Content */}
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <Spinner size="md" />
        </div>
      ) : settlements.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800/80">
          <p className="text-xs text-slate-400">
            No settlement payments recorded under this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {settlements.map(s => {
            const isPaid = s.status === 'PAID';
            const isPending = s.status === 'PENDING';
            const isCancelled = s.status === 'CANCELLED';
            const isBusy = actionLoadingId === s.id;

            return (
              <Card
                key={s.id}
                variant="glass"
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-800/80 hover:border-slate-700/80 transition-all"
              >
                {/* Left: Direction & Notes */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {s.from_member_name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">paid</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-xs font-bold text-white">
                      {s.to_member_name}
                    </span>

                    {/* Status Badge */}
                    {isPaid && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Cancelled
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    {s.payment_method && (
                      <span className="text-slate-300">Method: {s.payment_method}</span>
                    )}
                    {s.payment_date && (
                      <span>Date: {new Date(s.payment_date).toLocaleDateString()}</span>
                    )}
                    {s.notes && (
                      <span className="text-slate-400 italic">"{s.notes}"</span>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="text-sm font-extrabold text-white">
                    {sym}{Number(s.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                          disabled={isBusy}
                          onClick={() => handleMarkAsPaid(s)}
                        >
                          Mark Paid
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] py-1 px-2 text-slate-400 hover:text-white"
                          disabled={isBusy}
                          onClick={() => handleCancelSettlement(s)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {isPaid && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] py-1 px-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        leftIcon={<MessageCircle className="w-3.5 h-3.5 fill-current" />}
                        onClick={() => handleShareReceipt(s)}
                        title="Share payment receipt on WhatsApp"
                      >
                        Receipt
                      </Button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDeleteSettlement(s)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete settlement record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
