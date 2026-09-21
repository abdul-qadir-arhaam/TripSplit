import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Compass, 
  MapPin, 
  Wallet, 
  Users, 
  ArrowLeft, 
  Check, 
  Layers,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { tripsApi } from '../../features/trips/api';
import { friendsApi } from '../../features/friends/api';
import { groupsApi } from '../../features/groups/api';
import type { FriendUser } from '../../features/friends/types';
import type { Group } from '../../features/groups/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getPresetDates, getTripDurationDays, toISODateString } from '../../utils/dates';

const TRIP_TYPES = [
  'Vacation',
  'Road Trip',
  'College Outing',
  'Weekend Trip',
  'Event',
  'Other',
];

export const CreateTripPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [tripType, setTripType] = useState('Vacation');

  // Friends & Groups selection
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = toISODateString(new Date());
  const durationDays = getTripDurationDays(startDate, endDate);

  const handleApplyPreset = (preset: 'weekend' | 'nextWeek' | 'nextMonth') => {
    const dates = getPresetDates(preset);
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  useEffect(() => {
    friendsApi.getFriends().then(setFriends).catch(() => {});
    groupsApi.getGroups().then(setGroups).catch(() => {});
  }, []);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAddGroupMembers = async (groupId: string) => {
    try {
      const detail = await groupsApi.getGroupDetail(groupId);
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        detail.members.forEach((m) => next.add(m.user_id));
        return next;
      });
    } catch {
      // Ignored
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !destination.trim()) {
      setError('Trip name and destination are required.');
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setError('Trip end date cannot be earlier than start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const trip = await tripsApi.createTrip({
        name: name.trim(),
        destination: destination.trim(),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        budget: budget ? Number(budget) : undefined,
        currency,
        trip_type: tripType,
        member_user_ids: Array.from(selectedUserIds),
      });

      // Navigate to overview with share=whatsapp so the user can immediately invite
      navigate(`/trips/${trip.id}?share=whatsapp`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <Link
        to="/trips"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Trips
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Compass className="w-7 h-7 text-brand-400" />
          Create a New Trip
        </h1>
        <p className="text-sm text-slate-400">
          Set up your destination, budget, and invite travel companions
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card variant="glass" className="p-8 border-slate-800/80">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Basic Trip Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Trip Name"
                placeholder="e.g. Goa Vacation, Manali Trek"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Destination"
                placeholder="e.g. Goa, India"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Trip Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRIP_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition ${
                      tripType === t
                        ? 'bg-brand-600 border-brand-500 text-white shadow-glow-brand'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Notes about the trip, itinerary highlights, or stay details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Dates & Financials */}
          <div className="pt-4 border-t border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                Dates & Budget
              </h2>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 mr-1">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('weekend')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-brand-500 text-[11px] text-slate-300 hover:text-white transition"
                >
                  🌴 Weekend
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('nextWeek')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-brand-500 text-[11px] text-slate-300 hover:text-white transition"
                >
                  📅 Next Week
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('nextMonth')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-brand-500 text-[11px] text-slate-300 hover:text-white transition"
                >
                  ✈️ In 1 Month
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={handleClearDates}
                    className="px-2 py-1 rounded-lg text-[11px] text-slate-500 hover:text-rose-400 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                min={todayStr}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                leftIcon={<Calendar className="w-4 h-4" />}
              />

              <Input
                label="End Date"
                type="date"
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
            </div>

            {durationDays !== null && (
              <div className="flex items-center gap-2 text-xs font-medium text-brand-300 bg-brand-950/40 border border-brand-800/50 px-3 py-2 rounded-xl animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Estimated duration: <strong>{durationDays} {durationDays === 1 ? 'day' : 'days'}</strong></span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Trip Target Budget"
                  type="number"
                  placeholder="e.g. 30000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  leftIcon={<Wallet className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Member Selection from Friends & Groups */}
          <div className="pt-4 border-t border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                Invite Friends to Trip ({selectedUserIds.size} selected)
              </h2>
            </div>

            {/* Quick add from groups */}
            {groups.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 block">Select from Reusable Groups:</span>
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleAddGroupMembers(g.id)}
                      className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-brand-500 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                    >
                      <Layers className="w-3.5 h-3.5 text-brand-400" />
                      + Add "{g.name}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Individual friends list */}
            {friends.length === 0 ? (
              <p className="text-xs text-slate-500">
                You have no friends added yet.{' '}
                <Link to="/friends" className="text-brand-400 underline">
                  Add friends
                </Link>{' '}
                first or invite guests later via invite link!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {friends.map((f) => {
                  const isChecked = selectedUserIds.has(f.id);

                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleUserSelection(f.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-brand-950/60 border-brand-500/70 text-white'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-brand-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {f.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{f.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{f.email}</div>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'border-slate-700 bg-slate-950/40'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <Link to="/trips">
              <Button type="button" variant="ghost" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Launch Trip
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
