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
  DollarSign,
  MessageCircle,
  Sparkles,
  Zap,
  UserCheck
} from 'lucide-react';
import { tripsApi } from '../../features/trips/api';
import { friendsApi } from '../../features/friends/api';
import type { TripDetail } from '../../features/trips/types';
import type { FriendUser } from '../../features/friends/types';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/common/ErrorState';
import { WhatsAppShareModal } from '../../components/common/WhatsAppShareModal';
import { ConvertGuestModal } from '../../components/trips/ConvertGuestModal';
import { formatTripDateRange, getTripTimeStatus } from '../../utils/dates';

export const TripOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isGuest, guestSession } = useAuth();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WhatsApp Invite Modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load trip details.');
    } finally {
      setIsLoading(false);
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
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add member.');
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
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add guest companion.');
    } finally {
      setIsAddingGuest(false);
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!trip) return;
    if (!window.confirm(`Remove ${name} from this trip?`)) return;
    try {
      const updated = await tripsApi.removeMember(trip.id, memberId);
      setTrip(updated);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  if (isLoading) return <Spinner size="lg" />;
  if (error || !trip) {
    return <ErrorState title="Unable to load trip" message={error || 'Trip does not exist.'} onRetry={loadTrip} />;
  }

  const isOwner = trip.owner_id === user?.id;
  const currentMemberUserIds = new Set(trip.members.map((m) => m.user_id));
  const availableFriendsToAdd = friends.filter((f) => !currentMemberUserIds.has(f.id));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top navigation row */}
      <div className="flex items-center justify-between">
        {!isGuest ? (
          <Link
            to="/trips"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Trips
          </Link>
        ) : (
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Guest Trip Workspace
          </span>
        )}

        {isGuest && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConvertModal(true)}
            className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Claim Account
          </Button>
        )}
      </div>

      {/* Guest Mode Participation Banner (Phase 4 Hybrid Membership) */}
      {isGuest && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-600/10 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                Participating as Guest ({guestSession?.displayName})
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
                  Guest Session
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                You can participate in expenses and debt splits. Create an account anytime to save your records permanently.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowConvertModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 shadow-glow-brand text-xs"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Claim Trip / Create Account
          </Button>
        </div>
      )}

      {/* Main Trip Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950/70 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="sm">
                {trip.trip_type}
              </Badge>
              <Badge
                variant={
                  trip.status === 'ACTIVE'
                    ? 'success'
                    : trip.status === 'COMPLETED'
                    ? 'default'
                    : 'warning'
                }
                size="sm"
              >
                {trip.status}
              </Badge>
              {isOwner && <Badge variant="brand" size="sm">You are Organizer</Badge>}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {trip.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-400" />
                {trip.destination}
              </span>

              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {formatTripDateRange(trip.start_date, trip.end_date)}
              </span>

              {getTripTimeStatus(trip.start_date, trip.end_date) && (
                <span className="px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-medium">
                  {getTripTimeStatus(trip.start_date, trip.end_date)?.label}
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                {trip.members.length} {trip.members.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            {trip.description && (
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed pt-1">
                {trip.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition duration-150"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              Invite via WhatsApp
            </button>

            {isOwner && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit3 className="w-4 h-4" />}
                  onClick={() => setShowEditModal(true)}
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

      {/* Grid: Budget Overview & Trip Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Card */}
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Trip Budget
            </h2>
            <Badge variant="success" size="sm">Phase 3</Badge>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              {trip.budget ? (
                <>
                  <span className="text-emerald-400">
                    {trip.currency === 'INR' ? '₹' : trip.currency}
                  </span>{' '}
                  {Number(trip.budget).toLocaleString()}
                </>
              ) : (
                <span className="text-slate-500 text-lg font-medium">No budget set</span>
              )}
            </div>
            <p className="text-xs text-slate-400">Allocated trip spending ceiling</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Expenses recorded:</span>
              <span className="text-white font-semibold">₹0.00</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Remaining budget:</span>
              <span className="text-emerald-400 font-semibold">
                {trip.currency === 'INR' ? '₹' : trip.currency}{' '}
                {trip.budget ? Number(trip.budget).toLocaleString() : '0.00'}
              </span>
            </div>
          </div>
        </Card>

        {/* Members Roster Card */}
        <Card variant="glass" className="lg:col-span-2 p-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
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
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  onClick={() => setShowAddMemberModal(true)}
                >
                  Add Companion
                </Button>
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
      </div>

      {/* Feature Teasers for Next Development Phases */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Roadmap Modules Coming for this Trip
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass" className="p-5 space-y-2 border-slate-800/60">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-400" />
                Phase 7: Expenses & Splits
              </span>
              <Badge variant="default" size="sm">Phase 7</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Record shared bills and divide using Equal, Exact, Percentage, or Shares splitting logic.
            </p>
          </Card>

          <Card variant="glass" className="p-5 space-y-2 border-slate-800/60">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                Phase 8: Balances Engine
              </span>
              <Badge variant="default" size="sm">Phase 8</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Automatic net balances (<span className="text-slate-300">Paid - Share</span>) and graph-based debt minimization.
            </p>
          </Card>

          <Card variant="glass" className="p-5 space-y-2 border-slate-800/60">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Phase 9: Settlements
              </span>
              <Badge variant="default" size="sm">Phase 9</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Track pending and settled debt payments, and share debt balance receipts directly via WhatsApp.
            </p>
          </Card>
        </div>
      </div>

      {/* Edit Trip Modal */}
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

              <Input
                label="Budget Target"
                type="number"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                leftIcon={<Wallet className="w-4 h-4" />}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => {
                    setEditStartDate(e.target.value);
                    if (editEndDate && e.target.value > editEndDate) {
                      setEditEndDate(e.target.value);
                    }
                  }}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />

                <Input
                  label="End Date"
                  type="date"
                  min={editStartDate}
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Trip Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
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

      {/* Add Member Modal (Hybrid: Registered Friends or Direct Guest Companions) */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 space-y-5 animate-slide-up border-slate-800 shadow-2xl">
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

            {/* Tab selection */}
            <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setAddMemberTab('friend')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  addMemberTab === 'friend'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Registered Friend
              </button>
              <button
                type="button"
                onClick={() => setAddMemberTab('guest')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  addMemberTab === 'guest'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Direct Guest by Name
              </button>
            </div>

            {addMemberTab === 'friend' ? (
              <div className="space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Choose from your registered friends
                </label>
                {availableFriendsToAdd.length > 0 ? (
                  <select
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select a friend...</option>
                    {availableFriendsToAdd.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      All your current friends are already companions on this trip.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setAddMemberTab('guest')}
                    >
                      Add as Guest instead
                    </Button>
                  </div>
                )}

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
    </div>
  );
};

