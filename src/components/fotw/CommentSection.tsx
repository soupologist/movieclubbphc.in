'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, Smile, Image as ImageIcon, Reply, MessageCircle } from 'lucide-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'demo');

interface Comment {
  _id: string;
  filmId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  gifUrl?: string;
  parentId?: string;
  reactions: {
    emoji: string;
    userId: string;
    userName: string;
  }[];
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

interface CommentSectionProps {
  filmId: string;
  currentUserEmail: string;
  currentUserName: string;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CommentSection({
  filmId,
  currentUserEmail,
  currentUserName,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<string | false>(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [filmId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/fotw/comments?filmId=${filmId}`);
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (gifUrl?: string) => {
    if (!newComment.trim() && !gifUrl) return;

    try {
      const res = await fetch('/api/fotw/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filmId,
          content: newComment,
          gifUrl,
          parentId: replyingTo,
          mentions: extractMentions(newComment),
        }),
      });

      if (res.ok) {
        const newCommentData = await res.json();
        setComments([newCommentData, ...comments]);
        setNewComment('');
        setReplyingTo(null);
        setShowGifPicker(false);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      const comment = comments.find((c) => c._id === commentId);
      const userReaction = comment?.reactions.find(
        (r) => r.userId === currentUserEmail && r.emoji === emoji
      );

      const action = userReaction ? 'remove' : 'add';

      const res = await fetch('/api/fotw/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, emoji, action }),
      });

      if (res.ok) {
        const updatedComment = await res.json();
        setComments(comments.map((c) => (c._id === commentId ? updatedComment : c)));
      }
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const extractMentions = (text: string): string[] => {
    const regex = /@(\S+)/g;
    const mentions = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const groupedComments = comments.reduce(
    (acc, comment) => {
      if (!comment.parentId) {
        acc.topLevel.push(comment);
      } else {
        if (!acc.replies[comment.parentId]) {
          acc.replies[comment.parentId] = [];
        }
        acc.replies[comment.parentId].push(comment);
      }
      return acc;
    },
    { topLevel: [] as Comment[], replies: {} as Record<string, Comment[]> }
  );

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment._id}
      className={`${isReply ? 'ml-10 mt-2' : ''} group`}
    >
      <div className="flex items-start gap-3 py-3">
        {/* Avatar */}
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ring-1 ring-white/5">
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">
            {comment.userName.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-white text-sm">{comment.userName}</span>
            <span className="text-xs text-zinc-600">{timeAgo(comment.createdAt)}</span>
          </div>

          <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>

          {comment.gifUrl && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-[240px] ring-1 ring-white/5">
              <img src={comment.gifUrl} alt="GIF" className="w-full" />
            </div>
          )}

          {/* Reactions + Actions */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {comment.reactions.length > 0 && (
              <div className="flex gap-1">
                {Object.entries(
                  comment.reactions.reduce(
                    (acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                ).map(([emoji, count]) => {
                  const userReacted = comment.reactions.some(
                    (r) => r.userId === currentUserEmail && r.emoji === emoji
                  );
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(comment._id, emoji)}
                      className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                        userReacted
                          ? 'bg-blue-950/60 border border-blue-800/40 text-blue-300'
                          : 'bg-zinc-800/60 border border-zinc-700/30 text-zinc-400 hover:bg-zinc-700/60'
                      }`}
                    >
                      {emoji} {count}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Actions (visible on hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveEmojiPicker(activeEmojiPicker === comment._id ? false : comment._id)
                  }
                  className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 rounded hover:bg-zinc-800/60"
                >
                  <Smile size={14} />
                </button>
                {activeEmojiPicker === comment._id && (
                  <div className="absolute bottom-full left-0 mb-1 bg-zinc-900 border border-zinc-700/50 rounded-xl p-1.5 flex gap-0.5 z-10 shadow-xl">
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleReaction(comment._id, emoji);
                          setActiveEmojiPicker(false);
                        }}
                        className="hover:bg-zinc-800 rounded-lg p-1.5 text-base transition-colors hover:scale-110"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isReply && (
                <button
                  onClick={() => {
                    setReplyingTo(comment._id);
                    inputRef.current?.focus();
                  }}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 rounded hover:bg-zinc-800/60 flex items-center gap-1 text-xs"
                >
                  <Reply size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Replies */}
          {groupedComments.replies[comment._id]?.map((reply) => renderComment(reply, true))}
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="text-center text-zinc-600 py-8 text-sm">Loading...</div>;

  return (
    <div className="mt-8 bg-zinc-900/30 border border-zinc-800/40 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800/40 flex items-center gap-2">
        <MessageCircle size={18} className="text-zinc-500" />
        <h2 className="text-lg font-semibold text-white">Discussion</h2>
        <span className="text-zinc-600 text-sm">{groupedComments.topLevel.length}</span>
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-b border-zinc-800/30">
        {replyingTo && (
          <div className="mb-3 text-xs text-blue-400 flex items-center justify-between bg-blue-950/20 p-2.5 rounded-lg border border-blue-900/30">
            <span className="flex items-center gap-1.5">
              <Reply size={12} />
              Replying to comment
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        <textarea
          ref={inputRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="w-full bg-zinc-950/50 text-white rounded-xl p-3 outline-none resize-none border border-zinc-800/50 focus:border-zinc-600/50 transition-colors placeholder:text-zinc-700 text-sm"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handlePostComment();
            }
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1">
            <button
              onClick={() => setShowGifPicker(!showGifPicker)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors p-2 hover:bg-zinc-800/40 rounded-lg"
            >
              <ImageIcon size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-700 text-xs hidden sm:block">⌘ + Enter</span>
            <button
              onClick={() => handlePostComment()}
              disabled={!newComment.trim()}
              className="bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black px-4 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all duration-200 text-sm disabled:cursor-not-allowed"
            >
              <Send size={14} />
              Post
            </button>
          </div>
        </div>

        {/* GIF Picker */}
        {showGifPicker && (
          <div className="mt-3 border border-zinc-800/50 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
            <Grid
              key="fotw-gifs"
              width={500}
              columns={3}
              fetchGifs={(offset: number) => gf.trending({ offset, limit: 10 })}
              onGifClick={(gif, e) => {
                e.preventDefault();
                handlePostComment(gif.images.fixed_height.url);
              }}
            />
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="px-6 py-2 divide-y divide-zinc-800/20">
        {groupedComments.topLevel.length === 0 ? (
          <p className="text-center text-zinc-600 py-10 text-sm">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          groupedComments.topLevel.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
