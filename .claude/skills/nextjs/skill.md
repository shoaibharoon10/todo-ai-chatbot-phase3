# Next.js Development Skill

You are an expert Next.js developer. Follow these guidelines when working on Next.js projects.

## Core Principles

- Use the **App Router** (app directory) by default unless the project explicitly uses Pages Router.
- Prefer **Server Components** by default. Only add `"use client"` when the component needs interactivity, browser APIs, or React hooks like `useState`, `useEffect`, `useReducer`, or `useContext`.
- Use **TypeScript** for all new files.

## Routing & Layouts

- Define routes using the file-system convention: `app/<route>/page.tsx`.
- Use `layout.tsx` for shared UI that persists across navigations.
- Use `loading.tsx` for Suspense-based loading states.
- Use `error.tsx` for error boundaries.
- Use `not-found.tsx` for 404 handling.
- Use Route Groups `(groupName)` to organize routes without affecting the URL.

## Data Fetching

- Fetch data in **Server Components** using `async/await` directly in the component body.
- Use `fetch()` with Next.js caching options (`cache`, `next.revalidate`) for HTTP data sources.
- For mutations, use **Server Actions** defined with `"use server"` in a separate file or inline.
- Avoid client-side `useEffect` for initial data loading; prefer server-side fetching.

## Rendering Strategies

- **Static Rendering** (default): pages are rendered at build time.
- **Dynamic Rendering**: triggered automatically by dynamic functions (`cookies()`, `headers()`, `searchParams`).
- **ISR (Incremental Static Regeneration)**: use `revalidate` option in fetch or `export const revalidate = <seconds>` in the route segment.
- Use `generateStaticParams()` for dynamic routes that should be statically generated.

## API Routes

- Define API endpoints in `app/api/<route>/route.ts`.
- Export named functions matching HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Return `NextResponse.json()` for JSON responses.
- Use `NextRequest` for typed request handling.

## Styling

- Prefer **Tailwind CSS** for utility-first styling when available in the project.
- Use **CSS Modules** (`*.module.css`) for component-scoped styles when Tailwind is not used.
- Avoid inline style objects unless dynamically computed.

## Performance

- Use `next/image` for all images (automatic optimization, lazy loading, responsive sizing).
- Use `next/font` for font loading (automatic self-hosting, zero layout shift).
- Use `next/link` for client-side navigation between routes.
- Use dynamic imports via `next/dynamic` for code-splitting heavy components.
- Add `loading="lazy"` or use Suspense boundaries for below-the-fold content.

## Metadata & SEO

- Export `metadata` or `generateMetadata()` from `page.tsx` and `layout.tsx` for SEO.
- Use the Metadata API for title, description, Open Graph, Twitter cards, and icons.
- Add `sitemap.ts` and `robots.ts` in the app root for search engine configuration.

## Middleware

- Define middleware in `middleware.ts` at the project root.
- Use `NextResponse.redirect()`, `NextResponse.rewrite()`, or `NextResponse.next()`.
- Apply middleware selectively using the `matcher` config.

## Environment Variables

- Use `NEXT_PUBLIC_` prefix only for variables that must be exposed to the browser.
- Access server-side env vars directly with `process.env.VAR_NAME`.
- Never commit `.env.local` files; use `.env.example` as a template.

## Error Handling

- Use `error.tsx` boundaries at appropriate route segments.
- Server Actions should return structured error objects, not throw errors to the client.
- Use `notFound()` from `next/navigation` to trigger 404 pages.
- Use `redirect()` from `next/navigation` for server-side redirects.

## Project Structure Convention

```
app/
  layout.tsx          # Root layout
  page.tsx            # Home page
  globals.css         # Global styles
  (auth)/
    login/page.tsx
    register/page.tsx
  dashboard/
    layout.tsx
    page.tsx
  api/
    route.ts
components/
  ui/                 # Reusable UI primitives
  features/           # Feature-specific components
lib/
  utils.ts            # Utility functions
  actions.ts          # Server Actions
  db.ts               # Database client
types/
  index.ts            # Shared TypeScript types
public/               # Static assets
```

## Common Patterns

- **Authentication**: Use `middleware.ts` to protect routes; check session in Server Components.
- **Forms**: Use Server Actions with `useFormState` and `useFormStatus` for progressive enhancement.
- **Modals/Intercepting Routes**: Use parallel routes (`@modal`) and intercepting routes (`(.)photo`).
- **Internationalization**: Use `[locale]` dynamic segment with middleware for locale detection.

## What to Avoid

- Do not use `getServerSideProps`, `getStaticProps`, or `getInitialProps` (Pages Router patterns).
- Do not wrap entire pages in `"use client"` unnecessarily.
- Do not use `<img>` tags; use `next/image` instead.
- Do not use `<a>` tags for internal links; use `next/link` instead.
- Do not store sensitive data in `NEXT_PUBLIC_` environment variables.
- Do not disable TypeScript strict mode.
