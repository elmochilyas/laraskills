# Inertia Shared Data — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Shared Data |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Global Data Dump — Sharing Everything "Just in Case"
2. Direct Value Evaluation at Boot Time
3. Sharing Full Eloquent Models (Sensitive Data Leakage)
4. Expensive Operations in Shared Data Closures
5. No TypeScript Module Augmentation for Shared Data

---

## Repository-Wide Anti-Patterns

- **Shared data for feature-specific UI**: Adding sidebar data to shared data because the layout renders it — pass it per-page.
- **Mutating shared data at runtime**: Changing shared data closures mid-request — data races and unpredictability.
- **Nested closures in shared data**: Returning closures from shared data — they won't be resolved by Inertia's prop pipeline.
- **Duplicated shared data assertions**: Repeating auth/flash assertions in every page test instead of a single SharedDataTest.

---

## Anti-Pattern 1: Global Data Dump — Sharing Everything "Just in Case"

### Category

Performance

### Description

Adding 20-50+ keys to shared data because "someone might need them somewhere," bloating every page response with unnecessary data.

### Why It Happens

Shared data is easy to add — just add a line to `HandleInertiaRequests`. There is no immediate cost felt by the developer adding the data. The cost is paid by every page, every request, for the entire life of the application. Without performance monitoring, the bloat grows unnoticed.

### Warning Signs

- `HandleInertiaRequests::share()` returns 10+ top-level keys
- Shared data includes sidebar links, notification lists, recent orders, weather widgets
- Initial page payload is >100KB even for simple pages
- Props in the page source include data unrelated to the current page

### Why Harmful

Shared data is serialized and sent in EVERY Inertia response, including partial reloads. Each additional shared prop increases every page's payload by its serialized size times the number of requests. Feature-specific data that could be 2KB on one page becomes 2KB on EVERY page. Over time, this adds up to significant bandwidth and serialization cost.

### Consequences

- Increased payload on every response — slower page loads site-wide
- Serialization time grows linearly with shared props
- Shared data becomes a dumping ground for unrelated data
- Developers cannot tell which props are truly global vs accidentally shared

### Alternative

Only share data needed on EVERY page: auth user, flash messages, and app configuration. Pass page-specific data through the controller's `Inertia::render()` call.

### Refactoring Strategy

1. Audit all keys in `HandleInertiaRequests::share()`
2. For each key, ask: "Does the layout or >80% of pages use this?"
3. Move feature-specific data to individual controllers
4. Set a maximum of 5-7 shared data keys

### Detection Checklist

- [ ] Shared data limited to auth, flash, and app config (or equivalent minimal set)
- [ ] No more than 7 top-level shared data keys
- [ ] No feature-specific data in shared data (sidebar, notifications, widgets)
- [ ] All shared data keys are consumed by the layout or >80% of pages

### Related Rules

- Keep Shared Data Minimal (05-rules.md)

### Related Skills

- Configure and Type Shared Data (06-skills.md)

### Related Decision Trees

- Shared Data via HandleInertiaRequests vs Manual Passing (07-decision-trees.md)

---

## Anti-Pattern 2: Direct Value Evaluation at Boot Time

### Category

Reliability

### Description

Passing direct values (not closures) to `Inertia::share()` that are evaluated at service provider boot time, when the session and authenticated user are not yet available.

### Why It Happens

The API for `Inertia::share()` accepts both direct values and closures. Developers may not realize that direct values are evaluated immediately at call time, not lazily when the page renders. They assume values are evaluated per-request.

### Warning Signs

- `Auth::user()` always returns null in shared data
- Flash messages never appear in shared data
- `Inertia::share()` called in a service provider with dynamic data
- Shared data values that should change per request but are always the same

### Why Harmful

If a shared data value is evaluated at service provider boot time, `Auth::user()` returns `null` because the session is not yet available. The value is captured once and never re-evaluated, so every subsequent request receives the same (potentially null) value. The authenticated user is null on every page, flash messages never appear, and session-dependent data is always stale.

