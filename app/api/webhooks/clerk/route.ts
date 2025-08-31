// app/api/webhooks/clerk/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook, type WebhookRequiredHeaders } from "svix";
import sql from "@/db"; // Neon client export (index.ts)

export const runtime = "nodejs"; // svix needs Node crypto APIs

// Helper: insert or update a user in the DB
async function upsertUser(data: any) {
  const id = data.id as string;
  const first_name = (data.first_name ?? "") as string;
  const last_name = (data.last_name ?? "") as string;
  const image_url = (data.image_url ?? "") as string;
  const email =
    (data.email_addresses?.[0]?.email_address ?? null) as string | null;

  console.log("➡️ Upserting user into DB:", {
    id,
    first_name,
    last_name,
    email,
    image_url,
  });

  try {
    await sql`
      INSERT INTO users (id, first_name, last_name, email, profile_pic)
      VALUES (${id}, ${first_name}, ${last_name}, ${email}, ${image_url})
      ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name  = EXCLUDED.last_name,
        email      = EXCLUDED.email,
        profile_pic= EXCLUDED.profile_pic;
    `;
    console.log("✅ User upserted successfully");
  } catch (dbErr) {
    console.error("❌ DB insert/update failed:", dbErr);
    throw dbErr;
  }
}

export async function POST(req: Request) {
  console.log("🔔 Incoming Clerk webhook");

  const body = await req.text();
  const hdrs = await headers();

  const svix_id = hdrs.get("svix-id");
  const svix_timestamp = hdrs.get("svix-timestamp");
  const svix_signature = hdrs.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("❌ Missing Svix headers", { svix_id, svix_timestamp, svix_signature });
    return new NextResponse("Missing Svix headers", { status: 400 });
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("❌ Missing CLERK_WEBHOOK_SECRET in env");
    return new NextResponse("Misconfigured webhook secret", { status: 500 });
  }

  // Verify Clerk webhook signature
  let evt: { type: string; data: any };
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    } as WebhookRequiredHeaders) as any;
    console.log("✅ Webhook verified:", evt.type);
  } catch (err) {
    console.error("❌ Webhook verification failed", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;
  console.log("📦 Event received:", type);

  try {
    // Handle user lifecycle events
    if (type === "user.created" || type === "user.updated") {
      console.log(`👤 Handling ${type}`);
      await upsertUser(data);
    }

    if (type === "user.deleted") {
      const id = data.id as string;
      console.log(`🗑️ Deleting user: ${id}`);
      await sql`DELETE FROM users WHERE id = ${id};`;
      console.log("✅ User deleted from DB");
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.error("❌ DB error in webhook:", e);
    return new NextResponse("DB error", { status: 500 });
  }
}
