# Our Shared Calendar

Static page (`index.html`) + one serverless API (`api/events.js`) that stores events in Upstash Redis.

## Deploy on Vercel

1. Put this folder in a GitHub repo (or run `npx vercel` inside the folder).
2. On vercel.com: **Add New → Project → import the repo → Deploy** (no build settings needed).
3. In the project: **Storage → Create/Connect → Upstash Redis** (free plan is fine). Connect it to the project so the env vars are added automatically.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the app picks up the database variables.
5. Optional: Settings → Environment Variables → add `ACCESS_CODE` (any passcode). Redeploy. Then people must enter the code once on their device.

## Customize

- People and colors: edit the `MEMBERS` list near the top of the `<script>` in `index.html`.