### Consequences

- Authenticated user is null on every page — user appears logged out
- Flash messages never appear — users miss success/error feedback
- Session-dependent data always returns the same stale value
- Hard to debug — the code looks correct but evaluates at the wrong time

### Alternative

Pass request-dependent shared data as closures. Closures are evaluated lazily on each request, giving access to the full request context. Only use direct values for truly static configuration.

### Refactoring Strategy

1. Search for `Inertia::share()` calls with direct values that depend on request state
2. Replace with closures: `'key' => fn(Request $r) => $r->user()?->only(...)`
3. Move all shared data to `HandleInertiaRequests::share()` middleware method
4. Remove any `Inertia::share()` calls from service providers for dynamic data

### Detection Checklist

- [ ] All request-dependent shared data uses closures or is in `HandleInertiaRequests`
- [ ] No direct `Auth::user()` in `Inertia::share()` calls
- [ ] No `Inertia::share()` calls in service providers with dynamic data
- [ ] Authenticated user data is correctly populated on every page
- [ ] Flash messages appear after form submissions

### Related Rules

- Use Closures for Request-Dependant Data (05-rules.md)

### Related Skills

- Configure and Type Shared Data (06-skills.md)

### Related Decision Trees

- Direct Values vs Closures for Shared Data (07-decision-trees.md)

---

## Anti-Pattern 3: Sharing Full Eloquent Models (Sensitive Data Leakage)

### Category

Security

### Description

Passing the authenticated user as a full Eloquent model through shared data without field restriction (`->only()` or `->makeHidden()`), exposing all model attributes to every page.

### Why It Happens

`Auth::user()` returns a User model, and passing it directly to shared data "works" — the UI shows the user's name and email. Developers may not realize that Inertia serializes ALL model attributes, including hidden ones.

### Warning Signs

- `'auth' => ['user' => Auth::user()]` found in shared data
- Password hash visible in page source or network tab response
- User model attributes that aren't used by the UI appear in the JSON (timestamps, `remember_token`, internal notes)

### Why Harmful

`Auth::user()` without transformation exposes ALL model attributes to the client, including `password`, `remember_token`, `two_factor_secret`, internal IDs, timestamps, and any other fields on the users table. This data is visible in the HTML source, the network tab, and the JavaScript console of every page. Even if the UI does not render these fields, they are accessible to anyone inspecting the response.

### Consequences

- Password hashes exposed in HTML source — offline brute force attacks possible
- `remember_token` leaked — session hijacking risk
- `two_factor_secret` leaked — 2FA bypass
- PII exposed — compliance violations (GDPR, CCPA)
- Internal IDs exposed — enables enumeration attacks

### Alternative

When sharing the authenticated user, explicitly select only the fields needed by the frontend using `$request->user()?->only('id', 'name', 'email', 'avatar')`.

### Refactoring Strategy

1. Find all places where `Auth::user()` is passed as a prop without field restriction
2. Replace with `$request->user()?->only('id', 'name', 'email')` or equivalent
3. For any additional fields needed, explicitly add them to the `->only()` call
4. Verify in page source that no sensitive fields leak

### Detection Checklist

- [ ] Auth user data uses `->only()` to limit exposed fields
- [ ] No password, token, or sensitive fields visible in page source
- [ ] `->only()` includes only fields the UI actually renders
- [ ] No full Eloquent model passed via `Auth::user()` directly

### Related Rules

- Never Expose Sensitive Data in Share (05-rules.md)

### Related Skills

- Configure and Type Shared Data (06-skills.md)

### Related Decision Trees

- Direct Values vs Closures for Shared Data (07-decision-trees.md)

---

## Anti-Pattern 4: Expensive Operations in Shared Data Closures

### Category

Performance

### Description

Performing expensive database queries or external API calls inside shared data closures, causing slow response times on every page.

### Why It Happens

Shared data closures run on every Inertia request. Developers may treat shared data as a convenient place to put "global" data without considering the performance impact. A slow query in shared data affects every page load for every user.

