import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  LogIn, 
  UserPlus,
  AlertCircle,
  User,
  Zap
} from 'lucide-react';
import { tripsApi } from '../../features/trips/api';
import type { TripInviteInfo } from '../../features/trips/types';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { formatTripDateRange } from '../../utils/dates';

export const JoinTripPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, isGuest, guestSession, setGuestSession } = useAuth();

  const [trip, setTrip] = useState<TripInviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [isGuestJoining, setIsGuestJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successJoined, setSuccessJoined] = useState(false);

  useEffect(() => {
    if (!id) return;
    tripsApi
      .getTripInviteInfo(id)
      .then(setTrip)
      .catch((err) => {
        setError(err.response?.data?.detail || 'This trip invitation link is invalid or expired.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleJoinTrip = async () => {
    if (!id) return;
    setIsJoining(true);
    setError(null);
    try {
      await tripsApi.joinTrip(id);
      setSuccessJoined(true);
      setTimeout(() => {
        navigate(`/trips/${id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to join trip. Please try again.');
      setIsJoining(false);
    }
  };

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !guestName.trim()) return;

    setIsGuestJoining(true);
    setError(null);
    try {
      const res = await tripsApi.joinTripAsGuest(id, guestName.trim());
      setGuestSession({
        tripId: id,
        memberId: res.member.id,
        displayName: res.member.display_name,
        token: res.guest_token,
      });
      setSuccessJoined(true);
      setTimeout(() => {
        navigate(`/trips/${id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to join as guest. Please try again.');
      setIsGuestJoining(false);
    }
  };

  if (isLoading) return <Spinner size="lg" />;

  if (error && !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <Card variant="glass" className="max-w-md w-full p-8 text-center space-y-4 border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Trip Not Found</h1>
          <p className="text-xs text-slate-400">{error || 'This invitation link is not valid.'}</p>
          <Link to="/">
            <Button variant="outline" size="sm" className="mt-2">
              Go to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!trip) return null;

  const isCurrentGuestForTrip = isGuest && guestSession?.tripId === id;
  const dateRangeText = formatTripDateRange(trip.start_date, trip.end_date);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <Card variant="glass" className="max-w-lg w-full p-8 space-y-6 border-slate-800/90 shadow-2xl relative z-10 animate-slide-up">
        {/* Top invitation badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            Trip Invitation
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            You're Invited!
          </h1>
          <p className="text-xs text-slate-400">
            <strong className="text-slate-200">{trip.owner_name}</strong> invited you to join this trip on Trip Finance
          </p>
        </div>

        {/* Trip Summary Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-inner">
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-white">{trip.name}</span>
            <Badge variant="brand" size="sm">{trip.trip_type}</Badge>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
              <span>{trip.destination}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{dateRangeText}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{trip.member_count} companions already joined</span>
            </div>
          </div>

          {trip.description && (
            <p className="text-xs text-slate-400 border-t border-slate-800/80 pt-3 leading-relaxed">
              {trip.description}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Join Actions */}
        {successJoined ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-center gap-2 font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Joined trip successfully! Opening workspace...
          </div>
        ) : isAuthenticated ? (
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center text-sm font-bold shadow-glow-brand"
              isLoading={isJoining}
              onClick={handleJoinTrip}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Accept & Join Trip as {user?.name}
            </Button>

            <div className="text-center">
              <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-300 transition">
                Skip to Dashboard
              </Link>
            </div>
          </div>
        ) : isCurrentGuestForTrip ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center space-y-1">
              <p className="font-semibold">You are participating in this trip as Guest ({guestSession?.displayName}).</p>
              <p className="text-amber-400/80 text-[11px]">You already have access to this trip workspace.</p>
            </div>
            <Link to={`/trips/${id}`} className="block w-full">
              <Button variant="primary" size="lg" className="w-full justify-center text-sm font-bold shadow-glow-brand">
                Open Trip Workspace
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Quick Guest Join Form (Phase 4 Hybrid Membership) */}
            <form onSubmit={handleGuestJoin} className="space-y-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/90">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Quick Join as Guest
                </span>
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-medium">
                  No password needed
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enter your name to join this trip immediately. You can convert to a full account anytime.
              </p>
              <div className="flex gap-2">
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your Name (e.g. Ahmed)"
                  required
                  className="text-xs py-2"
                  leftIcon={<User className="w-3.5 h-3.5" />}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400"
                  isLoading={isGuestJoining}
                >
                  Join
                </Button>
              </div>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-950 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 absolute">
                OR SIGN IN
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to={`/login?redirect=/join/${trip.id}`} className="w-full">
                <Button variant="outline" size="md" className="w-full justify-center text-xs" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                  Log In
                </Button>
              </Link>
              <Link to={`/register?redirect=/join/${trip.id}`} className="w-full">
                <Button variant="outline" size="md" className="w-full justify-center text-xs" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                  Register
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

