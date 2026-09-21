import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  generateTripInviteText, 
  openWhatsApp, 
  type TripInviteData 
} from '../../services/whatsapp';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripInviteData;
  inviterName?: string;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  trip,
  inviterName,
}) => {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const inviteText = generateTripInviteText(trip, inviterName);
  const joinUrl = `${window.location.origin}/join/${trip.id}`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenWhatsApp = () => {
    openWhatsApp(inviteText);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-lg p-6 space-y-5 animate-slide-up border-slate-800/90 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Share Trip via WhatsApp
              </h2>
              <p className="text-xs text-slate-400">
                Invite friends and group chats directly with one click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info banner */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Clicking <strong>Open WhatsApp</strong> opens your WhatsApp app or WhatsApp Web so you can pick any friend or group to send this invitation to.
          </span>
        </div>

        {/* Message Preview (WhatsApp chat bubble look) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Invitation Preview</span>
            <span className="text-[10px] text-emerald-400 font-normal">WhatsApp Formatted</span>
          </div>

          <div className="relative rounded-2xl bg-slate-950/80 border border-emerald-900/30 p-4 font-sans text-xs text-slate-200 shadow-inner max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
              Preview
            </div>
            {inviteText}
          </div>
        </div>

        {/* Direct Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition duration-150"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            Open in WhatsApp
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyMessage}
              className="w-full text-xs justify-center"
            >
              {copiedMessage ? 'Copied Message!' : 'Copy Full Message'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              onClick={handleCopyLink}
              className="w-full text-xs justify-center"
            >
              {copiedLink ? 'Copied Link!' : 'Copy Invite Link'}
            </Button>
          </div>
        </div>

        {/* Close */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};
