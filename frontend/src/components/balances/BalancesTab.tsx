import React from 'react';
import { 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  MessageCircle, 
  Users, 
  ShieldCheck
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import type { TripBalanceSummary, SettlementSuggestion } from '../../features/balances/types';
import { 
  openWhatsApp, 
  generateSettlementShareText, 
  generateTripSettlementSheetText 
} from '../../services/whatsapp';
import { SettlementHistoryList } from '../settlements/SettlementHistoryList';
import { CreditCard } from 'lucide-react';

interface BalancesTabProps {
  balancesSummary: TripBalanceSummary | null;
  isLoading: boolean;
  tripName: string;
  tripId: string;
  onRecordPaymentClick?: (fromMemberId: string, toMemberId: string, amount: number) => void;
  onRefreshBalances?: () => void;
}

export const BalancesTab: React.FC<BalancesTabProps> = ({
  balancesSummary,
  isLoading,
  tripName,
  tripId,
  onRecordPaymentClick,
  onRefreshBalances,
}) => {
  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Computing financial ledger and debt minimization...</p>
      </div>
    );
  }

  if (!balancesSummary) {
    return (
      <div className="py-12 text-center text-slate-400">
        Unable to calculate balances at this time.
      </div>
    );
  }

  const { currency, total_spent, is_balanced, balances, settlement_suggestions } = balancesSummary;
  const sym = currency === 'INR' ? '₹' : currency;

  const handleShareAllSettlements = () => {
    const text = generateTripSettlementSheetText(tripName, tripId, settlement_suggestions, currency);
    openWhatsApp(text);
  };

  const handleShareSuggestion = (suggestion: SettlementSuggestion) => {
    const text = generateSettlementShareText(tripName, tripId, suggestion, currency);
    openWhatsApp(text);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Invariant Check & Full Share */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Financial Ledger Status
              </span>
              {is_balanced ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Balanced (Sum = {sym}0.00) ✓
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Rebalancing Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Net balance for each member equals <span className="text-slate-300 font-medium">Total Paid - Total Share</span> (Total Spent: {sym}{Number(total_spent).toLocaleString()})
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 text-xs shrink-0"
          leftIcon={<MessageCircle className="w-4 h-4 fill-current" />}
          onClick={handleShareAllSettlements}
        >
          Share Settlement Sheet
        </Button>
      </div>

      {/* Grid: Member Balances Leaderboard & Minimized Settlement Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Member Net Balances (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              Member Balances ({balances.length})
            </h3>
            <span className="text-xs text-slate-500">Net Position</span>
          </div>

          <div className="space-y-2.5">
            {balances.map(m => {
              const netNum = Number(m.net_balance);
              const isReceiving = netNum > 0;
              const isOwing = netNum < 0;
              const isSettled = netNum === 0;

              return (
                <Card
                  key={m.member_id}
                  variant="glass"
                  className="p-3.5 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                        {m.display_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white">
                            {m.display_name}
                          </span>
                          {m.member_type === 'GUEST' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Guest
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          Paid {sym}{Number(m.total_paid).toLocaleString()} • Share {sym}{Number(m.total_share).toLocaleString()}
                        </span>
                        {((Number(m.settlement_paid || 0) > 0) || (Number(m.settlement_received || 0) > 0)) && (
                          <span className="text-[10px] text-emerald-400/90 block font-medium">
                            Settled: {Number(m.settlement_paid || 0) > 0 ? `Paid ${sym}${Number(m.settlement_paid).toLocaleString()}` : ''}
                            {Number(m.settlement_paid || 0) > 0 && Number(m.settlement_received || 0) > 0 ? ' • ' : ''}
                            {Number(m.settlement_received || 0) > 0 ? `Received ${sym}${Number(m.settlement_received).toLocaleString()}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {isReceiving && (
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-400 block">
                            +{sym}{netNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-emerald-400/80 font-medium">Gets back</span>
                        </div>
                      )}
                      {isOwing && (
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-rose-400 block">
                            -{sym}{Math.abs(netNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-rose-400/80 font-medium">Owes</span>
                        </div>
                      )}
                      {isSettled && (
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-400 block">
                            {sym}0.00
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Settled</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Minimized Debt Settlement Suggestions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Suggested Settlements ({settlement_suggestions.length})
            </h3>
            <span className="text-xs text-slate-500">Minimized graph transfers</span>
          </div>

          {settlement_suggestions.length === 0 ? (
            <Card variant="glass" className="p-8 text-center space-y-3 border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">All Balances Settled!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Every member is squared away. There are zero outstanding debts or pending transfers for this trip.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {settlement_suggestions.map((s, idx) => (
                <Card
                  key={idx}
                  variant="glass"
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Debtor */}
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">
                        {s.from_member_name}
                      </span>
                      <span className="text-[10px] text-rose-400 uppercase font-semibold">
                        Debtor (Owes)
                      </span>
                    </div>

                    {/* Flow arrow */}
                    <div className="flex flex-col items-center px-2">
                      <div className="text-[10px] text-slate-400 font-medium">pays</div>
                      <ArrowRight className="w-4 h-4 text-brand-400 animate-pulse" />
                    </div>

                    {/* Creditor */}
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">
                        {s.to_member_name}
                      </span>
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                        Creditor (Receives)
                      </span>
                    </div>
                  </div>

                  {/* Transfer Amount & CTAs */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 flex-wrap">
                    <div className="text-right mr-1">
                      <span className="text-base font-black text-white">
                        <span className="text-brand-400">{sym}</span>
                        {Number(s.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {onRecordPaymentClick && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs py-1.5 px-3 bg-brand-600 hover:bg-brand-500 text-white shadow-sm shrink-0"
                        leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                        onClick={() => onRecordPaymentClick(s.from_member_id, s.to_member_id, Number(s.amount))}
                      >
                        Record Payment
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 text-xs shrink-0 py-1.5 px-2.5"
                      leftIcon={<MessageCircle className="w-3.5 h-3.5 fill-current" />}
                      onClick={() => handleShareSuggestion(s)}
                      title="Share this settlement suggestion on WhatsApp"
                    >
                      Remind
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Recorded Settlement Payments History */}
      <SettlementHistoryList
        tripId={tripId}
        tripName={tripName}
        currency={currency}
        onSettlementChanged={onRefreshBalances || (() => {})}
        onOpenRecordModal={onRecordPaymentClick ? () => onRecordPaymentClick('', '', 0) : undefined}
      />
    </div>
  );
};
