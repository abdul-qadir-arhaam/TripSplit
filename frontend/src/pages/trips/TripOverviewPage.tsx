import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Wallet, 
  Users, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  X, 
  Receipt, 
  Scale, 
  MessageCircle, 
  Sparkles, 
  Zap, 
  UserCheck, 
  Link2, 
  Plus, 
  Search, 
  Utensils, 
  Car, 
  Fuel, 
  Bed, 
  Compass, 
  Ticket, 
  ShoppingBag, 
  Coffee, 
  AlertCircle, 
  HelpCircle,
  LayoutDashboard 
} from 'lucide-react';
import { tripsApi } from '../../features/trips/api';
import { friendsApi } from '../../features/friends/api';
import { invitesApi } from '../../features/invites/api';
import { expensesApi } from '../../features/expenses/api';
import { balancesApi } from '../../features/balances/api';
import type { TripDetail } from '../../features/trips/types';
import type { FriendUser } from '../../features/friends/types';
import type { Expense, ExpenseDetail, ExpenseCreate, ExpenseUpdate } from '../../features/expenses/types';
import type { TripBalanceSummary } from '../../features/balances/types';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/common/ErrorState';
import { WhatsAppShareModal } from '../../components/common/WhatsAppShareModal';
import { ConvertGuestModal } from '../../components/trips/ConvertGuestModal';
import { ManageInvitesModal } from '../../components/trips/ManageInvitesModal';
import { ExpenseModal } from '../../components/expenses/ExpenseModal';
import { ExpenseDetailModal } from '../../components/expenses/ExpenseDetailModal';
import { BalancesTab } from '../../components/balances/BalancesTab';
import { TripDashboardTab } from '../../components/dashboard/TripDashboardTab';
import { RecordSettlementModal } from '../../components/settlements/RecordSettlementModal';
import { formatTripDateRange, getTripTimeStatus } from '../../utils/dates';
import { openWhatsApp, generateExpenseShareText } from '../../services/whatsapp';

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

const CATEGORIES_FILTER: string[] = [
  'ALL',
  'Food',
  'Transport',
  'Fuel',
  'Stay',
  'Activities',
  'Tickets',
  'Shopping',
  'Drinks',
  'Emergency',
  'Miscellaneous',
];

