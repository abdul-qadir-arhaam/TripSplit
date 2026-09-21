import React, { useState, useEffect } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Plus, 
  RefreshCw, 
  Slash, 
  Users, 
  AlertCircle,
  Share2,
  Clock,
  Sparkles
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { invitesApi } from '../../features/invites/api';
import type { TripInvite } from '../../features/invites/types';
import { openWhatsApp, generateTripInviteText, type TripInviteData } from '../../services/whatsapp';

interface ManageInvitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripInviteData;
  inviterName?: string;
}

export const ManageInvitesModal: React.FC<ManageInvitesModalProps> = ({
  isOpen,
  onClose,
  trip,
  inviterName,
}) => {
  const [invites, setInvites] = useState<TripInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expiryOption, setExpiryOption] = useState<number | null>(30); // 1, 7, 30, null
  const [maxUsesInput, setMaxUsesInput] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // Newly created or active token tracked locally if returned with token
  const [activeTokenMap, setActiveTokenMap] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchInvites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await invitesApi.getTripInvites(trip.id);
      setInvites(data);

      // If no active invites exist, automatically create a default one
      const hasActive = data.some((i) => i.is_active && !i.is_expired);
      if (!hasActive && data.length === 0) {
        const defaultInv = await invitesApi.generateTripInvite(trip.id, { expires_in_days: 30 });
        setInvites([defaultInv]);
        if (defaultInv.token) {
          setActiveTokenMap((prev) => ({ ...prev, [defaultInv.id]: defaultInv.token! }));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load trip invites.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInvites();
    }
  }, [isOpen, trip.id]);

  if (!isOpen) return null;

  const handleCopyLink = async (invite: TripInvite) => {
    const rawToken = activeTokenMap[invite.id] || invite.token || invite.code;
    const origin = window.location.origin;
    const url = `${origin}/join/${rawToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(invite.id);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = (invite: TripInvite) => {
    const rawToken = activeTokenMap[invite.id] || invite.token || invite.code;
    const inviteText = generateTripInviteText(trip, inviterName, rawToken);
    openWhatsApp(inviteText);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    try {
      const maxUses = maxUsesInput ? parseInt(maxUsesInput, 10) : null;
      const newInv = await invitesApi.generateTripInvite(trip.id, {
        expires_in_days: expiryOption,
        max_uses: maxUses || undefined,
      });

      if (newInv.token) {
        setActiveTokenMap((prev) => ({ ...prev, [newInv.id]: newInv.token! }));
      }
      setInvites((prev) => [newInv, ...prev]);
      setShowCreateForm(false);
      setMaxUsesInput('');
      setExpiryOption(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate invite link.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDisableInvite = async (inviteId: string) => {
    setActionLoadingId(inviteId);
    setError(null);
    try {
      const updated = await invitesApi.disableTripInvite(trip.id, inviteId);
      setInvites((prev) => prev.map((inv) => (inv.id === inviteId ? updated : inv)));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to disable invite link.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRegenerateInvite = async (inviteId: string) => {
    setActionLoadingId(inviteId);
    setError(null);
    try {
      const updated = await invitesApi.regenerateTripInvite(trip.id, inviteId);
      if (updated.token) {
        setActiveTokenMap((prev) => ({ ...prev, [updated.id]: updated.token! }));
      }
      setInvites((prev) => prev.map((inv) => (inv.id === inviteId ? updated : inv)));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to regenerate invite link.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeInvite = invites.find((i) => i.is_active && !i.is_expired);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <Card
        variant="glass"
        className="max-w-2xl w-full p-6 sm:p-7 space-y-6 border-slate-800/90 shadow-2xl relative animate-scale-in my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Manage Invite Links
                <Badge variant="brand" size="sm">Phase 5</Badge>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Shareable cryptographic invitation links for <span className="text-slate-200 font-semibold">{trip.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary Active Link Box */}
            {activeInvite ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-brand-950/30 border border-brand-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <span>Primary Active Invite Link</span>
                  </div>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono truncate select-all">
                    {`${window.location.origin}/join/${activeTokenMap[activeInvite.id] || activeInvite.token || activeInvite.code}`}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCopyLink(activeInvite)}
                      leftIcon={copiedToken === activeInvite.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      {copiedToken === activeInvite.id ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleWhatsAppShare(activeInvite)}
                      leftIcon={<Share2 className="w-3.5 h-3.5 text-emerald-400" />}
                      className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    >
                      WhatsApp
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {activeInvite.expires_at 
                      ? `Expires: ${new Date(activeInvite.expires_at).toLocaleDateString()}` 
                      : 'Never expires'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    {activeInvite.max_uses ? `${activeInvite.use_count} / ${activeInvite.max_uses} uses` : `${activeInvite.use_count} uses`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                <span>No active invite link. Generate one to invite travelers.</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  className="text-xs"
                >
                  Create Link
                </Button>
              </div>
            )}

            {/* Create New Link Section */}
            <div>
              {!showCreateForm ? (
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Invite Links History
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    New Invite Link
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleCreateInvite}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-brand-400" />
                      Configure New Invite Link
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Expiration Presets */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Expiration Duration
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '24 Hours', days: 1 },
                        { label: '7 Days', days: 7 },
                        { label: '30 Days', days: 30 },
                        { label: 'Never', days: null },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setExpiryOption(preset.days)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition ${
                            expiryOption === preset.days
                              ? 'bg-brand-500/20 border-brand-500 text-brand-300 font-semibold shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Max Uses */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Maximum Uses (Optional)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Unlimited uses if blank (e.g. 5)"
                      value={maxUsesInput}
                      onChange={(e) => setMaxUsesInput(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isCreating}
                      className="text-xs"
                    >
                      Generate Secure Link
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Invites List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {invites.map((inv) => {
                const isItemActive = inv.is_active && !inv.is_expired;

                return (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300 font-bold">
                          {inv.code}
                        </span>
                        {isItemActive ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : inv.is_expired ? (
                          <Badge variant="danger" size="sm">Expired</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Revoked</Badge>
                        )}
                        <span className="text-[11px] text-slate-500">
                          {inv.use_count} {inv.max_uses ? `/ ${inv.max_uses}` : ''} used
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-3">
                        <span>Created: {new Date(inv.created_at).toLocaleDateString()}</span>
                        {inv.expires_at && (
                          <span>Expires: {new Date(inv.expires_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isItemActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(inv)}
                          title="Copy Link"
                          className="h-8 px-2 text-slate-300 hover:text-white"
                        >
                          {copiedToken === inv.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}

                      {/* Regenerate Action */}
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={actionLoadingId === inv.id}
                        onClick={() => handleRegenerateInvite(inv.id)}
                        title="Regenerate token"
                        className="h-8 px-2 text-slate-400 hover:text-brand-300"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>

                      {/* Disable Action */}
                      {inv.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={actionLoadingId === inv.id}
                          onClick={() => handleDisableInvite(inv.id)}
                          title="Revoke / Disable"
                          className="h-8 px-2 text-slate-400 hover:text-rose-400"
                        >
                          <Slash className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/80 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};
