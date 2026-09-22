import React from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Users, 
  MessageCircle, 
  Edit3, 
  Trash2,
  FileText,
  Utensils,
  Car,
  Fuel,
  Bed,
  Compass,
  Ticket,
  ShoppingBag,
  Coffee,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { ExpenseDetail } from '../../features/expenses/types';
import { openWhatsApp, generateExpenseShareText } from '../../services/whatsapp';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseDetail | null;
  tripName: string;
  tripId: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (expense: ExpenseDetail) => void;
  onDelete: (expenseId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Food: Utensils,
  Transport: Car,
  Fuel: Fuel,
  Stay: Bed,
  Activities: Compass,
  Tickets: Ticket,
  Shopping: ShoppingBag,
  Drinks: Coffee,
  Emergency: AlertCircle,
  Miscellaneous: HelpCircle,
};

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  onClose,
  expense,
  tripName,
  tripId,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !expense) return null;

  const IconComponent = CATEGORY_ICONS[expense.category] || HelpCircle;
  const sym = expense.currency === 'INR' ? '₹' : expense.currency;

  const handleShareWhatsApp = () => {
    const text = generateExpenseShareText(tripName, tripId, {
      title: expense.title,
      amount: expense.amount,
      currency: expense.currency,
      paid_by_name: expense.paid_by_name,
      category: expense.category,
      location_name: expense.location_name,
      notes: expense.notes,
      splits: expense.splits,
    });
    openWhatsApp(text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-lg p-6 space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default" size="sm">{expense.category}</Badge>
                <Badge variant="default" size="sm">Split: {expense.split_method}</Badge>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{expense.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Amount</span>
            <div className="text-3xl font-black text-white">
              <span className="text-brand-400">{sym}</span> {Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Paid by</span>
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 justify-end">
              <CreditCard className="w-3.5 h-3.5" />
              {expense.paid_by_name}
            </div>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <Calendar className="w-4 h-4 text-brand-400" />
            <span>
              {new Date(expense.expense_date).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 truncate">
            <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="truncate">{expense.location_name || 'No location set'}</span>
          </div>
        </div>

        {/* Notes (if any) */}
        {expense.notes && (
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Notes
            </span>
            <p className="text-slate-200">{expense.notes}</p>
          </div>
        )}

        {/* Participants Split Breakdown */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              Participants Breakdown ({expense.splits.length})
            </span>
            <span>Allocated</span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {expense.splits.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                    {s.member_display_name[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium text-white">{s.member_display_name}</span>
                  {s.member_type === 'GUEST' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Guest
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">
                    {sym}{Number(s.amount).toFixed(2)}
                  </span>
                  {expense.split_method === 'PERCENTAGE' && s.split_value && (
                    <span className="text-slate-400 text-[11px] block">
                      ({s.split_value}%)
                    </span>
                  )}
                  {expense.split_method === 'SHARES' && s.split_value && (
                    <span className="text-slate-400 text-[11px] block">
                      ({s.split_value} share)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500"
            leftIcon={<MessageCircle className="w-4 h-4 fill-current" />}
            onClick={handleShareWhatsApp}
          >
            Share on WhatsApp
          </Button>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => {
                  onClose();
                  onEdit(expense);
                }}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${expense.title}"?`)) {
                    onClose();
                    onDelete(expense.id);
                  }
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
