import sql from "./index";

async function init() {
  // Drop old tables if they exist (to avoid mismatched types)
  await sql`DROP TABLE IF EXISTS messages CASCADE`;
  await sql`DROP TABLE IF EXISTS connections CASCADE`;
  await sql`DROP TABLE IF EXISTS likes CASCADE`;
  await sql`DROP TABLE IF EXISTS comments CASCADE`;
  await sql`DROP TABLE IF EXISTS posts CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  // Users (Clerk IDs are strings, so TEXT)
  await sql`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,            -- Clerk user ID
      first_name TEXT,
      last_name TEXT,
      email TEXT UNIQUE,
      profile_pic TEXT,
      headline TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE posts (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE comments (
      id SERIAL PRIMARY KEY,
      post_id INT REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE likes (
      id SERIAL PRIMARY KEY,
      post_id INT REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(post_id, user_id)
    )
  `;

  await sql`
    CREATE TABLE connections (
      id SERIAL PRIMARY KEY,
      requester_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(requester_id, receiver_id)
    )
  `;

  await sql`
    CREATE TABLE messages (
      id SERIAL PRIMARY KEY,
      sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log("✅ All tables created successfully with Clerk IDs as TEXT!");
}

init().catch(err => console.error("❌ Error creating tables:", err));
