import { NextResponse } from "next/server";
import sql from "@/db/index"; // PostgreSQL connection
import { IUser } from "@/types/user";

export interface AddPostRequestBody {
  user: IUser;
  text: string;
  imageUrl?: string | null;
}

export async function POST(request: Request) {
  const { user, text, imageUrl }: AddPostRequestBody = await request.json();

  try {
    const query = `
      INSERT INTO posts (user_id, first_name, last_name, user_image, text, image_url)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const values = [user.userId, user.firstName, user.lastName, user.userImage, text, imageUrl || null];

    const rows = await sql.query(query, values);

    return NextResponse.json({ message: "Post created successfully", post: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: `Error creating post: ${error}` }, { status: 500 });
  }
}

export async function GET() {
  try {
    const posts = await sql.query(`SELECT * FROM posts ORDER BY created_at DESC`);
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching posts" }, { status: 500 });
  }
}
