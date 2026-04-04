import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FOTWComment from '@/models/FOTWComment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Fetch all comments for a film
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const filmId = searchParams.get('filmId');

    if (!filmId) {
      return NextResponse.json({ error: 'Film ID required' }, { status: 400 });
    }

    const comments = await FOTWComment.find({ filmId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { filmId, content, gifUrl, parentId, mentions } = body;

    if (!filmId || !content) {
      return NextResponse.json({ error: 'Film ID and content required' }, { status: 400 });
    }

    const comment = await FOTWComment.create({
      filmId,
      userId: session.user.email || '',
      userName: session.user.name || 'Anonymous',
      userEmail: session.user.email || '',
      content,
      gifUrl,
      parentId: parentId || null,
      mentions: mentions || [],
      reactions: [],
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// PATCH - Add/remove reaction to comment
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { commentId, emoji, action } = body; // action: 'add' or 'remove'

    if (!commentId || !emoji || !action) {
      return NextResponse.json(
        { error: 'Comment ID, emoji, and action required' },
        { status: 400 }
      );
    }

    const comment = await FOTWComment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (action === 'add') {
      // Remove existing reaction from this user for this emoji if any
      comment.reactions = comment.reactions.filter(
        (r: { userId: string; emoji: string; userName: string }) => !(r.userId === session.user.email && r.emoji === emoji)
      );
      // Add new reaction
      comment.reactions.push({
        emoji,
        userId: session.user.email || '',
        userName: session.user.name || 'Anonymous',
      });
    } else if (action === 'remove') {
      comment.reactions = comment.reactions.filter(
        (r: { userId: string; emoji: string; userName: string }) => !(r.userId === session.user.email && r.emoji === emoji)
      );
    }

    await comment.save();
    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error updating reaction:', error);
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
  }
}