export const TripOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isGuest, guestSession } = useAuth();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab state (Phase 7, 8, 9, 10)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'balances' | 'companions'>('dashboard');

  // Settlement modal state (Phase 9)
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementPrefill, setSettlementPrefill] = useState<{
    fromMemberId?: string;
    toMemberId?: string;
    amount?: number;
  }>({});

  // Expenses & Balances state (Phase 7 & 8)
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balancesSummary, setBalancesSummary] = useState<TripBalanceSummary | null>(null);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [isBalancesLoading, setIsBalancesLoading] = useState(false);

  // Expense filters & sorting
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Expense Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDetail | null>(null);

  // WhatsApp Invite Modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [activeInviteToken, setActiveInviteToken] = useState<string | undefined>(undefined);

  // Invite Links Modal state (Phase 5)
  const [showInvitesModal, setShowInvitesModal] = useState(false);

  // Guest conversion modal
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Edit Trip Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editStatus, setEditStatus] = useState('PLANNING');

  // Add Member state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberTab, setAddMemberTab] = useState<'friend' | 'guest'>('friend');
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [directGuestName, setDirectGuestName] = useState('');
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  const loadTrip = async () => {
    if (!id) return;
    try {
      const data = await tripsApi.getTripDetail(id);
      setTrip(data);
      setEditName(data.name);
      setEditDestination(data.destination);
      setEditStartDate(data.start_date || '');
      setEditEndDate(data.end_date || '');
      setEditBudget(data.budget ? String(data.budget) : '');
      setEditStatus(data.status);

      // Fetch active invite token for WhatsApp & sharing
      invitesApi.getActiveTripInvite(id).then((inv) => {
        if (inv?.token) setActiveInviteToken(inv.token);
        else if (inv?.code) setActiveInviteToken(inv.code);
      }).catch(() => {});
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load trip details.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpenses = async () => {
    if (!id) return;
    setIsExpensesLoading(true);
    try {
      const list = await expensesApi.getExpenses(id, {
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        sort_by: sortBy,
      });
      setExpenses(list);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setIsExpensesLoading(false);
    }
  };

  const loadBalances = async () => {
    if (!id) return;
    setIsBalancesLoading(true);
    try {
      const data = await balancesApi.getTripBalances(id);
      setBalancesSummary(data);
    } catch (err) {
      console.error('Failed to load balances', err);
    } finally {
      setIsBalancesLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('share') === 'whatsapp') {
      setShowWhatsAppModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    loadTrip();
    friendsApi.getFriends().then(setFriends).catch(() => {});
  }, [id]);

  useEffect(() => {
    loadExpenses();
    loadBalances();
  }, [id, selectedCategory, searchQuery, sortBy]);

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    if (editStartDate && editEndDate && editEndDate < editStartDate) {
      alert('End date cannot be earlier than start date.');
      return;
    }

    try {
      const updated = await tripsApi.updateTrip(trip.id, {
        name: editName.trim(),
        destination: editDestination.trim(),
        start_date: editStartDate || undefined,
        end_date: editEndDate || undefined,
        budget: editBudget ? Number(editBudget) : undefined,
        status: editStatus,
      });
      setTrip(updated);
      setShowEditModal(false);
      loadBalances();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update trip.');
    }
  };

  const handleDeleteTrip = async () => {
    if (!trip) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${trip.name}"?`)) return;
    try {
      await tripsApi.deleteTrip(trip.id);
      navigate('/trips');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete trip.');
    }
  };

  const handleAddMember = async () => {
    if (!trip || !selectedFriendId) return;
    try {
      const updated = await tripsApi.addMember(trip.id, selectedFriendId);
      setTrip(updated);
      setSelectedFriendId('');
      setShowAddMemberModal(false);
      loadBalances();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add member to trip.');
    }
  };

  const handleAddDirectGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !directGuestName.trim()) return;

    setIsAddingGuest(true);
    try {
      const updated = await tripsApi.addDirectGuestMember(trip.id, directGuestName.trim());
      setTrip(updated);
      setDirectGuestName('');
      setShowAddMemberModal(false);
      loadBalances();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add guest companion.');
    } finally {
      setIsAddingGuest(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!trip) return;
    if (!window.confirm(`Remove ${memberName} from this trip?`)) return;
    try {
      const updated = await tripsApi.removeMember(trip.id, memberId);
      setTrip(updated);
      loadBalances();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  // Expense Handlers
  const handleExpenseSubmit = async (data: ExpenseCreate | ExpenseUpdate) => {
    if (!trip) return;
    if (editingExpense) {
      await expensesApi.updateExpense(trip.id, editingExpense.id, data as ExpenseUpdate);
    } else {
      await expensesApi.createExpense(trip.id, data as ExpenseCreate);
    }
    setEditingExpense(null);
    loadExpenses();
    loadBalances();
  };

  const handleOpenExpenseDetail = async (expenseId: string) => {
    if (!trip) return;
    try {
      const detail = await expensesApi.getExpenseDetail(trip.id, expenseId);
      setSelectedExpense(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to fetch expense details.');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!trip) return;
    try {
      await expensesApi.deleteExpense(trip.id, expenseId);
      loadExpenses();
      loadBalances();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete expense.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Loading trip details...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <ErrorState
        title="Trip Not Found"
        message={error || "The trip you are looking for does not exist or you don't have permission to view it."}
        onRetry={() => navigate('/trips')}
      />
    );
  }

  const isOwner = trip.owner_id === user?.id;
  const timeStatus = getTripTimeStatus(trip.start_date, trip.end_date);
  const currSym = trip.currency === 'INR' ? '₹' : trip.currency;

  // Active member companion list for modals
  const activeMembers = trip.members.filter(m => m.status === 'ACTIVE');

  // Identify current member in trip
  const currentMember = activeMembers.find(m => 
    (!isGuest && m.user_id === user?.id) || (isGuest && m.id === guestSession?.memberId)
  );

  // User financial position
  const currentMemberBalance = balancesSummary?.balances.find(b => b.member_id === currentMember?.id);

  // Budget calculations
  const totalSpentNum = balancesSummary ? Number(balancesSummary.total_spent) : 0;
  const budgetNum = trip.budget ? Number(trip.budget) : 0;
  const remainingBudget = budgetNum > 0 ? (budgetNum - totalSpentNum) : null;
  const percentageUsed = budgetNum > 0 ? Math.min(100, Math.round((totalSpentNum / budgetNum) * 100)) : null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Trips
        </Link>
      </div>

      {/* Guest Mode Banner (Phase 4) */}
      {isGuest && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                Guest Mode Participation
                <Badge variant="warning" size="sm">Temporary Session</Badge>
              </div>
              <p className="text-xs text-amber-200/80">
                You are participating as <span className="font-semibold text-white">{guestSession?.displayName}</span>. Create a permanent account anytime to keep your trip records and expense history intact!
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowConvertModal(true)}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none shadow-lg shadow-amber-500/20"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Claim Account
          </Button>
        </div>
      )}

      {/* Main Trip Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/60 border border-slate-800 p-6 md:p-8 backdrop-blur-md space-y-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="brand" size="sm">{trip.trip_type}</Badge>
              {timeStatus && (
                <Badge variant={timeStatus.variant} size="sm">
                  {timeStatus.label}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {trip.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 text-brand-400 font-medium">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{trip.destination}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{formatTripDateRange(trip.start_date, trip.end_date)}</span>
              </div>
            </div>

            {trip.description && (
              <p className="text-xs md:text-sm text-slate-400 pt-1 leading-relaxed">
                {trip.description}
              </p>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-500 text-xs"
              leftIcon={<MessageCircle className="w-3.5 h-3.5 fill-current" />}
              onClick={() => setShowWhatsAppModal(true)}
            >
              WhatsApp Invite
            </Button>

            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => setShowEditModal(true)}
                  className="text-xs"
                >
                  Edit Trip
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteTrip}
                  className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                  title="Delete Trip"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Financial Budget Summary & User Financial Position */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Trip Budget Meter */}
        <Card variant="glass" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Trip Budget
            </span>
            {percentageUsed !== null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                percentageUsed > 90 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {percentageUsed}% used
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black text-white">
              {budgetNum > 0 ? (
                <>
                  <span className="text-brand-400">{currSym}</span> {budgetNum.toLocaleString()}
                </>
              ) : (
                <span className="text-slate-500 text-base font-medium">No budget set</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Total spending limit for group</p>
          </div>

          {budgetNum > 0 && (
            <div className="space-y-1.5">
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    percentageUsed && percentageUsed > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentageUsed || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Remaining:</span>
                <span className="font-semibold text-emerald-400">
                  {currSym}{remainingBudget !== null ? remainingBudget.toLocaleString() : '0.00'}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Card 2: Total Trip Expenses Recorded */}
        <Card variant="glass" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-brand-400" />
              Total Group Spending
            </span>
            <Badge variant="brand" size="sm">{expenses.length} bills</Badge>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black text-white">
              <span className="text-brand-400">{currSym}</span>{' '}
              {totalSpentNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400">Sum of all approved group expenses</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Average per companion:</span>
            <span className="text-white font-semibold">
              {activeMembers.length > 0 
                ? `${currSym}${(totalSpentNum / activeMembers.length).toFixed(2)}`
                : `${currSym}0.00`}
            </span>
          </div>
        </Card>

        {/* Card 3: Your Personal Position */}
        <Card variant="glass" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              Your Balance
            </span>
            {currentMemberBalance && (
              <Badge 
                variant={
                  currentMemberBalance.status === 'RECEIVES' ? 'success' :
                  currentMemberBalance.status === 'OWES' ? 'danger' : 'default'
                }
                size="sm"
              >
                {currentMemberBalance.status}
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            {currentMemberBalance ? (
              <div className="text-2xl font-black text-white">
                {Number(currentMemberBalance.net_balance) > 0 ? (
                  <span className="text-emerald-400">
                    +{currSym}{Number(currentMemberBalance.net_balance).toFixed(2)}
                  </span>
                ) : Number(currentMemberBalance.net_balance) < 0 ? (
                  <span className="text-rose-400">
                    -{currSym}{Math.abs(Number(currentMemberBalance.net_balance)).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-slate-300">Settled ({currSym}0.00)</span>
                )}
              </div>
            ) : (
              <div className="text-xl font-bold text-slate-500">₹0.00</div>
            )}
            <p className="text-[11px] text-slate-400">
              {currentMemberBalance && Number(currentMemberBalance.net_balance) > 0
                ? 'You are owed money by other companions'
                : currentMemberBalance && Number(currentMemberBalance.net_balance) < 0
                ? 'You owe money towards group expenses'
                : 'Your shared payments and shares match exactly'}
            </p>
          </div>

          {currentMemberBalance && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>You paid: <strong className="text-white">{currSym}{Number(currentMemberBalance.total_paid).toFixed(2)}</strong></span>
              <span>Your share: <strong className="text-white">{currSym}{Number(currentMemberBalance.total_share).toFixed(2)}</strong></span>
            </div>
          )}
        </Card>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expenses</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/20 text-brand-300">
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'balances'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Balances & Settlements</span>
        </button>

        <button
          onClick={() => setActiveTab('companions')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'companions'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Trip Companions</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300">
            {activeMembers.length}
          </span>
        </button>
      </div>

      {/* TAB 0: Central Trip Dashboard (Phase 10) */}
      {activeTab === 'dashboard' && (
        <TripDashboardTab
          tripId={trip.id}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* TAB 1: Expenses Feed & Actions (Phase 7) */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Action and Filter Strip */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search & Sort */}
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search expenses, notes, or locations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'date' | 'amount')}
                className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
              </select>
            </div>

            {/* Add Expense Button */}
            <Button
              variant="primary"
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseModal(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="shadow-lg shadow-brand-500/20"
            >
              Add Expense
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES_FILTER.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Expense Cards List */}
          {isExpensesLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Spinner size="lg" />
              <p className="text-xs text-slate-400">Loading trip expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <Card variant="glass" className="p-12 text-center space-y-4 border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No expenses recorded yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {selectedCategory !== 'ALL' || searchQuery
                    ? 'No expenses matched your filter criteria.'
                    : 'Record your shared hotel, food, fuel, or activity bills to automatically split and settle them.'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseModal(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add First Expense
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {expenses.map(expense => {
                const IconComponent = CATEGORY_ICONS[expense.category] || HelpCircle;
                return (
                  <Card
                    key={expense.id}
                    variant="glass"
                    onClick={() => handleOpenExpenseDetail(expense.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-slate-700 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white hover:text-brand-300 transition-colors">
                            {expense.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                            {expense.category}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            Paid by <strong className="text-emerald-400 font-medium">{expense.paid_by_name}</strong>
                            {expense.is_multiple_payers && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Multi-Payer
                              </span>
                            )}
                          </span>
                          <span>•</span>
                          <span>Split: <strong className="text-slate-300">{expense.split_method}</strong> ({expense.split_count} people)</span>
                          <span>•</span>
                          <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                          {expense.location_name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-400">
                                <MapPin className="w-3 h-3" /> {expense.location_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Quick WhatsApp */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <div className="text-right">
                        <span className="text-lg font-black text-white block">
                          <span className="text-brand-400">{currSym}</span>
                          {Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-2"
                        title="Share on WhatsApp"
                        onClick={e => {
                          e.stopPropagation();
                          const text = generateExpenseShareText(trip.name, trip.id, {
                            title: expense.title,
                            amount: expense.amount,
                            currency: expense.currency,
                            paid_by_name: expense.paid_by_name,
                            category: expense.category,
                            location_name: expense.location_name,
                            notes: expense.notes,
                            payers: expense.payers,
                          });
                          openWhatsApp(text);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Balances & Settlement Engine (Phase 8 & 9) */}
      {activeTab === 'balances' && (
        <BalancesTab
          balancesSummary={balancesSummary}
          isLoading={isBalancesLoading}
          tripName={trip.name}
          tripId={trip.id}
          onRecordPaymentClick={(fromId, toId, amt) => {
            setSettlementPrefill({ fromMemberId: fromId, toMemberId: toId, amount: amt });
            setShowSettlementModal(true);
          }}
          onRefreshBalances={() => {
            loadBalances();
            loadTrip();
          }}
        />
      )}

      {/* TAB 3: Trip Companions Roster */}
      {activeTab === 'companions' && (
        <Card variant="glass" className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                Trip Companions ({trip.members.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-500 text-xs"
                leftIcon={<MessageCircle className="w-3.5 h-3.5 fill-current" />}
                onClick={() => setShowWhatsAppModal(true)}
              >
                WhatsApp Invite
              </Button>

              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    leftIcon={<Link2 className="w-3.5 h-3.5 text-brand-400" />}
                    onClick={() => setShowInvitesModal(true)}
                  >
                    Invite Links
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    Add Companion
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trip.members.map((m) => {
              const isTripOwner = m.role === 'OWNER';
              const isSelf = (!isGuest && m.user_id === user?.id) || (isGuest && m.id === guestSession?.memberId);
              const isGuestMember = m.member_type === 'GUEST';

              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    isGuestMember 
                      ? 'bg-slate-900/70 border-amber-500/20' 
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                      isGuestMember 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                        : 'bg-brand-600/20 border-brand-500/30 text-brand-300'
                    }`}>
                      {m.display_name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{m.display_name}</span>
                        {isSelf && <span className="text-[10px] text-brand-400 font-medium">(You)</span>}
                        {isGuestMember ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Guest
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-brand-500/15 text-brand-300 border border-brand-500/30">
                            Registered
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {m.email || (isGuestMember ? 'Guest Participant' : 'Registered Member')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isTripOwner ? (
                      <Badge variant="brand" size="sm">Organizer</Badge>
                    ) : (
                      <>
                        <Badge variant={isGuestMember ? 'warning' : 'default'} size="sm">
                          {isGuestMember ? 'Guest' : 'Member'}
                        </Badge>
                        {(isOwner || isSelf) && (
                          <button
                            onClick={() => handleRemoveMember(m.id, m.display_name)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition"
                            title={isSelf ? 'Leave trip' : 'Remove from trip'}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Create / Edit Expense Modal (Phase 7) */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        onSubmit={handleExpenseSubmit}
        tripMembers={activeMembers}
        currency={trip.currency}
        defaultPayerId={currentMember?.id}
        initialExpense={editingExpense}
      />

      {/* Expense Detail Modal with WhatsApp share & breakdown (Phase 7) */}
      <ExpenseDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        tripName={trip.name}
        tripId={trip.id}
        canEdit={Boolean(isOwner || (selectedExpense && currentMember && selectedExpense.paid_by_member_id === currentMember.id))}
        canDelete={Boolean(isOwner || (selectedExpense && currentMember && selectedExpense.paid_by_member_id === currentMember.id))}
        onEdit={(exp) => {
          setEditingExpense(exp);
          setShowExpenseModal(true);
        }}
        onDelete={handleDeleteExpense}
      />

      {/* Edit Trip Settings Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-400" />
                Edit Trip Settings
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTrip} className="space-y-4">
              <Input
                label="Trip Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <Input
                label="Destination"
                value={editDestination}
                onChange={(e) => setEditDestination(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500 [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <Input
                label={`Budget (${trip.currency === 'INR' ? '₹' : trip.currency})`}
                type="number"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                leftIcon={<Wallet className="w-4 h-4" />}
                placeholder="Optional"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Companion Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-400" />
                Add Companion to Trip
              </h2>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAddMemberTab('friend')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  addMemberTab === 'friend' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                From Friends List
              </button>
              <button
                type="button"
                onClick={() => setAddMemberTab('guest')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  addMemberTab === 'guest' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Direct Guest Companion
              </button>
            </div>

            {addMemberTab === 'friend' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select a Friend
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Add registered friends you are connected with on Trip Finance.
                  </p>
                  <select
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Friend --</option>
                    {friends
                      .filter((f) => !trip.members.some((m) => m.user_id === f.id))
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!selectedFriendId}
                    onClick={handleAddMember}
                  >
                    Add Friend
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddDirectGuest} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Guest Companion Name
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Add a companion without needing them to register in advance. They will appear in expense splits immediately.
                  </p>
                  <Input
                    value={directGuestName}
                    onChange={(e) => setDirectGuestName(e.target.value)}
                    placeholder="e.g. Sahil or Sarah"
                    required
                    leftIcon={<UserCheck className="w-4 h-4" />}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                    disabled={!directGuestName.trim()}
                    isLoading={isAddingGuest}
                  >
                    Add Guest Companion
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* WhatsApp Share Modal (Phase 6) */}
      {trip && (
        <WhatsAppShareModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          trip={trip}
          inviterName={user?.name}
          inviteToken={activeInviteToken}
        />
      )}

      {/* Manage Invites Modal (Phase 5) */}
      {trip && (
        <ManageInvitesModal
          isOpen={showInvitesModal}
          onClose={() => {
            setShowInvitesModal(false);
            if (id) {
              invitesApi.getActiveTripInvite(id).then((inv) => {
                if (inv?.token) setActiveInviteToken(inv.token);
                else if (inv?.code) setActiveInviteToken(inv.code);
              }).catch(() => {});
            }
          }}
          trip={trip}
          inviterName={user?.name}
        />
      )}

      {/* Convert Guest Account Modal (Phase 4) */}
      {trip && (
        <ConvertGuestModal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          tripId={trip.id}
          onConverted={loadTrip}
        />
      )}

      {/* Record Settlement Modal (Phase 9) */}
      {trip && (
        <RecordSettlementModal
          isOpen={showSettlementModal}
          onClose={() => setShowSettlementModal(false)}
          onSettlementRecorded={() => {
            loadBalances();
            loadTrip();
            loadExpenses();
          }}
          tripId={trip.id}
          currency={trip.currency || 'INR'}
          members={trip.members || []}
          initialFromMemberId={settlementPrefill.fromMemberId}
          initialToMemberId={settlementPrefill.toMemberId}
          initialAmount={settlementPrefill.amount}
        />
      )}
    </div>
  );
};
