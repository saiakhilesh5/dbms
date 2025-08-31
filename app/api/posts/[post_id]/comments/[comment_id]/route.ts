import { NextResponse } from "next/server";
import db from "@/lib/db";

export interface DeleteCommentRequestBody {
  userId: string;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ post_id: string; comment_id: string }> }
) {
  const { post_id, comment_id } = await params;
  const { userId }: DeleteCommentRequestBody = await request.json();

  try {
    // Check if comment exists and belongs to the user
    const { rows } = await db.query(
      `SELECT * FROM comments WHERE id = $1 AND post_id = $2`,
      [comment_id, post_id]
    );
    const comment = rows[0];

    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    if (comment.user_id !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Delete the comment
    await db.query(`DELETE FROM comments WHERE id = $1`, [comment_id]);

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error deleting comment" }, { status: 500 });
  }
}
