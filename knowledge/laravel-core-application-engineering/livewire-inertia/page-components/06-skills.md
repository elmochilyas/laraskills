# Skill: Create an Inertia Page Component with Typed Props and Layout

## Purpose

Create a server-routed Inertia page component with TypeScript interfaces, a persistent layout, proper metadata, and error page handling.

## When To Use

When adding a new page to an Inertia application, replacing a Blade view with an Inertia-rendered component.

## When NOT To Use

- Content-focused pages where Blade is simpler (blogs, documentation)
- Routes that should redirect or return non-HTML responses (API endpoints, file downloads)

## Prerequisites

- Inertia installed (Laravel backend + JS adapter)
- TypeScript configured for the frontend
- `createInertiaApp` set up with `resolve` callback using `import.meta.glob`

## Inputs

- Route URL and HTTP method
- Page component name (e.g., `Users/Index`)
- Data props from the controller
- Layout component choice

## Workflow

1. Create the controller method returning `Inertia::render()`:
   ```php
   return Inertia::render('Users/Index', [
       'users' => User::all()->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email]),
   ]);
   ```
2. Create the page component file at `resources/js/Pages/Users/Index.tsx`
3. Define a TypeScript interface for the props matching the server-side shape
4. Implement the component receiving typed props:
   ```tsx
   interface Props { users: { id: number; name: string; email: string }[]; }
   export default function Index({ users }: Props) { ... }
   ```
5. Add persistent layout assignment via `Index.layout = page => <AuthenticatedLayout children={page} />`
6. Import and use the `Head` component to set page title and meta tags
7. Register the route in `routes/web.php` pointing to the controller
8. Add Inertia error pages in the exception handler for 403, 404, 500
9. Add a loading indicator in the layout using `usePage().processing`

## Validation Checklist

- [ ] Every `Inertia::render()` call has a corresponding page component file
- [ ] TypeScript interface exists for all page props
- [ ] Layout uses the `.layout` property pattern (not wrapped inside the component)
- [ ] `Head` component sets unique title for each page
- [ ] Error pages exist for 403, 404, 500 status codes
- [ ] Loading indicator shown during page transitions
- [ ] No sensitive data is passed as props (passwords, tokens, internal IDs)

## Common Failures

- Missing page component file — runtime error when navigating to the route
- Props copied into `useState` — state drifts from server data on partial reloads
- Layout created inside the component — layout state lost on every navigation
- No `Head` component — all tabs show the same title, SEO suffers
- Mutating props directly — breaks Inertia's immutable data flow

## Decision Points

- Use persistent layout (`.layout` property) for pages that share navigation state. Use separate layouts for significantly different page types (e.g., full-screen landing vs authenticated dashboard)
- If a prop is needed on every page, add it to shared data via `HandleInertiaRequests` middleware instead of passing it in every controller

## Performance Considerations

Initial page load is slower (JS framework bundle + render) — subsequent navigations are faster (JSON only). Use `import.meta.glob` for code-splitting. Bundle size: React ~120KB, Vue ~80KB, Svelte ~30KB gzipped.

## Security Considerations

Props are embedded in HTML source on initial load — never pass sensitive data. Server-side validation and authorization remain the security boundary. The `X-Inertia` header-based protocol is not a security boundary.

## Related Rules

- TypeScript Interface for Every Page (05-rules.md)
- Use Persistent Layouts (05-rules.md)
- Treat Props as Read-Only (05-rules.md)
- One Component File Per Inertia Render (05-rules.md)
- Use Head Component for Meta (05-rules.md)
- Show Navigation Loading Indication (05-rules.md)
- Create Inertia Error Pages (05-rules.md)

## Related Skills

- Set Up Typed Server Props with Secure Serialization (inertia/server-props)
- Configure and Type Shared Data (inertia/shared-data)
- Implement a Secure Inertia Form with Validation (inertia/form-handling)
- Write Server-Side Tests for Inertia Pages (inertia/testing)

## Success Criteria

- Page renders correctly with server-provided props
- TypeScript catches prop shape mismatches at compile time
- Layout persists state across navigations (sidebar, scroll position)
- Page title updates on every navigation
- Transitions show a loading indicator between pages
- Error states maintain the SPA design language
