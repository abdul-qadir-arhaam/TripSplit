import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';

interface ConvertGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onConverted?: () => void;
}

export const ConvertGuestModal: React.FC<ConvertGuestModalProps> = ({
  isOpen,
  onClose,
  tripId,
  onConverted,
}) => {
  const { guestSession, convertGuestSession } = useAuth();
  const [name, setName] = useState(guestSession?.displayName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide an email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await convertGuestSession(tripId, {
        email: email.trim(),
        password: password.trim(),
        name: name.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onConverted?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to convert guest account. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card
        variant="glass"
        className="w-full max-w-md p-6 space-y-5 animate-slide-up border-slate-800/90 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-glow-brand">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Save Trip to Account</h2>
              <p className="text-xs text-slate-400">Claim your guest identity permanently</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Value Proposition Box */}
        <div className="p-3.5 rounded-xl bg-brand-950/40 border border-brand-800/60 space-y-2 text-xs text-brand-200">
          <div className="flex items-center gap-2 font-semibold text-brand-300">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Keep your participation safe forever</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            All your expenses, balance splits, and trip history will stay linked without creating any duplicate records.
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Account Created & Trip Claimed!</h3>
            <p className="text-xs text-emerald-300">
              You are now fully registered. Refreshing your dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Your Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmed Khan"
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Choose a Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="w-1/3 justify-center"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-2/3 justify-center font-bold shadow-glow-brand"
                isLoading={isLoading}
              >
                Claim & Create Account
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
