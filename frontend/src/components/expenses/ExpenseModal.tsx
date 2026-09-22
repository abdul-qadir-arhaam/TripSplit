import React, { useState, useEffect } from 'react';
import { 
  X, 
  Receipt, 
  MapPin, 
  Check, 
  AlertCircle,
  Utensils,
  Car,
  Fuel,
  Bed,
  Compass,
  Ticket,
  ShoppingBag,
  Coffee,
  HelpCircle,
  Users,
  User,
  Sparkles
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import type { TripMember } from '../../features/trips/types';
import type { 
  ExpenseDetail, 
  ExpenseCreate, 
  ExpenseUpdate, 
  SplitMethod, 
  ExpenseCategory,
  SplitItemInput,
  ExpensePayerInput
} from '../../features/expenses/types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseCreate | ExpenseUpdate) => Promise<void>;
  tripMembers: TripMember[];
  currency: string;
  defaultPayerId?: string;
  initialExpense?: ExpenseDetail | null;
}

const CATEGORIES: { label: ExpenseCategory; icon: React.FC<{ className?: string }>; color: string }[] = [
  { label: 'Food', icon: Utensils, color: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10' },
  { label: 'Transport', icon: Car, color: 'text-sky-400 border-sky-500/30 hover:bg-sky-500/10' },
  { label: 'Fuel', icon: Fuel, color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10' },
  { label: 'Stay', icon: Bed, color: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10' },
  { label: 'Activities', icon: Compass, color: 'text-purple-400 border-purple-500/30 hover:bg-purple-500/10' },
  { label: 'Tickets', icon: Ticket, color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' },
  { label: 'Shopping', icon: ShoppingBag, color: 'text-pink-400 border-pink-500/30 hover:bg-pink-500/10' },
  { label: 'Drinks', icon: Coffee, color: 'text-violet-400 border-violet-500/30 hover:bg-violet-500/10' },
  { label: 'Emergency', icon: AlertCircle, color: 'text-rose-400 border-rose-500/30 hover:bg-rose-500/10' },
  { label: 'Miscellaneous', icon: HelpCircle, color: 'text-slate-400 border-slate-700 hover:bg-slate-800' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tripMembers,
  currency,
  defaultPayerId,
  initialExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [paidByMemberId, setPaidByMemberId] = useState('');
  const [payerMode, setPayerMode] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
  const [selectedPayerIds, setSelectedPayerIds] = useState<string[]>([]);
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});
  const [expenseDate, setExpenseDate] = useState('');
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL');

  // Split configurations
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialExpense) {
      setTitle(initialExpense.title);
      setAmount(String(initialExpense.amount));
      setCategory((initialExpense.category as ExpenseCategory) || 'Food');
      setExpenseDate(initialExpense.expense_date ? initialExpense.expense_date.substring(0, 10) : '');
      setLocationName(initialExpense.location_name || '');
      setNotes(initialExpense.notes || '');
      setSplitMethod(initialExpense.split_method || 'EQUAL');

      // Payers initialization
      if (initialExpense.payers && initialExpense.payers.length > 1) {
        setPayerMode('MULTIPLE');
        const pIds = initialExpense.payers.map(p => p.member_id);
        setSelectedPayerIds(pIds);
        const pMap: Record<string, string> = {};
        initialExpense.payers.forEach(p => {
          pMap[p.member_id] = String(p.amount);
        });
        setPayerAmounts(pMap);
        setPaidByMemberId(initialExpense.paid_by_member_id);
      } else {
        setPayerMode('SINGLE');
        setPaidByMemberId(initialExpense.paid_by_member_id || defaultPayerId || tripMembers[0]?.id || '');
        setSelectedPayerIds(tripMembers.map(m => m.id));
        setPayerAmounts({});
      }

      const splitIds = initialExpense.splits.map(s => s.member_id);
      setSelectedMemberIds(splitIds);

      const exactMap: Record<string, string> = {};
      const pctMap: Record<string, string> = {};
      const sharesMap: Record<string, string> = {};

      initialExpense.splits.forEach(s => {
        exactMap[s.member_id] = String(s.amount);
        if (s.split_value) {
          pctMap[s.member_id] = String(s.split_value);
          sharesMap[s.member_id] = String(s.split_value);
        }
      });
      setExactAmounts(exactMap);
      setPercentages(pctMap);
      setShares(sharesMap);
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food');
      const defaultPayer = defaultPayerId || tripMembers[0]?.id || '';
      setPaidByMemberId(defaultPayer);
      setPayerMode('SINGLE');
      setSelectedPayerIds(tripMembers.map(m => m.id));
      setPayerAmounts({});
      setExpenseDate(new Date().toISOString().substring(0, 10));
      setLocationName('');
      setNotes('');
      setSplitMethod('EQUAL');

      // Default all active members selected for Equal split
      const allIds = tripMembers.map(m => m.id);
      setSelectedMemberIds(allIds);

      const defaultShares: Record<string, string> = {};
      allIds.forEach(id => { defaultShares[id] = '1'; });
      setShares(defaultShares);

      setExactAmounts({});
      setPercentages({});
    }
    setValidationError(null);
  }, [isOpen, initialExpense, tripMembers, defaultPayerId]);

  if (!isOpen) return null;

  const totalNum = parseFloat(amount) || 0;

  // Calculate live split summaries
  const handleMemberToggle = (memberId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(tripMembers.map(m => m.id));
  };

  const handleDeselectAll = () => {
    setSelectedMemberIds([]);
  };

  const handleAmountChange = (newAmountStr: string) => {
    setAmount(newAmountStr);
    const newTotal = parseFloat(newAmountStr) || 0;
    if (newTotal > 0 && splitMethod === 'EXACT' && tripMembers.length >= 2) {
      setExactAmounts(prev => {
        const nonZeroMembers = tripMembers.filter(m => {
          const v = parseFloat(prev[m.id] || '0');
          return !isNaN(v) && v > 0;
        });
        if (nonZeroMembers.length === 1 && tripMembers.length === 2) {
          const m1 = nonZeroMembers[0];
          const m2 = tripMembers.find(m => m.id !== m1.id)!;
          const val1 = parseFloat(prev[m1.id] || '0');
          const rem = Math.max(0, newTotal - val1);
          return {
            ...prev,
            [m2.id]: Number.isInteger(rem) ? String(rem) : rem.toFixed(2),
          };
        } else if (nonZeroMembers.length === tripMembers.length) {
          const lastMember = tripMembers[tripMembers.length - 1];
          const sumOthers = tripMembers
            .filter(m => m.id !== lastMember.id)
            .reduce((sum, m) => sum + (parseFloat(prev[m.id] || '0') || 0), 0);
          const rem = Math.max(0, newTotal - sumOthers);
          return {
            ...prev,
            [lastMember.id]: Number.isInteger(rem) ? String(rem) : rem.toFixed(2),
          };
        }
        return prev;
      });
    }

    if (newTotal > 0 && payerMode === 'MULTIPLE' && selectedPayerIds.length >= 2) {
      setPayerAmounts(prev => {
        const nonZeroPayers = selectedPayerIds.filter(id => {
          const v = parseFloat(prev[id] || '0');
          return !isNaN(v) && v > 0;
        });
        if (nonZeroPayers.length === 1 && selectedPayerIds.length === 2) {
          const p1 = nonZeroPayers[0];
          const p2 = selectedPayerIds.find(id => id !== p1)!;
          const val1 = parseFloat(prev[p1] || '0');
          const rem = Math.max(0, newTotal - val1);
          return {
            ...prev,
            [p2]: Number.isInteger(rem) ? String(rem) : rem.toFixed(2),
          };
        } else if (nonZeroPayers.length === selectedPayerIds.length) {
          const lastPayerId = selectedPayerIds[selectedPayerIds.length - 1];
          const sumOthers = selectedPayerIds
            .filter(id => id !== lastPayerId)
            .reduce((sum, id) => sum + (parseFloat(prev[id] || '0') || 0), 0);
          const rem = Math.max(0, newTotal - sumOthers);
          return {
            ...prev,
            [lastPayerId]: Number.isInteger(rem) ? String(rem) : rem.toFixed(2),
          };
        }
        return prev;
      });
    }
  };

  const handlePayerToggle = (memberId: string) => {
    setSelectedPayerIds(prev => {
      const isSelected = prev.includes(memberId);
      if (isSelected) {
        const next = prev.filter(id => id !== memberId);
        setPayerAmounts(curr => {
          const copy = { ...curr };
          delete copy[memberId];
          return copy;
        });
        return next;
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAllPayers = () => {
    setSelectedPayerIds(tripMembers.map(m => m.id));
  };

  const handleSplitEvenlyPayers = () => {
    if (selectedPayerIds.length === 0 || totalNum <= 0) return;
    const count = selectedPayerIds.length;
    const baseShare = Math.floor((totalNum / count) * 100) / 100;
    const remainder = Math.round((totalNum - (baseShare * count)) * 100) / 100;

    const newMap: Record<string, string> = {};
    selectedPayerIds.forEach((id, idx) => {
      const amt = idx === 0 ? (baseShare + remainder).toFixed(2) : baseShare.toFixed(2);
      newMap[id] = Number.isInteger(parseFloat(amt)) ? String(parseFloat(amt)) : amt;
    });
    setPayerAmounts(newMap);
  };

  const handlePayerAmountChange = (changedMemberId: string, val: string) => {
    setPayerAmounts(prev => {
      const updated = { ...prev, [changedMemberId]: val };
      if (totalNum <= 0 || selectedPayerIds.length < 2) return updated;

      const changedVal = parseFloat(val);
      if (val === '' || isNaN(changedVal)) return updated;

      const otherPayerIds = selectedPayerIds.filter(id => id !== changedMemberId);

      // Case 1: Exactly 2 payers
      if (otherPayerIds.length === 1) {
        const otherId = otherPayerIds[0];
        const remaining = Math.max(0, totalNum - changedVal);
        const formatted = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(2);
        updated[otherId] = formatted;
        return updated;
      }

      // Case 2: 3+ payers, check if exactly 1 other is empty
      const emptyOthers = otherPayerIds.filter(id => !updated[id] || updated[id].trim() === '');
      if (emptyOthers.length === 1) {
        const targetId = emptyOthers[0];
        const sumFilled = selectedPayerIds
          .filter(id => id !== targetId)
          .reduce((sum, id) => sum + (parseFloat(updated[id] || '0') || 0), 0);
        const remaining = Math.max(0, totalNum - sumFilled);
        const formatted = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(2);
        updated[targetId] = formatted;
        return updated;
      }

      // Case 3: All others have values, update last other
      if (emptyOthers.length === 0) {
        const lastOtherId = otherPayerIds[otherPayerIds.length - 1];
        const sumOthersExcludingLast = selectedPayerIds
          .filter(id => id !== lastOtherId)
          .reduce((sum, id) => sum + (parseFloat(updated[id] || '0') || 0), 0);
        const remaining = Math.max(0, totalNum - sumOthersExcludingLast);
        const formatted = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(2);
        updated[lastOtherId] = formatted;
        return updated;
      }

      return updated;
    });
  };

  const handleFillRemainingPayer = (memberId: string) => {
    const sumOthers = selectedPayerIds
      .filter(id => id !== memberId)
      .reduce((sum, id) => sum + (parseFloat(payerAmounts[id] || '0') || 0), 0);
    const remaining = Math.max(0, totalNum - sumOthers);
    const formatted = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(2);
    setPayerAmounts(prev => ({ ...prev, [memberId]: formatted }));
  };

  const handleExactAmountChange = (changedMemberId: string, val: string) => {
    setExactAmounts(prev => {
      const updated = { ...prev, [changedMemberId]: val };

      if (totalNum <= 0 || tripMembers.length < 2) {
        return updated;
      }

      const changedVal = parseFloat(val);
      if (val === '' || isNaN(changedVal)) {
        return updated;
      }

      const otherMembers = tripMembers.filter(m => m.id !== changedMemberId);

      // Case 1: Exactly 2 members in the trip
      if (otherMembers.length === 1) {
        const other = otherMembers[0];
        const remaining = Math.max(0, totalNum - changedVal);
        const formatted = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(2);
        updated[other.id] = formatted;
        return updated;
      }

      // Case 2: 3 or more members, check if exactly 1 other member is empty
      const emptyOthers = otherMembers.filter(m => !updated[m.id] || updated[m.id].trim() === '');
      if (emptyOthers.length === 1) {
        const targetMember = emptyOthers[0];
        const sumOfFilled = tripMembers
          .filter(m => m.id !== targetMember.id)
          .reduce((sum, m) => sum + (parseFloat(updated[m.id] || '0') || 0), 0);
        const remaining = Math.max(0, totalNum - sumOfFilled);
        const formatted = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(2);
        updated[targetMember.id] = formatted;
        return updated;
      }

      // Case 3: All other members already have values; update the last other member to absorb remainder
      if (emptyOthers.length === 0) {
        const lastOtherMember = otherMembers[otherMembers.length - 1];
        const sumOthersExcludingLast = tripMembers
          .filter(m => m.id !== lastOtherMember.id)
          .reduce((sum, m) => sum + (parseFloat(updated[m.id] || '0') || 0), 0);
        const remaining = Math.max(0, totalNum - sumOthersExcludingLast);
        const formatted = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(2);
        updated[lastOtherMember.id] = formatted;
        return updated;
      }

      return updated;
    });
  };

  const handleFillRemaining = (memberId: string) => {
    const sumOthers = tripMembers
      .filter(m => m.id !== memberId)
      .reduce((sum, m) => sum + (parseFloat(exactAmounts[m.id] || '0') || 0), 0);
    const remaining = Math.max(0, totalNum - sumOthers);
    const formatted = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(2);
    setExactAmounts(prev => ({ ...prev, [memberId]: formatted }));
  };

  const handlePercentageChange = (changedMemberId: string, val: string) => {
    setPercentages(prev => {
      const updated = { ...prev, [changedMemberId]: val };
      if (tripMembers.length < 2) return updated;

      const changedVal = parseFloat(val);
      if (val === '' || isNaN(changedVal)) return updated;

      const otherMembers = tripMembers.filter(m => m.id !== changedMemberId);

      if (otherMembers.length === 1) {
        const other = otherMembers[0];
        const remaining = Math.max(0, 100 - changedVal);
        updated[other.id] = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(1);
        return updated;
      }

      const emptyOthers = otherMembers.filter(m => !updated[m.id] || updated[m.id].trim() === '');
      if (emptyOthers.length === 1) {
        const targetMember = emptyOthers[0];
        const sumFilled = tripMembers
          .filter(m => m.id !== targetMember.id)
          .reduce((sum, m) => sum + (parseFloat(updated[m.id] || '0') || 0), 0);
        const remaining = Math.max(0, 100 - sumFilled);
        updated[targetMember.id] = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(1);
        return updated;
      }

      if (emptyOthers.length === 0) {
        const lastOtherMember = otherMembers[otherMembers.length - 1];
        const sumOthersExcludingLast = tripMembers
          .filter(m => m.id !== lastOtherMember.id)
          .reduce((sum, m) => sum + (parseFloat(updated[m.id] || '0') || 0), 0);
        const remaining = Math.max(0, 100 - sumOthersExcludingLast);
        updated[lastOtherMember.id] = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(1);
        return updated;
      }

      return updated;
    });
  };

  // Validation checks for split allocations
  const getSplitValidation = (): { isValid: boolean; message?: string } => {
    if (totalNum <= 0) return { isValid: false, message: 'Expense amount must be greater than 0' };

    if (splitMethod === 'EQUAL') {
      if (selectedMemberIds.length === 0) {
        return { isValid: false, message: 'Select at least one member to split the cost' };
      }
      return { isValid: true };
    }

    if (splitMethod === 'EXACT') {
      const sumExact = tripMembers.reduce((sum, m) => {
        const val = parseFloat(exactAmounts[m.id] || '0') || 0;
        return sum + val;
      }, 0);
      const diff = Math.abs(sumExact - totalNum);
      if (diff > 0.01) {
        return { 
          isValid: false, 
          message: `Exact allocations sum (${currency === 'INR' ? '₹' : currency}${sumExact.toFixed(2)}) must equal total (${currency === 'INR' ? '₹' : currency}${totalNum.toFixed(2)})` 
        };
      }
      return { isValid: true };
    }

    if (splitMethod === 'PERCENTAGE') {
      const sumPct = tripMembers.reduce((sum, m) => {
        const val = parseFloat(percentages[m.id] || '0') || 0;
        return sum + val;
      }, 0);
      if (Math.abs(sumPct - 100) > 0.05) {
        return { isValid: false, message: `Percentages must equal 100% (currently ${sumPct.toFixed(1)}%)` };
      }
      return { isValid: true };
    }

    if (splitMethod === 'SHARES') {
      const sumShares = tripMembers.reduce((sum, m) => {
        const val = parseFloat(shares[m.id] || '0') || 0;
        return sum + val;
      }, 0);
      if (sumShares <= 0) {
        return { isValid: false, message: 'Total shares must be greater than 0' };
      }
      return { isValid: true };
    }

    return { isValid: true };
  };

  const splitValidation = getSplitValidation();

  const getPayerValidation = (): { isValid: boolean; message?: string } => {
    if (totalNum <= 0) return { isValid: false, message: 'Expense amount must be greater than 0' };

    if (payerMode === 'SINGLE') {
      if (!paidByMemberId) return { isValid: false, message: 'Please select who paid for this expense.' };
      return { isValid: true };
    }

    if (selectedPayerIds.length === 0) {
      return { isValid: false, message: 'Select at least one contributor who paid.' };
    }

    const sumPaid = selectedPayerIds.reduce((sum, id) => {
      const val = parseFloat(payerAmounts[id] || '0') || 0;
      return sum + val;
    }, 0);

    const hasZeroOrNegative = selectedPayerIds.some(id => {
      const val = parseFloat(payerAmounts[id] || '0') || 0;
      return val <= 0;
    });

    if (hasZeroOrNegative) {
      return { isValid: false, message: 'Each selected contributor must have a paid amount greater than 0.' };
    }

    const diff = Math.abs(sumPaid - totalNum);
    if (diff > 0.01) {
      return {
        isValid: false,
        message: `Contributors total (${currSym}${sumPaid.toFixed(2)}) must equal expense amount (${currSym}${totalNum.toFixed(2)})`
      };
    }

    return { isValid: true };
  };

  const payerValidation = getPayerValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please provide a title for the expense.');
      return;
    }
    if (totalNum <= 0) {
      setValidationError('Please enter a valid amount.');
      return;
    }
    if (!payerValidation.isValid) {
      setValidationError(payerValidation.message || 'Please check contributor payment amounts.');
      return;
    }
    if (!splitValidation.isValid) {
      setValidationError(splitValidation.message || 'Please check split allocations.');
      return;
    }

    // Build payers payload
    let payersPayload: ExpensePayerInput[] | undefined = undefined;
    let primaryPayerId = paidByMemberId;

    if (payerMode === 'MULTIPLE') {
      payersPayload = selectedPayerIds.map(id => ({
        member_id: id,
        amount: parseFloat(payerAmounts[id] || '0') || 0,
      }));
      const highest = payersPayload.reduce((max, p) => (p.amount as number) > (max.amount as number) ? p : max, payersPayload[0]);
      primaryPayerId = highest.member_id;
    }

    // Build splits payload
    const splitsPayload: SplitItemInput[] = [];

    if (splitMethod === 'EQUAL') {
      selectedMemberIds.forEach(id => {
        splitsPayload.push({ member_id: id });
      });
    } else if (splitMethod === 'EXACT') {
      tripMembers.forEach(m => {
        const val = parseFloat(exactAmounts[m.id] || '0') || 0;
        if (val > 0) {
          splitsPayload.push({ member_id: m.id, amount: val });
        }
      });
    } else if (splitMethod === 'PERCENTAGE') {
      tripMembers.forEach(m => {
        const val = parseFloat(percentages[m.id] || '0') || 0;
        if (val > 0) {
          splitsPayload.push({ member_id: m.id, percentage: val });
        }
      });
    } else if (splitMethod === 'SHARES') {
      tripMembers.forEach(m => {
        const val = parseFloat(shares[m.id] || '0') || 0;
        if (val > 0) {
          splitsPayload.push({ member_id: m.id, shares: val });
        }
      });
    }

    const payload: ExpenseCreate = {
      title: title.trim(),
      amount: totalNum,
      currency: currency || 'INR',
      category,
      paid_by_member_id: primaryPayerId,
      payers: payersPayload,
      split_method: splitMethod,
      expense_date: expenseDate ? new Date(expenseDate).toISOString() : undefined,
      location_name: locationName.trim() || undefined,
      notes: notes.trim() || undefined,
      splits: splitsPayload,
    };

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setValidationError(err.response?.data?.detail || 'Failed to save expense. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currSym = currency === 'INR' ? '₹' : currency;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <Card variant="glass" className="w-full max-w-2xl p-6 space-y-5 animate-slide-up my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <p className="text-xs text-slate-400">
                Record shared spending and choose how it is divided
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Top Row: Title & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Expense Title"
                placeholder="e.g. Fort Kochi Seafood Dinner"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Amount ({currSym})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400 font-bold">
                  {currSym}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => handleAmountChange(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white font-bold placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const isSelected = category === c.label;
                const IconComponent = c.icon;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCategory(c.label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-400' : ''}`} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paid By Section */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Paid By
                </label>
                <p className="text-[11px] text-slate-400">
                  {payerMode === 'SINGLE'
                    ? 'One person covered the bill'
                    : 'Multiple members contributed towards this bill'}
                </p>
              </div>

              {/* Single / Multiple Mode Toggle */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPayerMode('SINGLE')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    payerMode === 'SINGLE'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Single Payer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayerMode('MULTIPLE');
                    if (selectedPayerIds.length === 0) {
                      setSelectedPayerIds(tripMembers.map(m => m.id));
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    payerMode === 'MULTIPLE'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Multiple People
                </button>
              </div>
            </div>

            {/* Mode 1: Single Payer */}
            {payerMode === 'SINGLE' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select
                    value={paidByMemberId}
                    onChange={e => setPaidByMemberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                    required
                  >
                    {tripMembers.map(m => (
                      <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                        {m.display_name} {m.member_type === 'GUEST' ? '(Guest)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 [color-scheme:dark]"
                  />
                </div>
              </div>
            ) : (
              /* Mode 2: Multiple Contributors */
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                {/* Date Input & Actions for Multiple Mode */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Expense Date:</span>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={e => setExpenseDate(e.target.value)}
                      className="px-2.5 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500 [color-scheme:dark]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPayers}
                      className="text-brand-400 hover:underline text-xs"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleSplitEvenlyPayers}
                      className="text-emerald-400 hover:underline text-xs flex items-center gap-1"
                      title="Evenly divide the total expense among selected contributors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Split Evenly
                    </button>
                  </div>
                </div>

                {/* Contributors Selection Checkboxes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {tripMembers.map(m => {
                    const isSelected = selectedPayerIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handlePayerToggle(m.id)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-white font-medium'
                            : 'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{m.display_name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Amount Inputs for Each Selected Payer */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Enter payment amounts:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${payerValidation.isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        Paid: {currSym}
                        {selectedPayerIds.reduce((sum, id) => sum + (parseFloat(payerAmounts[id] || '0') || 0), 0).toFixed(2)}{' '}
                        / {currSym}{totalNum.toFixed(2)}
                      </span>
                      {payerValidation.isValid && (
                        <span className="text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          Balanced ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {tripMembers
                    .filter(m => selectedPayerIds.includes(m.id))
                    .map(m => {
                      const currentVal = parseFloat(payerAmounts[m.id] || '0') || 0;
                      const totalAllocated = selectedPayerIds.reduce((sum, id) => sum + (parseFloat(payerAmounts[id] || '0') || 0), 0);
                      const remainingToTotal = Math.max(0, totalNum - (totalAllocated - currentVal));

                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                              {m.display_name[0]?.toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-white truncate max-w-[130px]">
                              {m.display_name}
                            </span>
                            {m.member_type === 'GUEST' && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Guest
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {totalNum > 0 && Math.abs(totalAllocated - totalNum) > 0.01 && (
                              <button
                                type="button"
                                onClick={() => handleFillRemainingPayer(m.id)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 transition-colors shrink-0"
                                title={`Auto-fill remaining ${currSym}${remainingToTotal.toFixed(2)} for ${m.display_name}`}
                              >
                                Auto-fill {currSym}{remainingToTotal.toFixed(2)}
                              </button>
                            )}
                            <div className="flex items-center gap-1.5 w-28">
                              <span className="text-xs text-slate-400">{currSym}</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={payerAmounts[m.id] || ''}
                                onChange={e => handlePayerAmountChange(m.id, e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white text-right font-medium focus:border-brand-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Optional: Location & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Location (Optional)"
              placeholder="e.g. Fort Kochi, Kerala"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4 text-slate-500" />}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Split with tip included"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Split Mode Selector Tabs */}
          <div className="pt-2 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-400" />
                  Split Allocation
                </h3>
                <p className="text-xs text-slate-400">Choose how this expense is shared among companions</p>
              </div>

              {/* Split method tabs */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                {(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'] as SplitMethod[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSplitMethod(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      splitMethod === mode
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode === 'EQUAL' && 'Equal'}
                    {mode === 'EXACT' && 'Exact'}
                    {mode === 'PERCENTAGE' && '%'}
                    {mode === 'SHARES' && 'Shares'}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Mode 1: EQUAL */}
            {splitMethod === 'EQUAL' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400">
                    Split among {selectedMemberIds.length} person(s):{' '}
                    <span className="text-emerald-400 font-bold">
                      {selectedMemberIds.length > 0 && totalNum > 0
                        ? `${currSym}${(totalNum / selectedMemberIds.length).toFixed(2)} each`
                        : `${currSym}0.00 each`}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-brand-400 hover:underline text-xs"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-slate-400 hover:underline text-xs"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tripMembers.map(m => {
                    const isChecked = selectedMemberIds.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-brand-500/10 border-brand-500/40 text-white'
                            : 'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleMemberToggle(m.id)}
                            className="rounded border-slate-700 text-brand-500 focus:ring-brand-500/20"
                          />
                          <span className="text-xs font-medium">{m.display_name}</span>
                        </div>
                        {m.member_type === 'GUEST' && (
                          <Badge variant="default" size="sm">Guest</Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Split Mode 2: EXACT */}
            {splitMethod === 'EXACT' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Specify exact shares (remaining auto-calculates)</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${splitValidation.isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      Sum: {currSym}
                      {tripMembers.reduce((sum, m) => sum + (parseFloat(exactAmounts[m.id] || '0') || 0), 0).toFixed(2)}{' '}
                      / {currSym}{totalNum.toFixed(2)}
                    </span>
                    {splitValidation.isValid && (
                      <span className="text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        Balanced ✓
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {tripMembers.map(m => {
                    const currentVal = parseFloat(exactAmounts[m.id] || '0') || 0;
                    const totalAllocated = tripMembers.reduce((sum, item) => sum + (parseFloat(exactAmounts[item.id] || '0') || 0), 0);
                    const remainingToTotal = Math.max(0, totalNum - (totalAllocated - currentVal));

                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white truncate max-w-[140px]">
                            {m.display_name}
                          </span>
                          {m.member_type === 'GUEST' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Guest
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {totalNum > 0 && Math.abs(totalAllocated - totalNum) > 0.01 && (
                            <button
                              type="button"
                              onClick={() => handleFillRemaining(m.id)}
                              className="text-[10px] text-brand-400 hover:text-brand-300 hover:underline px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 transition-colors"
                              title={`Fill remaining ${currSym}${remainingToTotal.toFixed(2)} for ${m.display_name}`}
                            >
                              Auto-fill {currSym}{remainingToTotal.toFixed(2)}
                            </button>
                          )}
                          <div className="flex items-center gap-1.5 w-32">
                            <span className="text-xs text-slate-400">{currSym}</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={exactAmounts[m.id] || ''}
                              onChange={e => handleExactAmountChange(m.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white text-right font-medium focus:border-brand-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Split Mode 3: PERCENTAGE */}
            {splitMethod === 'PERCENTAGE' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Allocate percentage shares (total 100%)</span>
                  <span className={`font-bold ${splitValidation.isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Total:{' '}
                    {tripMembers.reduce((sum, m) => sum + (parseFloat(percentages[m.id] || '0') || 0), 0).toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-2">
                  {tripMembers.map(m => {
                    const pctVal = parseFloat(percentages[m.id] || '0') || 0;
                    const calculatedShare = totalNum > 0 ? ((totalNum * pctVal) / 100).toFixed(2) : '0.00';
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{m.display_name}</span>
                          <span className="text-[11px] text-slate-400">({currSym}{calculatedShare})</span>
                        </div>
                        <div className="flex items-center gap-1.5 w-24">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={percentages[m.id] || ''}
                            onChange={e => handlePercentageChange(m.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white text-right font-medium focus:border-brand-500 focus:outline-none"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Split Mode 4: SHARES */}
            {splitMethod === 'SHARES' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Specify proportional shares (e.g. 1, 2)</span>
                  <span className="text-brand-400 font-bold">
                    Total Shares:{' '}
                    {tripMembers.reduce((sum, m) => sum + (parseFloat(shares[m.id] || '0') || 0), 0)}
                  </span>
                </div>

                <div className="space-y-2">
                  {tripMembers.map(m => {
                    const totalSharesNum = tripMembers.reduce((sum, item) => sum + (parseFloat(shares[item.id] || '0') || 0), 0);
                    const memberShareNum = parseFloat(shares[m.id] || '0') || 0;
                    const calculatedAmt = (totalSharesNum > 0 && totalNum > 0)
                      ? ((totalNum * memberShareNum) / totalSharesNum).toFixed(2)
                      : '0.00';
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{m.display_name}</span>
                          <span className="text-[11px] text-slate-400">({currSym}{calculatedAmt})</span>
                        </div>
                        <div className="flex items-center gap-1.5 w-24">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="1"
                            value={shares[m.id] || ''}
                            onChange={e => setShares(prev => ({ ...prev, [m.id]: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white text-right font-medium focus:border-brand-500 focus:outline-none"
                          />
                          <span className="text-xs text-slate-400">share</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !splitValidation.isValid || !payerValidation.isValid}
              leftIcon={isSubmitting ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
            >
              {isSubmitting ? 'Saving...' : initialExpense ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
