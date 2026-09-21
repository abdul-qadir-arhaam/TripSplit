import React, { useState } from 'react';
import { User, Mail, Calendar, Camera, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        profile_photo: profilePhoto.trim() || null,
      });
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to update profile. Please try again.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Account Profile</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal details and travel identity
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* User Profile Card */}
      <Card variant="glass" className="p-8 border-slate-800/80">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar & Header Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800/60">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 to-emerald-500 p-0.5 shadow-glow-brand overflow-hidden">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={name}
                    className="w-full h-full object-cover rounded-[22px]"
                    onError={() => setProfilePhoto('')}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-2xl font-bold text-brand-300 uppercase">
                    {name?.slice(0, 2) || 'TF'}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-white">{name || 'Your Name'}</h2>
                <Badge variant="brand" size="sm">Registered User</Badge>
              </div>
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Member since {formattedDate}
              </p>
            </div>
          </div>

          {/* Edit Fields */}
          <div className="grid grid-cols-1 gap-5">
            <Input
              id="name-input"
              label="Display Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              id="email-input"
              label="Email Address (Immutable)"
              type="email"
              value={user?.email || ''}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Email cannot be changed after account creation."
            />

            <Input
              id="avatar-input"
              label="Profile Photo URL (Optional)"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={profilePhoto}
              onChange={(e) => setProfilePhoto(e.target.value)}
              leftIcon={<Camera className="w-4 h-4" />}
              helperText="Enter a direct image URL for your avatar."
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end pt-4 border-t border-slate-800/60">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
