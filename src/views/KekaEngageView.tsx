import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Award,
  Heart,
  Plus,
  Send,
  Sparkles,
  Cake,
  PartyPopper,
  Megaphone,
  ThumbsUp,
  UserCheck,
} from 'lucide-react';
import { api } from '../api.ts';
import { notify } from '../utils/notify.ts';
import type { Role, SocialPost, Employee } from '../types.ts';

interface KekaEngageViewProps {
  currentUser: {
    employeeId: string;
    employeeCode: string;
    name: string;
    role: Role;
  };
}

export const KekaEngageView: React.FC<KekaEngageViewProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // New post modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [postType, setPostType] = useState<'PRAISE' | 'ANNOUNCEMENT'>('PRAISE');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [kudosBadge, setKudosBadge] = useState<any>('INNOVATOR');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');

  useEffect(() => {
    loadEngageData();
  }, []);

  const loadEngageData = async () => {
    try {
      setLoading(true);
      const [allPosts, allEmps] = await Promise.all([
        api.getSocialPosts(),
        api.getEmployees(),
      ]);
      setPosts(allPosts);
      setEmployees(allEmps);
      if (allEmps.length > 0 && !targetEmployeeId) {
        setTargetEmployeeId(allEmps[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSocialPost({
        type: postType,
        title: postType === 'ANNOUNCEMENT' ? postTitle : undefined,
        content: postContent,
        kudosBadge: postType === 'PRAISE' ? kudosBadge : undefined,
        targetEmployeeId: postType === 'PRAISE' ? targetEmployeeId : undefined,
      });
      setShowPostModal(false);
      setPostTitle('');
      setPostContent('');
      notify('Post published', 'success');
      loadEngageData();
    } catch (err: any) {
      notify(`Error publishing post: ${err.message}`, 'error');
    }
  };

  const handleLike = async (id: string) => {
    try {
      const res = await api.likeSocialPost(id);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: res.likes } : p))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const upcomingBirthdays = [
    { name: 'Sneha Rao', date: 'June 30', dept: 'Engineering' },
    { name: 'Karthik Subramanian', date: 'November 15', dept: 'Finance & Accounts' },
  ];

  const workAnniversaries = [
    { name: 'Vikram Aditya', years: 6, date: 'January 15' },
    { name: 'Pooja Sharma', years: 5, date: 'March 1' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Company Wall
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPostType('PRAISE');
              setShowPostModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Award className="h-4 w-4 text-slate-900" />
            <span>Give Kudos / Praise</span>
          </button>

          {(currentUser.role === 'ADMIN' || currentUser.role === 'HR_MANAGER') && (
            <button
              onClick={() => {
                setPostType('ANNOUNCEMENT');
                setShowPostModal(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Megaphone className="h-4 w-4 text-emerald-400" />
              <span>Broadcast Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Feed on Left (2 cols), Celebrations on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Feed Posts */}
        <div className="lg:col-span-2 space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-xs">
                    {post.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{post.authorName}</div>
                    <div className="text-2xs text-slate-400 font-mono">
                      {post.authorRole} · {post.createdAt}
                    </div>
                  </div>
                </div>

                {post.type === 'PRAISE' && (
                  <span className="text-2xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>{post.kudosBadge || 'Kudos'}</span>
                  </span>
                )}

                {post.type === 'ANNOUNCEMENT' && (
                  <span className="text-2xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Megaphone className="h-3 w-3 text-blue-600" />
                    <span>Official Announcement</span>
                  </span>
                )}
              </div>

              {post.title && <div className="font-bold text-slate-900 text-sm">{post.title}</div>}

              {post.targetEmployeeName && (
                <div className="text-2xs font-semibold text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                  Recognizing: <span className="text-slate-900 font-bold">{post.targetEmployeeName}</span>
                </div>
              )}

              <p className="text-slate-700 leading-relaxed">{post.content}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 font-medium transition-colors"
                >
                  <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-50" />
                  <span>{post.likes} Applauds</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Milestone Celebrations (Keka Style) */}
        <div className="space-y-5">
          {/* Birthdays */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Cake className="h-4 w-4 text-pink-500" />
              <span>Upcoming Birthdays</span>
            </h3>
            <div className="divide-y divide-slate-100 text-2xs">
              {upcomingBirthdays.map((b, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{b.name}</div>
                    <div className="text-slate-400">{b.dept}</div>
                  </div>
                  <span className="font-mono text-pink-700 font-medium">{b.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Work Anniversaries */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <PartyPopper className="h-4 w-4 text-purple-500" />
              <span>Work Anniversaries</span>
            </h3>
            <div className="divide-y divide-slate-100 text-2xs">
              {workAnniversaries.map((w, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{w.name}</div>
                    <div className="text-slate-400">{w.years} Years of Excellence</div>
                  </div>
                  <span className="font-mono text-purple-700 font-medium">{w.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Post / Kudos Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleCreatePost} className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              {postType === 'PRAISE' ? 'Send Kudos & Peer Recognition' : 'Post Company Announcement'}
            </h3>

            {postType === 'ANNOUNCEMENT' && (
              <div>
                <label className="font-medium text-slate-700">Announcement Headline</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Office Relocation Update..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>
            )}

            {postType === 'PRAISE' && (
              <>
                <div>
                  <label className="font-medium text-slate-700">Select Teammate to Recognize</label>
                  <select
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700">Core Value Badge</label>
                  <select
                    value={kudosBadge}
                    onChange={(e) => setKudosBadge(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                  >
                    <option value="INNOVATOR">Innovator & Problem Solver</option>
                    <option value="TEAM_PLAYER">Selfless Team Player</option>
                    <option value="CUSTOMER_OBSESSED">Customer Obsessed</option>
                    <option value="OWNERSHIP">Extreme Ownership</option>
                    <option value="STAR_PERFORMER">Star Performer</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="font-medium text-slate-700">Message Content</label>
              <textarea
                required
                rows={3}
                placeholder="Share your appreciation or announcement..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowPostModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 text-white bg-slate-900 rounded font-semibold">Publish to Wall</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
