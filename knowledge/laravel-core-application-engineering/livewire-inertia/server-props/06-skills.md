# Skill: Set Up Typed Server Props with Secure Serialization

## Purpose

Pass data from Laravel controllers to Inertia page components with secure serialization, proper typing, and minimal payload size.

## When To Use

Every time you pass data from a controller to an Inertia page component, and when auditing existing routes for prop safety and performance.

## When NOT To Use

- Global data needed on every page (use Shared Data instead)
- Real-time data (use partial reloads or WebSockets)

## Prerequisites

- Inertia installed in the Laravel backend
- TypeScript configured in the frontend
- Understanding of JSON serialization

## Inputs

- Controller method returning `Inertia::render()`
- Data to be passed as props
- TypeScript types for the frontend

## Workflow

1. **Serialize Eloquent models**: Convert models to arrays before passing:
   ```php
   'user' => $user->only('id', 'name', 'email'),
   // or
   'user' => new UserResource($user),
   ```
2. **Verify JSON-serializability**: Ensure all values pass `json_encode()` — no binary data, closures (without `Inertia::lazy()`), or circular references
3. **Audit for sensitive data**: Check every prop key for passwords, tokens, PII, or internal IDs that the UI doesn't need
4. **Remove unused props**: Verify each prop key is actually consumed by the page component or its children
5. **Structure props logically**: Group related data under shared keys (`user.profile`), keep independent props flat (`flash`, `title`)
6. **Create matching TypeScript interface**: Mirror the server-side prop shape on the client
7. **Page-specific props override shared data**: Same key name in `Inertia::render()` overrides `Inertia::share()` value

## Validation Checklist

- [ ] All Eloquent models serialized via `->toArray()`, `->only()`, or Resource before passing
- [ ] No sensitive data (passwords, tokens, hidden model attributes) in prop arrays
- [ ] TypeScript interfaces match the server-side prop shape for every page
- [ ] Props are minimal — only data the component renders
- [ ] Pagination or lazy props used for datasets exceeding 100 records
- [ ] Props are logically structured (nested for related data, flat for independent)
- [ ] Binary data is base64-encoded or referenced by URL instead of passed inline

## Common Failures

- Passing raw Eloquent model — exposes all attributes including `password`, `remember_token`
- Overloading props with unnecessary data — bloats initial payload
- Non-serializable props (binary, closures) — runtime JSON encoding errors
- Flat props with prefix naming (`user_name`, `user_email`) — harder to manage than nested (`user.name`)
- No TypeScript interface — prop shape mismatches caught only at runtime

## Decision Points

- Use `->only()` for simple field whitelisting, API Resources for complex serialization with relationships
- Prefer flat props for truly independent data (flash messages), nested for domain-related data (user.profile)

## Performance Considerations

Props are serialized to JSON on every response. Large props (1000+ records, 500KB+ JSON) significantly impact serialization and transfer time. Use pagination, lazy evaluation, or deferred props for large datasets. Profile prop size with Laravel Debugbar.

## Security Considerations

Props are visible in HTML source and network tab. Serialization is the security boundary — `->only()` or Resource classes control exactly what is exposed. Authorization checks must happen server-side before passing props.

## Related Rules

- Always Serialize Eloquent Models (05-rules.md)
- Never Pass Sensitive Data (05-rules.md)
- Pass Only What the Page Renders (05-rules.md)
- Ensure JSON-Serializable Values (05-rules.md)
- Use TypeScript Interfaces Mirroring Props (05-rules.md)
- Structure Props Logically (05-rules.md)

## Related Skills

- Create an Inertia Page Component with Typed Props (inertia/page-components)
- Configure and Type Shared Data (inertia/shared-data)
- Defer Expensive Data with Lazy Props (inertia/lazy-data-evaluation)
- Set Up TypeScript Integration for Inertia (inertia/typescript-integration)

## Success Criteria

- No Eloquent models passed directly to `Inertia::render()` without serialization
- No sensitive data visible in the HTML source or network tab
- Every prop is consumed by the UI — no unused data in payloads
- TypeScript catches server-to-client prop mismatches at compile time
- Prop payload size is proportional to page complexity
