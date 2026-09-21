import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Users, 
  Trash2, 
  Edit2, 
  UserPlus, 
  UserMinus, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { groupsApi } from '../../features/groups/api';
import { friendsApi } from '../../features/friends/api';
import type { Group, GroupDetail } from '../../features/groups/types';
import type { FriendUser } from '../../features/friends/types';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';

export const GroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [selectedFriendToAdd, setSelectedFriendToAdd] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadGroups = async () => {
    try {
      const data = await groupsApi.getGroups();
      setGroups(data);
      if (selectedGroup) {
        const freshDetail = await groupsApi.getGroupDetail(selectedGroup.id);
        setSelectedGroup(freshDetail);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    friendsApi.getFriends().then(setFriends).catch(() => {});
  }, []);

  const handleSelectGroup = async (groupId: string) => {
    try {
      const detail = await groupsApi.getGroupDetail(groupId);
      setSelectedGroup(detail);
      setEditingGroupId(null);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to load group details.' });
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const created = await groupsApi.createGroup({ name: newGroupName.trim() });
      setNewGroupName('');
      setShowCreateModal(false);
      setFeedback({ type: 'success', text: `Group "${created.name}" created!` });
      await loadGroups();
      await handleSelectGroup(created.id);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to create group.' });
    }
  };

  const handleRenameGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !editGroupName.trim()) return;
    try {
      await groupsApi.updateGroup(selectedGroup.id, { name: editGroupName.trim() });
      setEditingGroupId(null);
      setFeedback({ type: 'success', text: 'Group renamed successfully.' });
      await loadGroups();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to rename group.' });
    }
  };

  const handleDeleteGroup = async (groupId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await groupsApi.deleteGroup(groupId);
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      setFeedback({ type: 'success', text: 'Group deleted.' });
      await loadGroups();
    } catch {
      setFeedback({ type: 'error', text: 'Failed to delete group.' });
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !selectedFriendToAdd) return;
    try {
      const updated = await groupsApi.addMember(selectedGroup.id, selectedFriendToAdd);
      setSelectedGroup(updated);
      setSelectedFriendToAdd('');
      setFeedback({ type: 'success', text: 'Friend added to group!' });
      await loadGroups();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to add member.' });
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!selectedGroup) return;
    if (!window.confirm(`Remove ${name} from this group?`)) return;
    try {
      const updated = await groupsApi.removeMember(selectedGroup.id, userId);
      setSelectedGroup(updated);
      setFeedback({ type: 'success', text: `${name} removed from group.` });
      await loadGroups();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to remove member.' });
    }
  };

  // Friends not yet in selected group
  const existingMemberUserIds = new Set(selectedGroup?.members.map((m) => m.user_id));
  const availableFriendsToAdd = friends.filter((f) => !existingMemberUserIds.has(f.id));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-brand-400" />
            Travel Groups
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize reusable friend collections (e.g. College Buddies, Family) to invite into trips with one click
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Group
        </Button>
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
          <span>{feedback.text}</span>
        </div>
      )}

      {isLoading ? (
        <Spinner size="lg" />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No travel groups created"
          description="Groups allow you to assemble friends you frequently travel with so you can invite all of them to trips simultaneously."
          icon={<Layers className="w-6 h-6" />}
          action={
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              Create First Group
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Groups ({groups.length})
            </h2>
            <div className="space-y-2.5">
              {groups.map((g) => {
                const isSelected = selectedGroup?.id === g.id;
                const isOwner = g.owner_id === user?.id;

                return (
                  <div
                    key={g.id}
                    onClick={() => handleSelectGroup(g.id)}
                    className={`p-4 rounded-2xl border transition duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-900 border-brand-500/60 shadow-glow-brand'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-950/80 border border-brand-800/50 text-brand-400 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{g.name}</h3>
                        <p className="text-xs text-slate-400">{g.member_count} members</p>
                      </div>
                    </div>

                    {isOwner && (
                      <Badge variant="brand" size="sm">
                        Owner
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Detail View */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <Card variant="glass" className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  {editingGroupId === selectedGroup.id ? (
                    <form onSubmit={handleRenameGroup} className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        className="py-1.5 text-sm"
                        autoFocus
                      />
                      <Button type="submit" variant="primary" size="sm">
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingGroupId(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{selectedGroup.name}</h2>
                        {selectedGroup.owner_id === user?.id && (
                          <button
                            onClick={() => {
                              setEditingGroupId(selectedGroup.id);
                              setEditGroupName(selectedGroup.name);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Rename group"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedGroup.members.length} members in this circle
                      </p>
                    </div>
                  )}

                  {selectedGroup.owner_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(selectedGroup.id, selectedGroup.name)}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete Group
                    </Button>
                  )}
                </div>

                {/* Add Friend to Group */}
                {availableFriendsToAdd.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Add Friend to Group
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedFriendToAdd}
                        onChange={(e) => setSelectedFriendToAdd(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Select a friend...</option>
                        {availableFriendsToAdd.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.email})
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!selectedFriendToAdd}
                        onClick={handleAddMember}
                        leftIcon={<UserPlus className="w-4 h-4" />}
                      >
                        Add Member
                      </Button>
                    </div>
                  </div>
                )}

                {/* Member Roster */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Members ({selectedGroup.members.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedGroup.members.map((m) => {
                      const isGroupOwner = m.user_id === selectedGroup.owner_id;
                      const isCurrentUser = m.user_id === user?.id;

                      return (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600/30 to-indigo-500/30 border border-brand-500/40 text-brand-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {m.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                                {m.name}
                                {isCurrentUser && <span className="text-[10px] text-slate-500">(You)</span>}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">{m.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isGroupOwner ? (
                              <Badge variant="brand" size="sm">Owner</Badge>
                            ) : (
                              (selectedGroup.owner_id === user?.id || isCurrentUser) && (
                                <button
                                  onClick={() => handleRemoveMember(m.user_id, m.name)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-950/20 transition"
                                  title={isCurrentUser ? 'Leave group' : 'Remove member'}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ) : (
              <Card variant="bordered" className="p-12 text-center text-slate-500">
                <Layers className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">Select a group on the left to view and manage its members</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="glass" className="w-full max-w-md p-6 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                Create Travel Group
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <Input
                label="Group Name"
                placeholder="e.g. College Gang, Weekend Hikers"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
                autoFocus
              />

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Group
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
