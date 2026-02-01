'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, Smile, Image as ImageIcon, Reply, MoreVertical } from 'lucide-react';
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments
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
      // Check if user already reacted with this emoji
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
      className={`${isReply ? 'ml-12 mt-3' : 'mt-4'} bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 hover:border-zinc-700 transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
          {/* User avatar would go here */}
        </div>

        <div className="flex-grow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-bold text-white">{comment.userName}</span>
              <span className="text-xs text-zinc-500 ml-2">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-white whitespace-pre-wrap mb-3">{comment.content}</p>

          {comment.gifUrl && (
            <div className="mb-3 rounded overflow-hidden max-w-xs">
              <img src={comment.gifUrl} alt="GIF" className="w-full" />
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-2 flex-wrap">
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
                ).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(comment._id, emoji)}
                    className="bg-zinc-700 hover:bg-zinc-600 rounded-full px-2 py-1 text-sm text-white transition-colors"
                  >
                    {emoji} {count}
                  </button>
                ))}
              </div>
            )}

            {/* Reaction Picker */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(comment._id)}
                className="text-zinc-400 hover:text-white text-sm transition-colors"
              >
                <Smile size={16} />
              </button>
              {showEmojiPicker === comment._id && (
                <div className="absolute bottom-full left-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-lg p-2 flex gap-1 z-10">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleReaction(comment._id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:bg-zinc-700 rounded p-1 text-xl transition-colors"
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
                className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
              >
                <Reply size={16} />
                Reply
              </button>
            )}
          </div>

          {/* Replies */}
          {groupedComments.replies[comment._id]?.map((reply) => renderComment(reply, true))}
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="text-center text-zinc-400 py-8">Loading comments...</div>;

  return (
    <div className="mt-12 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-6 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">
        Discussion
      </h2>

      {/* Comment Input */}
      <div className="mb-8 bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
        {replyingTo && (
          <div className="mb-2 text-sm text-blue-400 flex items-center justify-between bg-blue-950/30 p-2 rounded-lg border border-blue-900">
            <span>Replying to comment...</span>
            <button onClick={() => setReplyingTo(null)} className="text-zinc-400 hover:text-white">
              Cancel
            </button>
          </div>
        )}
        <textarea
          ref={inputRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts... (use @ to mention someone)"
          className="w-full bg-zinc-950 text-white rounded-lg p-3 outline-none resize-none border border-zinc-800 focus:border-zinc-700 transition-colors placeholder:text-zinc-600"
          rows={3}
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setShowGifPicker(!showGifPicker)}
              className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
            >
              <ImageIcon size={20} />
            </button>
          </div>
          <button
            onClick={() => handlePostComment()}
            disabled={!newComment.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all duration-200 shadow-lg hover:shadow-blue-900/50"
          >
            <Send size={16} />
            Post
          </button>
        </div>

        {/* GIF Picker */}
        {showGifPicker && (
          <div className="mt-4 border border-zinc-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
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
      <div className="space-y-4">
        {groupedComments.topLevel.length === 0 ? (
          <p className="text-center text-zinc-400 py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          groupedComments.topLevel.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
