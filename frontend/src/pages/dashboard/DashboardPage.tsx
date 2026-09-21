import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Users, 
  MapPin, 
  Receipt, 
  ShieldCheck, 
  Plus, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { tripsApi } from '../../features/trips/api';
import { friendsApi } from '../../features/friends/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tripCount, setTripCount] = useState<number>(0);
  const [friendCount, setFriendCount] = useState<number>(0);

  useEffect(() => {
    tripsApi.getTrips().then((data) => setTripCount(data.length)).catch(() => {});
    friendsApi.getFriends().then((data) => setFriendCount(data.length)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950/90 via-slate-900 to-indigo-950/60 border border-brand-800/40 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">
                <Sparkles className="w-3 h-3 text-brand-400" />
                Phase 2 & 3 Active
              </Badge>
              <Badge variant="success" size="sm">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Session Secure
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">{user?.name}</span>!
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Your centralized financial workspace for group trips, shared expenses, debt settlements, and budget tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/trips/new">
              <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                Create Trip
              </Button>
            </Link>
            <Link to="/friends">
              <Button variant="secondary" size="md" leftIcon={<Users className="w-4 h-4" />}>
                Find Friends
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative ambient background orb */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/trips" className="block group">
          <Card variant="glass" hoverEffect className="space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Your Trips</span>
              <div className="p-2 rounded-xl bg-brand-950/60 border border-brand-800/50 text-brand-400 group-hover:scale-110 transition">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{tripCount}</div>
            <p className="text-xs text-brand-400 font-medium flex items-center gap-1">
              View trips &rarr;
            </p>
          </Card>
        </Link>

        <Card variant="glass" className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Balance</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">₹0.00</div>
          <p className="text-xs text-slate-400">Phase 8: Balance Engine</p>
        </Card>

        <Link to="/friends" className="block group">
          <Card variant="glass" hoverEffect className="space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Travel Friends</span>
              <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 group-hover:scale-110 transition">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{friendCount}</div>
            <p className="text-xs text-indigo-400 font-medium flex items-center gap-1">
              Manage friends &rarr;
            </p>
          </Card>
        </Link>

        <Link to="/groups" className="block group">
          <Card variant="glass" hoverEffect className="space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Travel Groups</span>
              <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-400 group-hover:scale-110 transition">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">Manage</div>
            <p className="text-xs text-amber-400 font-medium flex items-center gap-1">
              View circles &rarr;
            </p>
          </Card>
        </Link>
      </div>

      {/* Quick Action Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link to="/trips/new" className="group block">
          <Card variant="glass" hoverEffect className="p-6 space-y-3 border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-950/80 border border-brand-800/80 text-brand-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-brand-300 transition">Plan a New Adventure</h3>
                  <p className="text-xs text-slate-400">Set budget, dates, and destinations</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create an organized ledger for an upcoming road trip, college outing, or vacation. Attach your friends with a single click.
            </p>
          </Card>
        </Link>

        <Link to="/friends" className="group block">
          <Card variant="glass" hoverEffect className="p-6 space-y-3 border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition">Assemble Travel Circles</h3>
                  <p className="text-xs text-slate-400">Search users and build groups</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find travel buddies by email, accept incoming friend requests, and organize reusable friend circles for rapid trip invites.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
};
