"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import sql from "@/db/index";

export default async function deletePostAction(postId: string) {
  const user = await currentUser();
  if (!user?.id) throw new Error("User not authenticated");

  try {
    // Check if the post exists and belongs to the user
    const checkQuery = `SELECT * FROM posts WHERE id = $1`;
    const result = await sql.query(checkQuery, [postId]);
    const post = result[0];

    if (!post) throw new Error("Post not found");
    if (post.user_id !== user.id) throw new Error("Post does not belong to the user");

    // Delete post
    const deleteQuery = `DELETE FROM posts WHERE id = $1`;
    await sql.query(deleteQuery, [postId]);

    // Optionally, delete related comments, likes, dislikes
    await sql.query(`DELETE FROM comments WHERE post_id = $1`, [postId]);
    await sql.query(`DELETE FROM post_likes WHERE post_id = $1`, [postId]);
    await sql.query(`DELETE FROM post_dislikes WHERE post_id = $1`, [postId]);

    revalidatePath("/");
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while deleting the post");
  }
}
