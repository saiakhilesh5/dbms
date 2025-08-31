import { NextResponse } from "next/server";
import sql from "@/db/index"; // PostgreSQL connection

export interface LikePostRequestBody {
  userId: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;

  try {
    const rows = await sql.query(
      `SELECT user_id FROM post_likes WHERE post_id = $1`,
      [post_id]
    );

    const likes = rows.map(r => r.user_id);
    return NextResponse.json(likes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while fetching likes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  const { userId }: LikePostRequestBody = await request.json();

  try {
    // Check if user already liked
    const rows = await sql.query(
      `SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2`,
      [post_id, userId]
    );

    if (rows.length > 0) {
      // User already liked → remove like
      await sql.query(
        `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`,
        [post_id, userId]
      );
      return NextResponse.json({ message: "Post unliked successfully" });
    } else {
      // Add like
      await sql.query(
        `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)`,
        [post_id, userId]
      );
      return NextResponse.json({ message: "Post liked successfully" });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while liking the post" },
      { status: 500 }
    );
  }
}
