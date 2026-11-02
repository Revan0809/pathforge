'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserPlus,
  Search,
  X,
  Check,
  ChevronLeft,
  Flame,
  Zap,
  Code2,
} from 'lucide-react'

const BACKEND = '/api/backend'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Friend {
  friendship_id: string
  user_id: string
  name: string
  college: string
  xp: number
  streak: number
  dsa_solved: number
}

interface FeedItem {
  id: string
  user_name: string
  action_type: 'dsa_solve' | 'course' | 'challenge' | 'roadmap' | string
  description: string
  created_at: string
}

interface PendingRequest {
  friendship_id: string
  user_id: string
  name: string
  college: string
  xp: number
}

interface SearchResult {
  user_id: string
  name: string
  college: string
  xp: number
  friendship_status: 'none' | 'pending' | 'accepted'
}

type Tab = 'friends' | 'requests' | 'find'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nameHash(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

const CARD_BORDERS = [
  'border-blue-500/40',
  'border-purple-500/40',
  'border-emerald-500/40',
  'border-cyan-500/40',
  'border-pink-500/40',
  'border-amber-500/40',
]

const AVATAR_GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-purple-500',
]

function getCardBorder(name: string): string {
  return CARD_BORDERS[nameHash(name) % CARD_BORDERS.length]
}

