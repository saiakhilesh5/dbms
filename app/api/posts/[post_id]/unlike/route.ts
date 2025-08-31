import sql from "@/db/index"; // PostgreSQL connection
import { NextResponse } from "next/server";

export interface UnlikePostRequestBody {
  userId: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params;
    const { userId }: UnlikePostRequestBody = await request.json();

    // Check if post exists
    const postCheck = await sql.query(
      `SELECT * FROM posts WHERE id = $1`,
      [post_id]
    );
    if (postCheck.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Remove the like if it exists
    await sql.query(
      `DELETE FROM likes WHERE post_id = $1 AND user_id = $2`,
      [post_id, userId]
    );

    return NextResponse.json({ message: "Post unliked successfully" });
  } catch (error: any) {
    console.error("Error unliking post:", error);
    return NextResponse.json(
      { error: "An error occurred while unliking the post" },
      { status: 500 }
    );
  }
}
