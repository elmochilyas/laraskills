# Skill: Configure and Type Shared Data

## Purpose

Set up global Inertia props (auth user, flash messages, app config) using `HandleInertiaRequests` middleware, typed with TypeScript module augmentation and tested independently.

## When To Use

When setting up a new Inertia project, adding a new shared data key, or auditing existing shared data for security and performance.

## When NOT To Use

- Page-specific data that only one or a few pages need (pass via controller props instead)
- Expensive computations that shouldn't run on every request
- Sensitive data that shouldn't appear on every page response

## Prerequisites

- Inertia installed with `HandleInertiaRequests` middleware
- TypeScript configured for the frontend
- Testing framework (PHPUnit/Pest) available

## Inputs

- List of data needed on every page (typically: auth user, flash messages, app config)
- TypeScript types for each shared data key

## Workflow

1. Open `app/Http/Middleware/HandleInertiaRequests.php` and edit the `share()` method
2. Add shared data keys using closures (not direct values) for request-dependent data:
   ```php
   'auth' => ['user' => $request->user()?->only('id', 'name', 'email', 'avatar')],
   'flash' => [
       'success' => $request->session()->get('success'),
       'error' => $request->session()->get('error'),
   ],
   'app' => ['name' => config('app.name'), 'locale' => app()->getLocale()],
   ```
3. Limit shared data to auth, flash, and app config — remove anything not consumed by the layout or majority of pages
4. Never expose full Eloquent models; use `->only()` to select specific fields
5. Create `resources/js/types/inertia.d.ts` with module augmentation for typed access:
   ```typescript
   declare module '@inertiajs/core' {
       interface PageProps {
           auth: { user: User | null };
           flash?: { success?: string; error?: string };
           app: { name: string; locale: string };
       }
   }
   ```
6. Create a dedicated `SharedDataTest` that validates all shared data keys exist and have correct shapes
7. Remove shared data assertions from individual page tests — they are tested once in the shared test

## Validation Checklist

- [ ] Shared data limited to auth, flash, and app config (or equivalent minimal set)
- [ ] All request-dependent shared data uses closures (not direct values)
- [ ] Auth user data uses `->only()` or `->makeHidden()` to limit exposed fields
- [ ] Dedicated `SharedDataTest` exists and passes
- [ ] TypeScript module augmentation exists for all shared data keys
- [ ] No expensive operations (DB queries, API calls) in shared data closures
- [ ] Page-specific props override shared props with the same key where intended

## Common Failures

- Direct value at boot time (`Auth::user()` in service provider) — always null because session isn't available yet
- Sharing full user model — exposes password hash, remember_token, all attributes
- Over-sharing — 50+ keys because "someone might need it somewhere"
- Expensive operations in shared closures — DB queries or API calls on every page request
- No TypeScript types for shared data — `props.auth.user` is `any`

## Decision Points

- If a prop is needed on the layout but only on a subset of pages, pass it via the controller instead of shared data
- If a prop is cheap to compute and needed on every page, it belongs in shared data

## Performance Considerations

Shared data closures are evaluated on every Inertia request. Each additional shared prop adds JSON serialization and transfer time. Typical minimal set (auth + flash + config) ~1KB. Avoid expensive DB queries or API calls in shared data closures.

## Security Considerations

Shared data is visible in EVERY page response. Never include sensitive data. `Auth::user()` without transformation exposes ALL model attributes. Always use `->only()` or `->makeHidden()` when sharing user data.

## Related Rules

- Keep Shared Data Minimal (05-rules.md)
- Use Closures for Request-Dependant Data (05-rules.md)
- Never Expose Sensitive Data in Share (05-rules.md)
- Use Module Augmentation for Shared Data Types (05-rules.md)
- Test Shared Data Independently (05-rules.md)

## Related Skills

- Set Up Typed Server Props with Secure Serialization (inertia/server-props)
- Set Up TypeScript Integration for Inertia (inertia/typescript-integration)
- Write Server-Side Tests for Inertia Pages (inertia/testing)

## Success Criteria

- Auth user, flash messages, and app config are available on every page without per-controller duplication
- Shared data is fully typed in TypeScript via module augmentation
- A single `SharedDataTest` validates all shared keys
- No sensitive data leaks through shared data
- Removing or adding shared data updates only one test instead of dozens
