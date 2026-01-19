import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET comments for a media item
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("mediaId");

    if (!mediaId) {
      return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
    }

    // Get top-level comments (no parentId)
    const topLevelComments = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.mediaId, mediaId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt));

    // Get all replies
    const allReplies = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.mediaId, mediaId))
      .orderBy(comments.createdAt);

    // Build reply map
    const replyMap = new Map<string, typeof allReplies>();
    for (const reply of allReplies) {
      if (reply.comment.parentId) {
        const existing = replyMap.get(reply.comment.parentId) || [];
        existing.push(reply);
        replyMap.set(reply.comment.parentId, existing);
      }
    }

    // Transform to response format
    const transformedComments = topLevelComments.map((item) => ({
      id: item.comment.id,
      mediaId: item.comment.mediaId,
      userId: item.comment.userId,
      userName: item.user?.name || "Unknown",
      userImage: item.user?.image || undefined,
      content: item.comment.content,
      parentId: item.comment.parentId || undefined,
      createdAt: item.comment.createdAt.toISOString(),
      updatedAt: item.comment.updatedAt.toISOString(),
      replies: (replyMap.get(item.comment.id) || []).map((reply) => ({
        id: reply.comment.id,
        mediaId: reply.comment.mediaId,
        userId: reply.comment.userId,
        userName: reply.user?.name || "Unknown",
        userImage: reply.user?.image || undefined,
        content: reply.comment.content,
        parentId: reply.comment.parentId || undefined,
        createdAt: reply.comment.createdAt.toISOString(),
        updatedAt: reply.comment.updatedAt.toISOString(),
      })),
    }));

    return NextResponse.json(transformedComments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST create a new comment
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mediaId, content, parentId } = body;

    if (!mediaId || !content?.trim()) {
      return NextResponse.json(
        { error: "mediaId and content are required" },
        { status: 400 }
      );
    }

    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await db.insert(comments).values({
      id: commentId,
      mediaId,
      userId: session.user.id,
      content: content.trim(),
      parentId: parentId || null,
    });

    // Return the created comment with user info
    const newComment = {
      id: commentId,
      mediaId,
      userId: session.user.id,
      userName: session.user.name,
      userImage: session.user.image || undefined,
      content: content.trim(),
      parentId: parentId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
