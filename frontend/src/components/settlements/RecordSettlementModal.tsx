import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  HelpCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { settlementsApi } from '../../features/settlements/api';
import type { SettlementCreate } from '../../features/settlements/types';

interface MemberOption {
  id: string;
  display_name: string;
  member_type?: string;
}

interface RecordSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettlementRecorded: () => void;
  tripId: string;
  currency: string;
  members: MemberOption[];
  initialFromMemberId?: string;
  initialToMemberId?: string;
  initialAmount?: number;
}

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI / GPay', icon: Smartphone },
  { id: 'Cash', label: 'Cash', icon: Banknote },
  { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building2 },
  { id: 'Card', label: 'Card', icon: CreditCard },
  { id: 'Other', label: 'Other', icon: HelpCircle },
];

export const RecordSettlementModal: React.FC<RecordSettlementModalProps> = ({
  isOpen,
  onClose,
  onSettlementRecorded,
  tripId,
  currency,
  members,
  initialFromMemberId,
  initialToMemberId,
  initialAmount,
}) => {
  const [fromMemberId, setFromMemberId] = useState('');
  const [toMemberId, setToMemberId] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [status, setStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sym = currency === 'INR' ? '₹' : currency;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFromMemberId(initialFromMemberId || (members[0]?.id || ''));
      setToMemberId(initialToMemberId || (members[1]?.id || members[0]?.id || ''));
      setAmount(initialAmount ? String(initialAmount) : '');
      setPaymentMethod('UPI');
      setStatus('PAID');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
  }, [isOpen, initialFromMemberId, initialToMemberId, initialAmount, members]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromMemberId || !toMemberId) {
      setError('Please select both the paying member and the recipient.');
      return;
    }

    if (fromMemberId === toMemberId) {
      setError('Payer and recipient cannot be the same person.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SettlementCreate = {
        from_member_id: fromMemberId,
        to_member_id: toMemberId,
        amount: numAmount,
        currency,
        status,
        payment_method: paymentMethod,
        payment_date: paymentDate ? new Date(paymentDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
      };

      await settlementsApi.recordSettlement(tripId, payload);
      onSettlementRecorded();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to record settlement.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromMemberName = members.find(m => m.id === fromMemberId)?.display_name || 'Debtor';
  const toMemberName = members.find(m => m.id === toMemberId)?.display_name || 'Creditor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Settlement Payment</h3>
              <p className="text-xs text-slate-400">Record a debt payoff between trip companions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Visual Direction */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex-1 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Who Paid (Debtor)</span>
              <span className="text-sm font-bold text-white truncate block">{fromMemberName}</span>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <span className="text-[10px] text-brand-400 font-semibold">
                {amount ? `${sym}${Number(amount).toLocaleString()}` : `${sym}0.00`}
              </span>
              <ArrowRight className="w-4 h-4 text-brand-400" />
            </div>
            <div className="flex-1 text-center sm:text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Who Received (Creditor)</span>
              <span className="text-sm font-bold text-white truncate block">{toMemberName}</span>
            </div>
          </div>

          {/* Members Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payer (Owes Debt) *
              </label>
              <select
                value={fromMemberId}
                onChange={e => setFromMemberId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                required
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.display_name} {m.member_type === 'GUEST' ? '(Guest)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Recipient (Receives) *
              </label>
              <select
                value={toMemberId}
                onChange={e => setToMemberId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                required
              >
                {members.map(m => (
                  <option key={m.id} value={m.id} disabled={m.id === fromMemberId}>
                    {m.display_name} {m.id === fromMemberId ? '(Cannot be same)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Settlement Amount ({sym}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                {sym}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map(pm => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm shadow-brand-500/20'
                        : 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="truncate w-full text-center text-[11px]">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Settlement Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('PAID')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    status === 'PAID'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Paid Now
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('PENDING')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    status === 'PENDING'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Pending
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {status === 'PAID' ? 'Immediately updates net balances' : 'Saved as an upcoming payment reminder'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes / Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., GPay ref #92831 or dinner settlement"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