### Warning Signs

- Database query log shows the same expensive query on every page load
- Shared data closure contains `Model::all()`, external API calls, or aggregation queries
- Response time is consistently slow across all pages
- Server load correlates with active user count, not page complexity

### Why Harmful

Shared data closures are evaluated on every Inertia request — every page load, every partial reload, every form submission. An expensive database query (500ms) in shared data adds 500ms to every single page response. For 1000 users making 10 requests each, that's 5000 seconds of unnecessary database time.

### Consequences

- Every page response is slow, regardless of page complexity
- Database load is higher than necessary
- Server costs increase from unnecessary computation
- Users perceive the entire application as slow

### Alternative

Move expensive-but-global data to lazy per-page props (computed only when needed) or partial reloads (fetched on demand). Shared data should contain only cheap, fast operations.

### Refactoring Strategy

1. Profile shared data closure execution time
2. Identify any closure that performs DB queries, API calls, or heavy computation
3. Move expensive data to per-page lazy props or a dedicated endpoint
4. For data that is truly needed on every page, cache it with `Cache::remember()`

### Detection Checklist

- [ ] No database queries in shared data closures
- [ ] No external API calls in shared data closures
- [ ] No aggregation functions (count, sum, avg) on large datasets in shared data
- [ ] Shared data closures execute in <1ms each
- [ ] Page response time is proportional to page complexity, not constant overhead

### Related Rules

- Keep Shared Data Minimal (05-rules.md)

### Related Skills

- Configure and Type Shared Data (06-skills.md)

### Related Decision Trees

- Shared Data via HandleInertiaRequests vs Manual Passing (07-decision-trees.md)

---

## Anti-Pattern 5: No TypeScript Module Augmentation for Shared Data

### Category

Maintainability

### Description

Not extending Inertia's TypeScript types with shared data shapes, leaving `usePage().props.auth` typed as `any`.

### Why It Happens

TypeScript module augmentation requires knowledge of TypeScript's declaration merging feature. Developers new to Inertia or TypeScript may not know this pattern exists. The app "works" without it — but with poor type safety.

### Warning Signs

- `usePage().props.auth` is typed as `any`
- No `inertia.d.ts` file exists in `resources/js/types/`
- Components manually cast or assert types for shared data
- Shared data shape changes require updating every component that uses it

### Why Harmful

Without augmentation, `usePage().props.auth` is typed as `any` or the default Inertia type. Developers must remember the shape of shared data and manually type it in every component, leading to errors and drift. A shared data key rename or shape change requires searching the entire codebase for access points — and any missed spot becomes a runtime error.

### Consequences

- No autocompletion for shared props in IDE
- Runtime errors from misspelled or renamed shared data keys
- Type errors when accessing nested shared data properties
- Shared data shape changes require manual updates in every component

### Alternative

Create a `resources/js/types/inertia.d.ts` file that extends `@inertiajs/core`'s `PageProps` interface with interfaces matching every key returned by the `HandleInertiaRequests` `share()` method.

### Refactoring Strategy

1. Create `resources/js/types/inertia.d.ts` (or edit if it exists)
2. Add `declare module '@inertiajs/core' { interface PageProps { ... } }` with all shared data keys
3. Remove any manual type assertions or casts for shared data in components
4. Verify that `usePage().props.auth.user.name` provides autocompletion

### Detection Checklist

- [ ] `inertia.d.ts` exists with module augmentation for all shared data keys
- [ ] `usePage().props.auth` is typed (not `any`)
- [ ] No manual type assertions for shared data in components
- [ ] Shared data shape changes are caught by the TypeScript compiler
- [ ] IDE provides autocompletion for shared props

### Related Rules

- Use Module Augmentation for Shared Data Types (05-rules.md)

### Related Skills

- Configure and Type Shared Data (06-skills.md)

### Related Decision Trees

- Single share() Call vs Multiple share() Calls (07-decision-trees.md)
