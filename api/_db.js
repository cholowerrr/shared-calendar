// Tiny Upstash Redis REST client (no npm packages needed).
// Vercel's Upstash/Redis integration sets these env vars automatically.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  if (!URL_ || !TOKEN) {
    throw new Error("Database not connected yet (missing Redis env vars)");
  }
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `Database error (${r.status})`);
  return j.result;
}

module.exports = { redis };