function getAvatarGradient(name: string): string {
  return AVATAR_GRADIENTS[nameHash(name) % AVATAR_GRADIENTS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

const FEED_ICONS: Record<string, string> = {
  dsa_solve: '💻',
  course: '📚',
  challenge: '🏆',
  roadmap: '🗺️',
}

const FEED_BORDER_COLORS: Record<string, string> = {
  dsa_solve: 'border-blue-500',
  course: 'border-purple-500',
  challenge: 'border-amber-500',
  roadmap: 'border-emerald-500',
}

function feedIcon(type: string): string {
  return FEED_ICONS[type] ?? '⚡'
}

function feedBorderColor(type: string): string {
  return FEED_BORDER_COLORS[type] ?? 'border-white/20'
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-32" />
          <div className="h-3 bg-white/10 rounded w-24" />
        </div>
        <div className="w-20 h-8 bg-white/10 rounded-lg" />
      </div>
    </div>
  )
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-9 h-9 text-sm' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-base'
  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br ${getAvatarGradient(name)} flex items-center justify-center font-bold text-white shrink-0`}
    >
      {getInitials(name)}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('friends')

  // Friends tab state
  const [friends, setFriends] = useState<Friend[]>([])
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [friendsLoading, setFriendsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Requests tab state
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Find People tab state
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [searchVisible, setSearchVisible] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session
      setToken(session?.access_token ?? 'demo-token')
    })
  }, [router])

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchFriends = useCallback(async (tok: string) => {
    setFriendsLoading(true)
    try {
      const [fr, fd] = await Promise.all([
        fetch(`${BACKEND}/friends`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${BACKEND}/friends/feed`, { headers: { Authorization: `Bearer ${tok}` } }),
      ])
      if (fr.ok) setFriends(await fr.json())
      if (fd.ok) setFeedItems(await fd.json())
    } catch {
      // silently fail
    } finally {
      setFriendsLoading(false)
    }
  }, [])

  const fetchRequests = useCallback(async (tok: string) => {
    setRequestsLoading(true)
    try {
      const res = await fetch(`${BACKEND}/friends/pending`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.ok) setRequests(await res.json())
    } catch {
      // silently fail
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetchFriends(token)
    fetchRequests(token)
  }, [token, fetchFriends, fetchRequests])

  // ── Realtime: activity feed ─────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel('activity_feed_insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload) => {
          const item = payload.new as FeedItem
          setFeedItems((prev) => [item, ...prev].slice(0, 10))
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ── Search (debounced 300ms) ─────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setSearchResults([])
      setSearchVisible(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      setSearchVisible(false)
      try {
        const res = await fetch(`${BACKEND}/friends/search?q=${encodeURIComponent(query.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          setSearchResults(await res.json())
          setSearchVisible(true)
        }
      } catch {
        // silently fail
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, token])

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function removeFriend(friendshipId: string) {
    if (!token) return
    setRemovingId(friendshipId)
    try {
      await fetch(`${BACKEND}/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId))
    } finally {
      setRemovingId(null)
    }
  }

  async function acceptRequest(friendshipId: string) {
    if (!token) return
    setProcessingId(friendshipId)
    try {
      await fetch(`${BACKEND}/friends/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id: friendshipId }),
      })
      setRequests((prev) => prev.filter((r) => r.friendship_id !== friendshipId))
      fetchFriends(token)
    } finally {
      setProcessingId(null)
    }
  }

  async function declineRequest(friendshipId: string) {
    if (!token) return
    setProcessingId(friendshipId)
    try {
      await fetch(`${BACKEND}/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setRequests((prev) => prev.filter((r) => r.friendship_id !== friendshipId))
    } finally {
      setProcessingId(null)
    }
  }

  async function addFriend(userId: string) {
    if (!token) return
    setAddingId(userId)
    try {
      await fetch(`${BACKEND}/friends/request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: userId }),
      })
      setSearchResults((prev) =>
        prev.map((r) => (r.user_id === userId ? { ...r, friendship_status: 'pending' } : r))
      )
    } finally {
      setAddingId(null)
    }
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'friends', label: 'Friends', icon: <Users size={16} />, count: friends.length },
    { key: 'requests', label: 'Requests', icon: <UserPlus size={16} />, count: requests.length },
    { key: 'find', label: 'Find People', icon: <Search size={16} /> },
  ]

  if (!token) return null

  return (
    <div className="min-h-screen page-bg text-white">
      {/* Header */}
      <div className="border-b border-white/10 nav-bg sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft size={16} />
            Dashboard
          </button>
          <span className="text-white/30">/</span>
          <span className="font-semibold text-white">Friends</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.key ? 'bg-black/20 text-black' : 'bg-white/20 text-white'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── FRIENDS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'friends' && (
          <div className="space-y-6">
            {/* Friend cards */}
            <div className="space-y-3">
              {friendsLoading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : friends.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-5xl">👥</div>
                  <p className="text-white/50 text-sm">No friends yet — find people from your college!</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('find')}
                    className="bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    Find People
                  </Button>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.friendship_id}
                    className={`bg-white/5 rounded-xl p-4 border ${getCardBorder(friend.name)} hover:bg-white/8 transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={friend.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{friend.name}</p>
                        <p className="text-white/50 text-sm truncate">{friend.college}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                            <Zap size={11} />
                            {friend.xp.toLocaleString()} XP
                          </span>
                          <span className="flex items-center gap-1 text-xs text-orange-400 font-semibold">
                            <Flame size={11} />
                            {friend.streak}d
                          </span>
                          <span className="flex items-center gap-1 text-xs text-blue-400 font-semibold">
                            <Code2 size={11} />
                            {friend.dsa_solved} solved
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFriend(friend.friendship_id)}
                        disabled={removingId === friend.friendship_id}
                        className="shrink-0 bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 text-xs px-3"
                      >
                        {removingId === friend.friendship_id ? '...' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Activity Feed */}
            {(feedItems.length > 0 || !friendsLoading) && (
              <div className="space-y-3">
                <h3 className="font-semibold text-white/80 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Zap size={14} className="text-amber-400" />
                  Recent Activity
                </h3>
                {feedItems.length === 0 ? (
                  <p className="text-white/30 text-sm py-4 text-center">No recent activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {feedItems.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-white/5 rounded-lg px-4 py-3 border-l-2 ${feedBorderColor(item.action_type)} border border-white/5 flex items-start gap-3`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{feedIcon(item.action_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/90">
                            <span className="font-semibold text-white">{item.user_name}</span>{' '}
                            {item.description}
                          </p>
                        </div>
                        <span className="text-xs text-white/30 shrink-0 mt-0.5">
                          {relativeTime(item.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── REQUESTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {requestsLoading ? (
              Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
            ) : requests.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-5xl">📭</div>
                <p className="text-white/50 text-sm">No pending requests</p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.friendship_id}
                  className={`bg-white/5 rounded-xl p-4 border ${getCardBorder(req.name)} hover:bg-white/8 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={req.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{req.name}</p>
                      <p className="text-white/50 text-sm truncate">{req.college}</p>
                      <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold mt-1">
                        <Zap size={11} />
                        {req.xp.toLocaleString()} XP
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => acceptRequest(req.friendship_id)}
                        disabled={processingId === req.friendship_id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 text-xs px-3"
                      >
                        <Check size={13} className="mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => declineRequest(req.friendship_id)}
                        disabled={processingId === req.friendship_id}
                        className="bg-transparent border-white/20 text-white/60 hover:bg-white/10 text-xs px-3"
                      >
                        <X size={13} className="mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── FIND PEOPLE TAB ──────────────────────────────────────────────── */}
        {activeTab === 'find' && (
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or college..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all text-sm"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setSearchResults([]); setSearchVisible(false) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Loading skeletons */}
            {searchLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Search results */}
            {!searchLoading && searchVisible && (
              <div
                className="space-y-3 transition-all duration-300"
                style={{ animation: 'fadeIn 0.25s ease' }}
              >
                {searchResults.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <div className="text-4xl">🔍</div>
                    <p className="text-white/40 text-sm">No users found for &quot;{query}&quot;</p>
                  </div>
                ) : (
                  searchResults.map((result, idx) => (
                    <div
                      key={result.user_id}
                      className={`bg-white/5 rounded-xl p-4 border ${getCardBorder(result.name)} hover:bg-white/8 transition-all duration-200`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={result.name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{result.name}</p>
                          <p className="text-white/50 text-sm truncate">{result.college}</p>
                          <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold mt-1">
                            <Zap size={11} />
                            {result.xp.toLocaleString()} XP
                          </span>
                        </div>
                        <div className="shrink-0">
                          {result.friendship_status === 'accepted' ? (
                            <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                              Friends ✓
                            </span>
                          ) : result.friendship_status === 'pending' ? (
                            <span className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/40 font-medium border border-white/10 cursor-not-allowed">
                              Pending
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addFriend(result.user_id)}
                              disabled={addingId === result.user_id}
                              className="bg-blue-600 hover:bg-blue-500 text-white border-0 text-xs px-3"
                            >
                              <UserPlus size={13} className="mr-1" />
                              {addingId === result.user_id ? '...' : 'Add Friend'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Prompt if no query yet */}
            {!query && (
              <div className="text-center py-16 space-y-3">
                <div className="text-5xl">🔎</div>
                <p className="text-white/40 text-sm">Search for classmates or friends from your college</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fade-in keyframe */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
