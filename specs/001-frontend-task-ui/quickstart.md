# Quickstart: Professional Frontend Task UI

**Branch**: `001-frontend-task-ui` | **Date**: 2026-02-12

## Prerequisites

- Node.js 20+ installed
- Backend API running at `http://localhost:8000` (see backend setup)
- Neon PostgreSQL database provisioned

## Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Edit .env.local with your values
#    NEXT_PUBLIC_API_URL=http://localhost:8000
#    NEXT_PUBLIC_APP_URL=http://localhost:3000
#    BETTER_AUTH_SECRET=<your-256-bit-secret>
#    BETTER_AUTH_URL=http://localhost:3000
#    JWT_SECRET_KEY=<same-as-backend>
#    DATABASE_URL=<neon-connection-string>

# 5. Start development server
npm run dev
```

## Verify

1. Open `http://localhost:3000` — should redirect to `/login`
2. Click "Create account" — fill signup form
3. After signup, should redirect to `/tasks` dashboard
4. Create a task — card should appear immediately
5. Toggle completion — badge should change color
6. Toggle dark mode — theme should switch smoothly
7. Refresh page — dark mode preference should persist

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_APP_URL` | Yes | Frontend app URL |
| `BETTER_AUTH_SECRET` | Yes | Better Auth internal secret |
| `BETTER_AUTH_URL` | Yes | Better Auth base URL |
| `JWT_SECRET_KEY` | Yes | Shared JWT signing secret (must match backend) |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |

## Common Issues

| Issue | Solution |
|-------|----------|
| "401 Unauthorized" on all API calls | Verify `JWT_SECRET_KEY` matches backend |
| Login page not rendering | Check `BETTER_AUTH_URL` matches `NEXT_PUBLIC_APP_URL` |
| Dark mode flickers on load | Ensure `suppressHydrationWarning` on `<html>` tag |
| shadcn components not styled | Run `npx shadcn@latest init` and verify `components.json` |
