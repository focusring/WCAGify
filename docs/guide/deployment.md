# Deployment

WCAGify stores share links in a SQLite database. By default, this is a local file on disk (`.data/shares.sqlite`). For serverless platforms without persistent storage, you can connect a remote database instead.

## Storage Options

### Local SQLite (default)

Works out of the box on any platform with persistent disk storage. No configuration needed — the database is created automatically at `.data/shares.sqlite`.

**Recommended for:** Docker, Railway, Fly.io, Render, VPS, self-hosted

### Remote database (LibSQL)

For serverless platforms like Vercel and Netlify, set `DATABASE_URL` to connect to a remote [LibSQL](https://github.com/tursodatabase/libsql)-compatible database. This includes [Turso](https://turso.tech) (managed) or a self-hosted [libsql-server](https://github.com/tursodatabase/libsql/tree/main/libsql-server).

Set the environment variables for your LibSQL database:

```bash
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

WCAGify includes `@libsql/client` out of the box and automatically detects `DATABASE_URL` to switch to the remote database. No code changes needed.

## Recommended Platforms

| Platform                       | Type        | Persistent Disk              | Free Tier           |
| ------------------------------ | ----------- | ---------------------------- | ------------------- |
| [Railway](https://railway.app) | Container   | Yes (volumes)                | $5/month credit     |
| [Fly.io](https://fly.io)       | Container   | Yes (volumes)                | Limited free tier   |
| [Render](https://render.com)   | Container   | Yes (disks)                  | Free tier available |
| [Coolify](https://coolify.io)  | Self-hosted | Yes                          | Free                |
| VPS (Hetzner, DigitalOcean)    | Server      | Yes                          | From ~$4/month      |
| [Vercel](https://vercel.com)   | Serverless  | No — requires `DATABASE_URL` | Free tier available |
| [Netlify](https://netlify.com) | Serverless  | No — requires `DATABASE_URL` | Free tier available |

## Environment Variables

| Variable               | Required         | Description                                  |
| ---------------------- | ---------------- | -------------------------------------------- |
| `WCAGIFY_ADMIN_SECRET` | Yes (production) | Password to access reports                   |
| `DATABASE_URL`         | No               | LibSQL database URL for serverless platforms |
| `DATABASE_AUTH_TOKEN`  | No               | Auth token for the remote database           |
| `PORT`                 | No               | Server port (defaults to `3000`)             |

Create a `.env` file from the included example:

```bash
cp .env.example .env
```

## Build

```bash
pnpm build
```

This generates a `.output/` directory with a standalone Node.js server.

## Docker

The scaffolded project includes a `Dockerfile`. Build and run:

```bash
docker build -t my-audit .
docker run -p 3000:3000 -e WCAGIFY_ADMIN_SECRET=your-secret -v audit-data:/app/.data my-audit
```

The `-v` flag mounts a volume at `/app/.data` so share link data persists across container restarts.

## Railway

[Railway](https://railway.app) is the easiest option — it auto-detects the `Dockerfile` and supports persistent volumes.

1. Create a new project from your GitHub repo
2. Railway auto-detects the `Dockerfile`
3. Add the `WCAGIFY_ADMIN_SECRET` environment variable
4. Add a **volume** mounted at `/app/.data` (Settings > Volumes)
5. Generate a domain (Settings > Networking)

## Vercel / Netlify

Serverless platforms work when connected to a remote database:

1. Create a LibSQL database (e.g. on [Turso](https://turso.tech))
2. Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in your environment variables
3. Set `WCAGIFY_ADMIN_SECRET`
4. Deploy as usual

## VPS / Bare Metal

Run the built server directly with Node.js:

```bash
pnpm build
WCAGIFY_ADMIN_SECRET=your-secret node .output/server/index.mjs
```

Use a process manager like [PM2](https://pm2.keymetrics.io/) to keep it running:

```bash
pm2 start .output/server/index.mjs --name my-audit
```

## Data Storage

| Deployment method | Data location                                               |
| ----------------- | ----------------------------------------------------------- |
| Docker / Railway  | `/app/.data/shares.sqlite` — mount a volume at `/app/.data` |
| VPS / Bare Metal  | `.data/shares.sqlite` — in the working directory            |
| Vercel / Netlify  | Remote database via `DATABASE_URL`                          |
