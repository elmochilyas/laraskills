## Rule: Always Serialize Eloquent Models

Convert Eloquent models to arrays or API Resources before passing them as Inertia props.

---

## Category

Security

---

## Rule

Never pass an Eloquent model instance directly to `Inertia::render()`. Use `$model->toArray()`, `$model->only([...])`, `new ModelResource($model)`, or explicit array construction.

---

## Reason

Passing a raw Eloquent model serializes ALL its attributes — including `password`, `remember_token`, hidden fields, and relationship data — into the JSON response visible in the page source and network tab. Even attributes marked `$hidden` may leak under certain conditions (appends, accessors). Explicit serialization ensures only intended data reaches the client.

---

## Bad Example

```php
return Inertia::render('Users/Show', [
    'user' => $user, // Full model — exposes all attributes
]);
```

---

## Good Example

```php
return Inertia::render('Users/Show', [
    'user' => $user->only('id', 'name', 'email'),
]);
```

---

## Exceptions

When using API Resource classes (`new UserResource($user)`), the resource's `toArray()` method provides controlled serialization. Resources are the preferred approach for complex serialization logic.

---

## Consequences Of Violation

Security risks: password hashes, tokens, and PII exposed to the client. Compliance risks: data protection violations.

---

## Rule: Never Pass Sensitive Data

Audit every prop passed to `Inertia::render()` for sensitive information. Remove or restrict anything the UI does not need.

---

## Category

Security

---

## Rule

Before passing props, review each key for sensitivity. Remove passwords, API tokens, internal IDs (if they are not needed client-side), PII that the UI does not display, and any data that should not appear in the HTML source.

---

## Reason

Inertia props are embedded in the HTML `<script>` tag on initial load and visible in network responses on subsequent navigations. Unlike Blade views where sensitive data can be present in PHP but not echoed to HTML, Inertia serializes ALL props to JSON. If a prop is passed, it is visible.

---

## Bad Example

```php
return Inertia::render('Users/Edit', [
    'user' => $user->toArray(), // Exposes all fields including internal notes
    'stripe_secret' => config('services.stripe.secret'), // API key in HTML
]);
```

---

## Good Example

```php
return Inertia::render('Users/Edit', [
    'user' => $user->only('id', 'name', 'email', 'avatar'),
]);
```

---

## Exceptions

If the UI legitimately needs a sensitive value (e.g., a Stripe publishable key for client-side tokenization), pass it explicitly with a named prop rather than including it as part of a larger serialized model.

---

## Consequences Of Violation

Security risks: sensitive data visible to anyone who inspects the page source or network tab.

---

## Rule: Pass Only What the Page Renders

Limit props to the data the page component actually renders. Remove unused props.

---

## Category

Performance

---

## Rule

For each `Inertia::render()` call, verify that every prop key corresponds to a value used in the page component or its children. Remove props that are passed but never rendered.

---

## Reason

Every unused prop is serialized, transferred, and parsed for no benefit. A single page may accumulate 5-10 unused props over time as features are removed or refactored. These orphaned props increase payload size and serialization time without any user-facing value.

---

## Bad Example

```php
return Inertia::render('Users/Index', [
    'users' => $users,
    'legacyField' => 'unused', // Never rendered
    'debugData' => $this->debug(), // Leftover from development
]);
```

---

## Good Example

```php
return Inertia::render('Users/Index', [
    'users' => $users, // Every prop is rendered in the component
]);
```

---

## Exceptions

Props passed for future feature work behind a feature flag are acceptable if the flag is actively being developed. Remove them when the feature ships or is abandoned.

---

## Consequences Of Violation

Performance risks: unnecessary data transfer, larger payloads. Maintenance risks: developers unsure which props are actually used.

---

## Rule: Ensure JSON-Serializable Values

Verify every prop value is JSON-serializable before passing to `Inertia::render()`.

---

## Category

Reliability

---

## Rule

Test that all prop values can be successfully encoded by `json_encode()`. Avoid passing binary data, resource handles, closures (without `Inertia::lazy()`), objects with circular references, or non-serializable objects directly.

---

## Reason

Inertia serializes props to JSON before sending the response. If a value is not JSON-serializable, the controller throws a runtime error at response time instead of during development. This can crash a page that otherwise works correctly in testing but receives different data in production.

---

## Bad Example

```php
return Inertia::render('Reports/Show', [
    'binaryData' => $fileContent, // Binary string — may not be valid UTF-8
    'model' => $model, // Eloquent model with circular relations
]);
```

---

## Good Example

```php
return Inertia::render('Reports/Show', [
    'dataUrl' => $fileContent ? base64_encode($fileContent) : null,
    'model' => $model->toArray(),
]);
```

---

## Exceptions

Closures explicitly wrapped with `Inertia::lazy()` are handled by Inertia's prop resolver and are acceptable. Other non-serializable types must be transformed.

---

## Consequences Of Violation

Reliability risks: 500 errors at response serialization time. Debugging difficulty: errors surface in production, not development.

---

## Rule: Use TypeScript Interfaces Mirroring Props

For every controller that renders an Inertia page, maintain a TypeScript interface that matches the server-side prop structure.

---

## Category

Code Organization

---

## Rule

Create a TypeScript interface for each page component that exactly mirrors the keys and types returned by its controller. Store it in a `types/` directory or alongside the page component. Keep it in sync with the server-side prop shape.

---

## Reason

Without a matching TypeScript interface, prop shape mismatches between the server and client are only caught at runtime (or in tests). A compiler-checked interface catches missing required props, renamed keys, and type changes before the code is deployed.

---

## Bad Example

```php
// Server sends 'fullName', client expects 'name'
// No compile-time error — bug in production
```

---

## Good Example

```php
// Server
return Inertia::render('Users/Show', [
    'user' => $user->only('id', 'name', 'email'),
]);
```

```typescript
// Client — compile error if server changes shape
interface UserShowProps {
    user: { id: number; name: string; email: string };
}
```

---

## Exceptions

For rapidly iterated prototypes or MVPs, TypeScript interfaces may be added after the prop shape stabilizes. Production code must have matching interfaces.

---

## Consequences Of Violation

Reliability risks: prop type mismatches detected only at runtime. Maintenance risks: server-side refactoring silently breaks client code.

---

## Rule: Structure Props Logically

Use flat structure for independent props and nested structure for related data.

---

## Category

Code Organization

---

## Rule

Group related props under a shared key (`user.profile`, `user.settings`) rather than flat keys (`user_name`, `user_email`, `user_avatar`). Keep independent props (flash messages, page title) as flat top-level keys.

---

## Reason

Flat props with prefix naming (`user_name`, `user_email`) are harder to manage, harder to type in TypeScript, and harder to pass around as a group. Nested props allow passing a whole group to a child component with a single prop spread, and TypeScript interfaces for nested objects are reusable across components.

---

## Bad Example

```php
return Inertia::render('Dashboard', [
    'user_id' => $user->id,
    'user_name' => $user->name,
    'user_email' => $user->email,
    'page_title' => 'Dashboard',
    'page_flash' => 'Created',
]);
```

---

## Good Example

```php
return Inertia::render('Dashboard', [
    'user' => $user->only('id', 'name', 'email'),
    'page' => ['title' => 'Dashboard', 'flash' => 'Created'],
]);
```

---

## Exceptions

Very simple pages with 2-3 unrelated props may keep them flat. When props grow beyond 5 top-level keys, start grouping by domain.

---

## Consequences Of Violation

Maintenance risks: prop naming becomes inconsistent, TypeScript interfaces are verbose and non-reusable.
