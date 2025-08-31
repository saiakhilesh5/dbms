import { NextResponse } from "next/server";
import sql from "@/db/index"; // PostgreSQL connection
import { IUser } from "@/types/user";

export interface AddCommentRequestBody {
  user: IUser;
  text: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;

  try {
    // Fetch all comments for the given post
    const comments = await sql.query(
      `SELECT c.id, c.text, c.created_at, u.id AS user_id, u.first_name, u.last_name, u.image_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [post_id]
    );

    // Transform the results to match your frontend shape
    const formattedComments = comments.map(c => ({
      _id: c.id,
      text: c.text,
      createdAt: c.created_at,
      user: {
        userId: c.user_id,
        firstName: c.first_name,
        lastName: c.last_name,
        userImage: c.image_url,
      },
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while fetching comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  const { user, text }: AddCommentRequestBody = await request.json();

  try {
    // Insert new comment into PostgreSQL
    const result = await sql.query(
      `INSERT INTO comments (post_id, user_id, text, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, text, created_at`,
      [post_id, user.userId, text]
    );

    const comment = result[0];

    const formattedComment = {
      _id: comment.id,
      text: comment.text,
      createdAt: comment.created_at,
      user,
    };

    return NextResponse.json({ message: "Comment added successfully", comment: formattedComment });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while adding comment" },
      { status: 500 }
    );
  }
}
