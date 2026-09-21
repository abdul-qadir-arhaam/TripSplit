import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  UserMinus, 
  Clock, 
  ShieldAlert
} from 'lucide-react';
import { friendsApi } from '../../features/friends/api';
import type { FriendUser, FriendRequestItem } from '../../features/friends/types';
import type { User } from '../../features/auth/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';

export const FriendsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'search'>('friends');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getRequests(),
      ]);
      setFriends(friendsData);
      setIncoming(requestsData.incoming);
      setOutgoing(requestsData.outgoing);
    } catch {
      // Handled silently or empty state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await friendsApi.searchUsers(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendRequest = async (receiverId: string) => {
    setActionMessage(null);
    try {
      await friendsApi.sendRequest(receiverId);
      setActionMessage({ type: 'success', text: 'Friend request sent successfully!' });
      await loadData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to send friend request.',
      });
    }
  };

  const handleAccept = async (requestId: string) => {
    setActionMessage(null);
    try {
      await friendsApi.acceptRequest(requestId);
      setActionMessage({ type: 'success', text: 'Friend request accepted!' });
      await loadData();
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to accept request.' });
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionMessage(null);
    try {
      await friendsApi.declineRequest(requestId);
      setActionMessage({ type: 'success', text: 'Friend request declined.' });
      await loadData();
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to decline request.' });
    }
  };

  const handleRemoveFriend = async (friendId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your friends?`)) return;
    setActionMessage(null);
    try {
      await friendsApi.removeFriend(friendId);
      setActionMessage({ type: 'success', text: `${name} removed from friends.` });
      await loadData();
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to remove friend.' });
    }
  };

  const friendIds = new Set(friends.map((f) => f.id));
  const pendingOutgoingIds = new Set(outgoing.map((r) => r.receiver_id));
  const pendingIncomingIds = new Set(incoming.map((r) => r.sender_id));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-400" />
            Travel Friends
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect with friends to easily invite them to trips and split shared expenses
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setActiveTab('search')}
        >
          Find Friends
        </Button>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 animate-fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition duration-150 flex items-center gap-2 ${
            activeTab === 'friends'
              ? 'bg-brand-600 text-white shadow-glow-brand'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Friends ({friends.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition duration-150 flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-brand-600 text-white shadow-glow-brand'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Requests
          {incoming.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
              {incoming.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition duration-150 flex items-center gap-2 ${
            activeTab === 'search'
              ? 'bg-brand-600 text-white shadow-glow-brand'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Search Users
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Spinner size="lg" />
      ) : activeTab === 'friends' ? (
        friends.length === 0 ? (
          <EmptyState
            title="No friends added yet"
            description="Search for your travel buddies by their name or registered email address to start sharing trip expenses."
            icon={<Users className="w-6 h-6" />}
            action={
              <Button variant="primary" size="sm" onClick={() => setActiveTab('search')}>
                Find Friends
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <Card key={friend.id} variant="glass" className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600/30 to-emerald-500/30 border border-brand-500/40 text-brand-300 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                    {friend.profile_photo ? (
                      <img src={friend.profile_photo} alt={friend.name} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      friend.name.slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{friend.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFriend(friend.id, friend.name)}
                  className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                  title="Remove friend"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )
      ) : activeTab === 'pending' ? (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Incoming Requests ({incoming.length})
            </h2>
            {incoming.length === 0 ? (
              <p className="text-xs text-slate-500">No pending requests from other users.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incoming.map((req) => (
                  <Card key={req.id} variant="glass" className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-950 text-brand-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {req.sender?.name?.slice(0, 2) || 'FR'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{req.sender?.name}</div>
                        <div className="text-xs text-slate-400 truncate">{req.sender?.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAccept(req.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDecline(req.id)}
                        className="text-slate-400 hover:text-rose-400"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Outgoing Sent Requests ({outgoing.length})
            </h2>
            {outgoing.length === 0 ? (
              <p className="text-xs text-slate-500">You have no outgoing pending friend requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outgoing.map((req) => (
                  <Card key={req.id} variant="glass" className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {req.receiver?.name?.slice(0, 2) || 'TO'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{req.receiver?.name}</div>
                        <div className="text-xs text-slate-400 truncate">{req.receiver?.email}</div>
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">
                      Pending
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Search Tab */
        <div className="space-y-6">
          <Card variant="glass" className="p-6">
            <Input
              id="search-users-input"
              label="Search by Name or Email"
              type="text"
              placeholder="e.g. Ahmed or ahmed@example.com"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              helperText="Type at least 2 characters to search across registered users."
            />
          </Card>

          {isSearching ? (
            <Spinner size="md" />
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((u) => {
                const isAlreadyFriend = friendIds.has(u.id);
                const isPendingOutgoing = pendingOutgoingIds.has(u.id);
                const isPendingIncoming = pendingIncomingIds.has(u.id);

                return (
                  <Card key={u.id} variant="glass" className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-950 text-brand-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {u.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{u.name}</div>
                        <div className="text-xs text-slate-400 truncate">{u.email}</div>
                      </div>
                    </div>

                    {isAlreadyFriend ? (
                      <Badge variant="success" size="sm">
                        <Check className="w-3 h-3" /> Friends
                      </Badge>
                    ) : isPendingOutgoing ? (
                      <Badge variant="warning" size="sm">
                        Request Sent
                      </Badge>
                    ) : isPendingIncoming ? (
                      <Badge variant="brand" size="sm">
                        Requested You
                      </Badge>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<UserPlus className="w-4 h-4" />}
                        onClick={() => handleSendRequest(u.id)}
                      >
                        Add Friend
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            <EmptyState
              title="No users found"
              description={`We couldn't find any registered users matching "${searchQuery}".`}
              icon={<Search className="w-6 h-6" />}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
