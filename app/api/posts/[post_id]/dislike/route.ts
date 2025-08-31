import { NextResponse } from "next/server";
import db from "@/lib/db";

export interface DislikePostRequestBody {
  userId: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;

  try {
    const { rows } = await db.query(
      `SELECT user_id FROM post_dislikes WHERE post_id = $1`,
      [post_id]
    );

    const dislikes = rows.map(r => r.user_id);
    return NextResponse.json(dislikes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while fetching dislikes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  const { userId }: DislikePostRequestBody = await request.json();

  try {
    // Check if user already disliked
    const { rows } = await db.query(
      `SELECT * FROM post_dislikes WHERE post_id = $1 AND user_id = $2`,
      [post_id, userId]
    );

    if (rows.length > 0) {
      // User already disliked → remove dislike
      await db.query(
        `DELETE FROM post_dislikes WHERE post_id = $1 AND user_id = $2`,
        [post_id, userId]
      );
      return NextResponse.json({ message: "Post undisliked successfully" });
    } else {
      // Add dislike
      await db.query(
        `INSERT INTO post_dislikes (post_id, user_id) VALUES ($1, $2)`,
        [post_id, userId]
      );
      return NextResponse.json({ message: "Post disliked successfully" });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while disliking the post" },
      { status: 500 }
    );
  }
}
