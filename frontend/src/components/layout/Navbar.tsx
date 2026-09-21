import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, LogOut, LayoutDashboard, MapPin, Users, Layers, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { ConvertGuestModal } from '../trips/ConvertGuestModal';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isGuest, guestSession, clearGuestSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showConvertModal, setShowConvertModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Trips', path: '/trips', icon: MapPin },
    { label: 'Friends', path: '/friends', icon: Users },
    { label: 'Groups', path: '/groups', icon: Layers },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand transition-transform group-hover:scale-105">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Trip Finance
              </span>
            </Link>

            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition duration-150 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-brand-950 text-brand-300 border border-brand-800/80'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition duration-150"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600/30 to-emerald-500/30 border border-brand-500/40 text-brand-300 flex items-center justify-center font-semibold text-xs uppercase">
                    {user?.profile_photo ? (
                      <img src={user.profile_photo} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user?.name?.slice(0, 2) || 'US'
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
                    <div className="text-[10px] text-slate-400">{user?.email}</div>
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Log out</span>
                </Button>
              </div>
            ) : isGuest && guestSession ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Guest: {guestSession.displayName}</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowConvertModal(true)}
                  className="text-xs font-bold bg-gradient-to-r from-amber-500 to-brand-600 hover:from-amber-600 hover:to-brand-700 shadow-glow-brand"
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Save Account
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearGuestSession();
                    navigate('/login');
                  }}
                  className="text-slate-400 hover:text-rose-400 text-xs"
                >
                  Exit
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {isGuest && guestSession && (
        <ConvertGuestModal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          tripId={guestSession.tripId}
        />
      )}
    </>
  );
};

