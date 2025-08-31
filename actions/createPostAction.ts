"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import generateSASToken, { containerName } from "@/lib/generateSASToken";
import sql from "@/db/index"; // PostgreSQL connection // PostgreSQL connection
import { AddPostRequestBody } from "@/app/api/posts/route";
import { BlobServiceClient } from "@azure/storage-blob";

export default async function createPostAction(formData: FormData) {
  const user = await currentUser();
  const postInput = formData.get("postInput") as string;
  const image = formData.get("image") as File;
  let image_url: string | null = null;

  if (!postInput) throw new Error("Post input is required");
  if (!user?.id) throw new Error("User not authenticated");

  const userId = user.id;
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const userImage = user.imageUrl;

  try {
    if (image && image.size > 0) {
      const accountName = process.env.AZURE_STORAGE_NAME;
      const sasToken = await generateSASToken();
      const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${randomUUID()}_${Date.now()}.png?${sasToken}`;

      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net?${sasToken}`
      );
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobUrl.split("/").pop()!);

      const imageBuffer = await image.arrayBuffer();
      await blockBlobClient.uploadData(imageBuffer);

      image_url = blobUrl;
    }

    const query = `
      INSERT INTO posts (user_id, first_name, last_name, user_image, text, image_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const values = [userId, firstName, lastName, userImage, postInput, image_url];

    await sql.query(query, values);

    revalidatePath("/");
  } catch (error: any) {
    console.error(error);
    throw new Error("Failed to create post");
  }
}
