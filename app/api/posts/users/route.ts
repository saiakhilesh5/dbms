import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import sql from "@/db"; // make sure this points to your db connection file

export async function POST() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const clerkId = user.id;
    const email = user.emailAddresses[0]?.emailAddress || null;
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const imageUrl = user.imageUrl || "";
    const createdAt = new Date();

    const result = await sql`
      INSERT INTO users (id, email, name, profile_pic, created_at)
      VALUES (${clerkId}, ${email}, ${firstName + " " + lastName}, ${imageUrl}, ${createdAt})
      ON CONFLICT (id) DO UPDATE 
      SET email = EXCLUDED.email,
          name = EXCLUDED.name,
          profile_pic = EXCLUDED.profile_pic
      RETURNING *;
    `;

    return NextResponse.json({ user: result[0] });
  } catch (error: any) {
    console.error("❌ Error syncing user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
