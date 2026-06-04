# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Server Props |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Server props are the data passed from Laravel controllers to Inertia page components via `Inertia::render()`. Props are serialized to JSON and sent to the client as the initial page payload or on subsequent navigations. They form the contract between the server and the client — what data the client receives to render the page. The engineering value is a typed, predictable data contract. The server controls what props are available. The client renders based on those props. This eliminates the need for separate API endpoints for page data.

---

## Core Concepts

- **Basic prop passing**: `Inertia::render('Users/Show', ['user' => $user->toArray()])` sends props to the page component
- **Prop types**: Primitives (string, number, boolean), arrays, objects, lazy (closures), deferred, merged
- **Eloquent serialization**: Models must be converted to arrays via `->toArray()`, `->toResource()`, or manual mapping
- **Resource classes**: API Resources can be passed as props — `toArray()` is called automatically during serialization
- **Serialization pipeline**: Props are collected, resolved (lazy closures invoked), JSON-encoded, and embedded in the response
- **Optional props**: Conditionally include props based on authorization or request state

---

## When To Use

- Passing page-specific data from controllers to page components
- Including paginated data, model collections, or computed values
- Combining with lazy/deferred props for expensive computations
- Typing the data contract between server and client with TypeScript

## When NOT To Use

- Global data needed on every page (use Shared Data instead)
- Real-time data that changes frequently (use partial reloads or WebSockets)
- Large datasets that would bloat the initial payload (use pagination + lazy props)

---

## Best Practices

- **Always serialize Eloquent models** — never pass models directly; use `->toArray()`, `->toResource()`, or manual mapping
- **Never pass sensitive data** — props are visible in HTML source and network tab
- **Only pass what the page renders** — avoid overloading props with unnecessary data
- **Use TypeScript interfaces** — mirror the server-side prop shape on the client for compile-time safety
- **Prefer flat props for independent data** (flash messages, page title), nested props for related data (user.profile, user.settings)
- **Use lazy prop optimization** for expensive computations (aggregations, external API calls)

---

## Architecture Guidelines

- Props are passed as the second argument to `Inertia::render()` as an associative array
- Props cross the server-client boundary via JSON serialization — all values must be JSON-serializable
- Eloquent models, Carbon dates, and non-serializable objects must be transformed before passing
- On initial load: JSON is embedded in the Blade layout's `<script>` tag
- On subsequent navigation: JSON is returned as the response body
- Resource classes are automatically resolved when used as props
- Page-specific props override shared data props with the same key during merge

---

## Performance

Props are serialized to JSON as part of the page response. Large props (1000+ records, 500KB+ JSON) significantly impact serialization and transfer time. The initial page response includes ALL props (including lazy ones as placeholders) in the embedded JSON. Use pagination, lazy evaluation, or deferred props for large datasets. Profile prop size early with Laravel Debugbar or by logging `strlen(json_encode($props))`.

---

## Security

- Props embedded in the HTML source are visible to anyone who can view the page source
- Never pass passwords, API tokens, internal IDs, or PII that shouldn't be client-visible
- Serialization is the security boundary — `$user->toArray()` or `$user->only('id', 'name')` controls exactly what is exposed
- Authorization checks must happen before passing props — don't rely on client-side hiding

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Passing untransformed models | `Inertia::render('page', ['user' => $user])` | Exposes all model attributes to client | Always use `->toArray()` or Resource classes |
| Overloading props | Passing every available field | Large initial payload, slow page load | Pass only what the UI renders |
| Mutable props on client | Modifying received props in JS | Data flow violation, sync issues | Treat props as read-only; use partial reloads |
| Non-serializable props | Passing closures or binary data | JSON encoding errors at runtime | Ensure all values are JSON-serializable |
| Hardcoded prop names | String literals for prop keys in JS | Brittle when server renames keys | Use TypeScript interfaces as single source of truth |

---

## Anti-Patterns

- **Eloquent model as prop**: Passing `$user` (Eloquent model) instead of `$user->toArray()` — exposes all model attributes and relationships
- **Prop explosion**: Passing 20+ individual props instead of grouping related data into nested structures
- **API duplication**: Building a separate API endpoint that returns the same data as the props — use props for page data, API for cross-page data
- **Prop scoping mismatch**: Passing data the component doesn't use, increasing payload size unnecessarily
- **Mutating props on client**: Assigning `props.user.name = 'New'` directly instead of using partial reload or server submission

---

## Examples

### Basic Prop Passing with Serialization

```php
class UserController extends Controller
{
    public function show(User $user): Response
    {
        return Inertia::render('Users/Show', [
            'user' => $user->only('id', 'name', 'email'),
            'stats' => [
                'posts' => $user->posts()->count(),
                'followers' => $user->followers()->count(),
            ],
        ]);
    }
}
```

### Using API Resources

```php
return Inertia::render('Users/Show', [
    'user' => new UserResource($user),
    'posts' => PostResource::collection($user->recentPosts),
]);
```

### TypeScript Interface

```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

interface PageProps {
    auth: { user: User };
    users: User[];
    flash?: { success?: string; error?: string };
}
```

---

## Related Topics

- Page Components — receiving and using props
- Shared Data — global props for all pages
- Lazy Data Evaluation — lazy and deferred props
- Partial Reloads — re-fetching specific props
- TypeScript Integration — typing server props
- API Resources — resource-based prop serialization

---

## AI Agent Notes

- Inertia v3 introduced deferred props (sent after initial response)
- Props serialized via `Response::getData()` -> `json_encode()`
- Lazy props use `Inertia::lazy(fn())` — wrapped in a `LazyValue` object internally
- Resource classes are automatically resolved when used as props
- Use `$request->inertiaPartial('key')` to conditionally compute expensive props during partial reloads

---

## Verification

- All Eloquent models are serialized via `->toArray()` or Resource before passing
- No sensitive data (passwords, tokens) exists in prop arrays
- TypeScript interfaces exist matching the server-side prop structure
- Props are kept minimal — only data the component renders
- Pagination is used for list data exceeding 100 records
