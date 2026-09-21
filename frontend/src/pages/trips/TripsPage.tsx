import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Plus, 
  MapPin, 
  Users, 
  Wallet, 
  ArrowRight,
  Calendar
} from 'lucide-react';
import { tripsApi } from '../../features/trips/api';
import type { Trip } from '../../features/trips/types';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatTripDateRange } from '../../utils/dates';

export const TripsPage: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    tripsApi
      .getTrips()
      .then(setTrips)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filteredTrips = trips.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-brand-400" />
            Your Trips & Outings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track expenses, manage budgets, and settle balances across all your adventures
          </p>
        </div>

        <Link to="/trips/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Create New Trip
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        {['ALL', 'PLANNING', 'ACTIVE', 'COMPLETED'].map((statusKey) => (
          <button
            key={statusKey}
            onClick={() => setFilter(statusKey)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition duration-150 ${
              filter === statusKey
                ? 'bg-brand-600 text-white shadow-glow-brand'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            {statusKey.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <Spinner size="lg" />
      ) : filteredTrips.length === 0 ? (
        <EmptyState
          title="No trips found"
          description={
            filter === 'ALL'
              ? "You haven't created or joined any trips yet. Start by planning your next adventure!"
              : `No trips with status "${filter.toLowerCase()}".`
          }
          icon={<MapPin className="w-6 h-6" />}
          action={
            filter === 'ALL' ? (
              <Link to="/trips/new">
                <Button variant="primary" size="sm">
                  Create a Trip
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setFilter('ALL')}>
                Show All Trips
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const isOwner = trip.owner_id === user?.id;

            return (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="group block">
                <Card variant="glass" hoverEffect className="h-full flex flex-col justify-between p-6 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
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
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition duration-150">
                        {trip.name}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        {trip.destination}
                      </p>
                      {(trip.start_date || trip.end_date) && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {formatTripDateRange(trip.start_date, trip.end_date)}
                        </p>
                      )}
                    </div>

                    {trip.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {trip.description}
                      </p>
                    )}
                  </div>

                  {/* Trip Stats Footer */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{trip.member_count} members</span>
                      </div>

                      {trip.budget ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold justify-end">
                          <Wallet className="w-3.5 h-3.5" />
                          <span>
                            {trip.currency === 'INR' ? '₹' : trip.currency}{' '}
                            {Number(trip.budget).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-right">No budget set</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-brand-400 font-medium pt-1">
                      <span>{isOwner ? 'Organizer' : 'Participant'}</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition duration-150">
                        View Trip <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
