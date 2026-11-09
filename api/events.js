const crypto = require("crypto");
const { redis } = require("./_db");

const KEY = "shared-calendar:events";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function clean(body) {
  let b = body;
  if (typeof b === "string") {
    try { b = JSON.parse(b); } catch { return "Invalid JSON"; }
  }
  if (!b || typeof b !== "object") return "Missing event data";

  const who = String(b.who || "").trim().slice(0, 40);
  const title = String(b.title || "").trim().slice(0, 80);
  const note = String(b.note || "").trim().slice(0, 300);
  const date = String(b.date || "");
  const allDay = !!b.allDay;
  const repeat = b.repeat === "weekly" ? "weekly" : "none";
  const until = repeat === "weekly" && b.until ? String(b.until) : "";

  if (!who) return "Pick a name";
  if (!title) return "Add a title";
  if (!DATE.test(date)) return "Invalid date";
  if (until && !DATE.test(until)) return "Invalid 'repeat until' date";
  if (until && until < date) return "'Repeat until' must be after the start date";

  let start = "", end = "";
  if (!allDay) {
    start = String(b.start || "");
    end = String(b.end || "");
    if (!TIME.test(start) || !TIME.test(end)) return "Invalid time";
    if (end <= start) return "End time must be after start time";
  }

  const id = typeof b.id === "string" && /^[\w-]{8,64}$/.test(b.id) ? b.id : crypto.randomUUID();
  return { id, who, title, note, date, allDay, start, end, repeat, until };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    // Optional shared passcode: set ACCESS_CODE in Vercel env vars to turn it on.
    const code = process.env.ACCESS_CODE;
    if (code && req.headers["x-access-code"] !== code) {
      return res.status(401).json({ error: "Wrong or missing access code" });
    }

    if (req.method === "GET") {
      const flat = await redis(["HGETALL", KEY]);
      const values = Array.isArray(flat)
        ? flat.filter((_, i) => i % 2 === 1)
        : Object.values(flat || {});
      const events = [];
      for (const v of values) {
        try { events.push(typeof v === "string" ? JSON.parse(v) : v); } catch { /* skip bad row */ }
      }
      return res.status(200).json({ events });
    }

    if (req.method === "POST") {
      const e = clean(req.body);
      if (typeof e === "string") return res.status(400).json({ error: e });
      await redis(["HSET", KEY, e.id, JSON.stringify(e)]);
      return res.status(200).json({ event: e });
    }

    if (req.method === "DELETE") {
      const id = String((req.query && req.query.id) || "");
      if (!id) return res.status(400).json({ error: "Missing id" });
      await redis(["HDEL", KEY, id]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
};
