import pool from "@/lib/db";
import { NextResponse } from "next/server";

export interface DeletePostRequestBody {
  userId: string;
}

// Get a single post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params;

    const { rows } = await pool.query(
      `SELECT * FROM posts WHERE id = $1`,
      [post_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the post" },
      { status: 500 }
    );
  }
}

// Delete a post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const { post_id } = await params;
    const { userId }: DeletePostRequestBody = await request.json();

    // Fetch post
    const { rows } = await pool.query(
      `SELECT * FROM posts WHERE id = $1`,
      [post_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = rows[0];

    if (post.user_id !== userId) {
      return NextResponse.json({ error: "Post does not belong to the user" }, { status: 403 });
    }

    // Delete the post
    await pool.query(`DELETE FROM posts WHERE id = $1`, [post_id]);

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the post" },
      { status: 500 }
    );
  }
}
