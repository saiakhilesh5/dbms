import sql from './db';

async function test() {
  try {
    const result = await sql`SELECT version()`;
    console.log("Connected ✅", result);
  } catch (err) {
    console.error("Connection failed ❌", err);
  }
}

test();
