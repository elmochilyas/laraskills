# Inertia Server Props

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Server Props
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Server props are the data passed from Laravel controllers to Inertia page components via `Inertia::render()`. Props are serialized to JSON and sent to the client as the initial page payload or on subsequent navigations. They form the contract between the server and the client — what data the client receives to render the page.

The engineering value is a typed, predictable data contract. The server controls what props are available. The client renders based on those props. This eliminates the need for separate API endpoints for page data — the props are the API for that page.

---

## Core Concepts

### Basic Prop Passing

```php
class UserController extends Controller
{
    public function show(User $user): Response
    {
        return Inertia::render('Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}
```

### Prop Types

Props can be:
- **Primitives**: strings, numbers, booleans
- **Arrays**: plain arrays (not Eloquent models — serialize them first)
- **Objects**: plain objects (use `->toArray()` on models)
- **Lazy**: evaluated only when requested (see Lazy Data Evaluation KU)
- **Deferred**: sent after the initial response (see Lazy Data Evaluation KU)
- **Merged**: merged with existing props on partial reload

### Receiving Props

```jsx
export default function Show({ user }) {
    return (
        <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
        </div>
    );
}
```

---

## Mental Models

### The Prop Envelope

Props are like a sealed envelope from the server. The controller puts data in the envelope. The client opens it and uses the contents. The envelope's contents are determined entirely by the server — the client does not request additional data (except via partial reloads).

### The Serialization Bridge

Props cross the server-client boundary via JSON serialization. All props must be JSON-serializable: strings, numbers, booleans, arrays, objects. Eloquent models, Carbon dates, and other non-serializable objects must be transformed before being passed.

---

## Internal Mechanics

### Serialization Pipeline

When `Inertia::render()` is called:

1. Props array is collected
2. Each prop is resolved (lazy props are wrapped in closures; deferred props are sent separately)
3. The resolved props array is JSON-encoded
4. On initial load: JSON is embedded in the Blade layout's `<script>` tag
5. On subsequent navigation: JSON is returned as the response body

### Prop Transformation

Laravel's `Resource` classes can be used as props:

```php
return Inertia::render('Users/Show', [
    'user' => new UserResource($user),
]);
```

The Resource's `toArray()` is called automatically during serialization.

### Eloquent Model Limitation

Eloquent models CANNOT be passed directly as props. They must be converted to arrays:

```php
// Bad — Eloquent model is not JSON-serializable cleanly
return Inertia::render('Users/Show', ['user' => $user]);

// Good — serialize first
return Inertia::render('Users/Show', ['user' => $user->toArray()]);

// Or use an API Resource
return Inertia::render('Users/Show', ['user' => new UserResource($user)]);
```

---

## Patterns

### Pagination Data

```php
public function index(): Response
{
    return Inertia::render('Users/Index', [
        'users' => User::paginate()->through(fn($user) => [
            'id' => $user->id,
            'name' => $user->name,
        ]),
    ]);
}
```

### Props from Services

```php
class UserController extends Controller
{
    public function __construct(
        private UserService $users,
    ) {}

    public function show(User $user): Response
    {
        return Inertia::render('Users/Show', [
            'user' => $this->users->getProfileData($user),
            'stats' => $this->users->getUserStats($user),
        ]);
    }
}
```

### Optional Props

```php
return Inertia::render('Users/Show', [
    'user' => $user->toArray(),
    'posts' => $request->user()?->isAdmin()
        ? $user->posts->toArray()
        : [], // Non-admin users see empty posts array
]);
```

### Always Prop with Flash Messages

```php
Inertia::share('flash', function () {
    return [
        'success' => session('success'),
        'error' => session('error'),
    ];
});
```

---

## Architectural Decisions

### Prop Structure: Flat vs Nested

| Concern | Flat Props | Nested Props |
|---|---|---|
| Clarity | Simple (one level) | Hierarchical (matches domain) |
| Partial reloads | Fine-grained (pick specific keys) | Coarse (must reload entire nested block) |
| TypeScript types | Simple interface | Nested interfaces |
| Serialization | Direct | Recursive |

Use nested props for related data (user.profile, user.settings). Use flat for independent data (flash messages, page title).

### Props vs API Endpoints

| Concern | Server Props | Separate API |
|---|---|---|
| Page data | Included in page response | Additional request |
| Round trips | 1 (page load) | 2+ (page + API calls) |
| Caching | Per-page | Per-endpoint |
| Reusability | Per-page only | Across pages |

Use props for page-specific data. Use API endpoints for data that is used across many pages or by external clients.

---

## Tradeoffs

| Concern | Server Props | Client Fetch | Blade View Data |
|---|---|---|---|
| Round trips | 1 (page) | 2+ (page + API) | 1 (full page) |
| Client code | Minimal (use props) | Fetch + state management | None |
| Data freshness | At page load | Always fresh | At page load |
| Complexity | Low | Medium | Low |

---

## Performance Considerations

Props are serialized to JSON as part of the page response. For large props (1000+ records, 500KB+ JSON), serialization and transfer time can be significant. Use pagination, lazy evaluation, or deferred props for large datasets.

---

## Production Considerations

### Always Serialize Eloquent Models

Never pass Eloquent models directly. Always use `->toArray()`, `->toResource()`, or manual mapping. This ensures only intended data is exposed.

### Never Pass Sensitive Data

Props are visible in the HTML source (initial load) and network tab (subsequent navigation). Never pass passwords, tokens, or internal IDs that should not be exposed.

### Use TypeScript Interfaces

```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

interface PageProps {
    auth: { user: User };
    users: User[];
}
```

---

## Common Mistakes

### Passing Untransformed Models

```php
// Bad — exposes all model attributes
return Inertia::render('Users/Show', ['user' => $user]);

// Good — controlled serialization
return Inertia::render('Users/Show', ['user' => [
    'id' => $user->id,
    'name' => $user->name,
]]);
```

### Overloading Props

Passing every possible field as a prop. The initial page response becomes large. Only pass what the page actually renders.

### Mutable Props on Client

Props should be treated as read-only on the client. If the client needs to modify data, use partial reloads to get fresh props from the server.

---

## Failure Modes

### Serialization Errors

Non-serializable data (resources, closures, binary data) in props causes JSON encoding errors. Ensure all props are serializable. Use `json_encode` in development to catch errors early.

### Props Size Limit

Very large prop payloads can hit PHP's `memory_limit` or JSON encoding limits. Paginate or defer large datasets.

---

## Ecosystem Usage

Server props are the primary data mechanism in the inertia-laravel ecosystem. They integrate with Laravel's API Resources, Eloquent serialization, and pagination. The `Inertia::share()` method enables global props across all pages. Props can leverage Laravel's caching, transformation, and authorization systems.

## Related Knowledge Units

- **Page Components** (this workspace) — receiving and using props
- **Shared Data** (this workspace) — global props
- **Lazy Data Evaluation** (this workspace) — lazy and deferred props
- **Partial Reloads** (this workspace) — re-fetching specific props

---

## Research Notes

- Inertia v3 introduced deferred props (sent after the initial response)
- Props are serialized via Laravel's `Response::getData()` → `json_encode()`
- Resource classes are automatically resolved when used as props
- The `Inertia::share()` method registers props globally for all pages
