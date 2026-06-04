# Inertia Server Props — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Server Props |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Passing Raw Eloquent Models as Props
2. Sensitive Data Leakage in Props
3. Prop Explosion — Flat, Unstructured Prop Arrays
4. Passing Non-Serializable Values
5. Orphaned Props — Unused Data Passed to Pages

---

## Repository-Wide Anti-Patterns

- **No TypeScript interfaces for props**: Prop shape mismatches caught only at runtime.
- **API duplication**: Separate API endpoints returning the same data as page props.
- **Prop scoping mismatch**: Passing data the component doesn't use, bloating payload.
- **Mutating props on client**: Assigning to `props.user.name` instead of using partial reload or server submission.

---

## Anti-Pattern 1: Passing Raw Eloquent Models as Props

### Category

Security

### Description

Passing an Eloquent model instance directly to `Inertia::render()` without serializing it to an array or API Resource first.

### Why It Happens

Inertia automatically serializes values passed to `Inertia::render()`, so passing a model "works" — the page renders and data appears. Developers may not realize that ALL model attributes (including hidden ones) are serialized and sent to the client.

### Warning Signs

- `Inertia::render('page', ['user' => $user])` — no `->toArray()`, `->only()`, or Resource
- Password hashes, remember tokens, or internal IDs visible in the page source
- Model relationships unexpectedly included in the JSON payload

### Why Harmful

Passing a raw Eloquent model serializes ALL its attributes — including `password`, `remember_token`, hidden fields, and relationship data — into the JSON response visible in the page source and network tab. Even attributes marked `$hidden` may leak under certain conditions (appends, accessors, new field additions without updating `$hidden`).

### Consequences

- Password hashes exposed in HTML source — enables offline brute force attacks
- API tokens and internal IDs leaked — potential for privilege escalation
- PII exposed — compliance violations (GDPR, CCPA)
- Relationship data leaked — unintended data disclosure

### Alternative

Always serialize Eloquent models before passing them. Use `$model->only([...])` for simple whitelisting, `$model->toArray()` when all visible fields are safe, or API Resource classes for complex serialization with relationships.

### Refactoring Strategy

1. Search for `Inertia::render` calls without `->toArray()`, `->only()`, or Resource classes
2. Audit each model pass — determine which attributes the UI actually needs
3. Replace with `$model->only(['id', 'name', ...])` or `new ModelResource($model)`
4. Remove any leaked sensitive data from client-visible responses

### Detection Checklist

- [ ] No Eloquent models passed directly to `Inertia::render()`
- [ ] All model passes use `->toArray()`, `->only()`, or API Resource
- [ ] No password, token, or hidden fields in the page source
- [ ] Serialization is consistent across all controllers

### Related Rules

- Always Serialize Eloquent Models (05-rules.md)

### Related Skills

- Set Up Typed Server Props with Secure Serialization (06-skills.md)

### Related Decision Trees

- Direct Model Pass vs Explicit Serialization for Eloquent Models (07-decision-trees.md)

---

## Anti-Pattern 2: Sensitive Data Leakage in Props

### Category

Security

### Description

Passing sensitive data (API keys, tokens, PII, internal IDs) as Inertia props that are visible in the HTML source and network tab.

### Why It Happens

Developers may not audit props for sensitivity before passing them. Data that is "safe" in a Blade view (because it's not echoed) is NOT safe in Inertia — every prop is serialized to JSON and sent to the client.

### Warning Signs

- Environment variables or config values in Inertia render calls
- API tokens, secret keys, or internal IDs in props
- PII that the UI does not display (phone numbers, SSNs, full addresses)
- Internal notes or admin-only fields in user data

### Why Harmful

Inertia props are embedded in the HTML `<script>` tag on initial load and visible in network responses on subsequent navigations. Unlike Blade views where sensitive data can be present in PHP but not echoed to HTML, Inertia serializes ALL props to JSON. If a prop is passed, it is visible to anyone who can view the page source or open the network tab.

### Consequences

- API keys and secrets exposed — third-party service abuse
- Customer PII leaked — regulatory fines and reputational damage
- Internal IDs exposed — enables enumeration attacks
- Business logic leakage — internal notes or algorithms visible

### Alternative

Audit every prop before passing. Never pass secrets (keys, tokens, passwords). For PII, pass only what the UI displays. Use server-side endpoints for operations that need sensitive data.

### Refactoring Strategy

1. Audit all `Inertia::render()` calls for sensitive data
2. Remove any API keys, tokens, secrets, or non-essential PII
3. For data the UI needs but is sensitive, pass it under its own prop name (not as part of a model)
4. Verify in page source that no sensitive data is embedded

### Detection Checklist

- [ ] No API keys or secrets in props
- [ ] No passwords or password hashes in props
- [ ] No PII beyond what the UI displays
- [ ] No internal IDs that could enable enumeration
- [ ] Page source inspection shows no sensitive data

### Related Rules

- Never Pass Sensitive Data (05-rules.md)

### Related Skills

- Set Up Typed Server Props with Secure Serialization (06-skills.md)

### Related Decision Trees

- Direct Model Pass vs Explicit Serialization for Eloquent Models (07-decision-trees.md)

---

## Anti-Pattern 3: Prop Explosion — Flat, Unstructured Prop Arrays

### Category

Maintainability

### Description

Passing many individual flat props with prefix naming (`user_name`, `user_email`, `user_avatar`) instead of grouping related data into nested structures (`user: { name, email, avatar }`).

### Why It Happens

As pages grow, developers add props incrementally. Each new field is added as a flat key. Over time, the prop array grows to 15-20+ flat keys with no structure.

### Warning Signs

- 10+ top-level keys in an `Inertia::render()` call
- Prefix naming patterns (`user_name`, `user_email`, `page_title`, `page_description`)
- Repeated prefix groups across multiple controllers
- TypeScript interfaces with 20+ flat properties

### Why Harmful

Flat props with prefix naming are harder to manage, harder to type in TypeScript, and harder to pass around as a group. A change to the `user` domain requires updating multiple prop keys instead of a single nested object. TypeScript interfaces become verbose and non-reusable.

### Consequences

- Verbose, hard-to-maintain controllers
- Non-reusable TypeScript types — must redefine for every page
- Harder to refactor — changing a field name requires updating multiple controllers
- Increased cognitive load — developers must track 15+ individual keys

### Alternative

Group related props under a shared key. Use nested objects for domain-related data (`user.profile`, `user.settings`). Keep independent props (flash messages, page title) as flat top-level keys.

### Refactoring Strategy

1. Review all `Inertia::render()` calls with 8+ top-level keys
2. Identify domain groups (user data, page metadata, settings)
3. Nest each group under a shared key
4. Update TypeScript interfaces to use nested types
5. Update page components to access nested props

### Detection Checklist

- [ ] No more than 7 top-level keys per render call
- [ ] Related data is grouped under shared keys
- [ ] No prefix naming patterns for related data
- [ ] TypeScript interfaces use nested types for grouped data
- [ ] Independent data (flash, title) remains flat

### Related Rules

- Structure Props Logically (05-rules.md)

### Related Skills

- Set Up Typed Server Props with Secure Serialization (06-skills.md)

### Related Decision Trees

- Controller-Side Prop Shaping vs API Resource Classes (07-decision-trees.md)

---

## Anti-Pattern 4: Passing Non-Serializable Values

### Category

Reliability

### Description

Passing binary data, closures (without `Inertia::lazy()`), resource handles, or objects with circular references as props, causing JSON encoding errors at runtime.

### Why It Happens

PHP does not throw errors for non-serializable types at the point of passing — the error occurs later during response serialization. If the error path is not well-tested, it surfaces in production first.

### Warning Signs

- Intermittent 500 errors on specific pages
- Errors referencing `json_encode()` or "malformed UTF-8 characters"
- Binary data in props (file contents, images as strings)
- Closures passed without `Inertia::lazy()` wrapper

### Why Harmful

Inertia serializes props to JSON before sending the response. If a value is not JSON-serializable, the controller throws a runtime error at response time. This can crash a page that otherwise works correctly in testing but receives different data in production.

### Consequences

- 500 errors at response serialization time
- Errors surface in production, not development
- Crashed pages with no helpful error message
- Debugging difficulty — the error is in the response pipeline, not the controller logic

### Alternative

Test that all prop values are JSON-serializable. Avoid binary data (use URLs instead). Use `base64_encode()` for data URLs. Wrap closures with `Inertia::lazy()`. Convert non-serializable objects to arrays.

### Refactoring Strategy

1. Search for potential non-serializable values in props: binary content, closures, resource handles
2. Replace binary data with URLs or base64-encoded strings
3. Wrap closures with `Inertia::lazy()`
4. Add a `json_encode` test in your test suite that covers the prop shape
5. Use Laravel Debugbar to verify all props are serializable

### Detection Checklist

- [ ] No binary data passed as props (use URLs instead)
- [ ] No closures passed without `Inertia::lazy()`
- [ ] No objects with circular references in props
- [ ] All prop values pass `json_encode()` without error
- [ ] Test suite includes serialization verification

### Related Rules

- Ensure JSON-Serializable Values (05-rules.md)

### Related Skills

- Set Up Typed Server Props with Secure Serialization (06-skills.md)

### Related Decision Trees

- Controller-Side Prop Shaping vs API Resource Classes (07-decision-trees.md)

---

## Anti-Pattern 5: Orphaned Props — Unused Data Passed to Pages

### Category

Performance

### Description

Passing props to `Inertia::render()` that are never used by the page component or its children, increasing payload size unnecessarily.

### Why It Happens

As features are removed or refactored, the data may be removed from the UI but the controller still passes it. There is no automatic mechanism to detect unused props. Legacy fields accumulate over time.

### Warning Signs

- Props in `Inertia::render()` that have no corresponding usage in the component
- Development debug data left in production render calls
- Legacy fields that were used by old UI versions
- Payload size that is larger than expected for the page's visible content

### Why Harmful

Every unused prop is serialized, transferred, and parsed for no benefit. A single page may accumulate 5-10 unused props over time. These orphaned props increase payload size and serialization time without any user-facing value. They also confuse developers trying to understand the data contract.

### Consequences

- Unnecessary data transfer — larger payloads for no benefit
- Slower page loads from serializing and transferring unused data
- Confusion — developers unsure which props are actually used
- Maintenance burden — cleaning unused props requires manual audit

### Alternative

For each `Inertia::render()` call, verify that every prop key corresponds to a value used in the page component or its children. Remove props that are passed but never rendered.

### Refactoring Strategy

1. For each controller, list all props passed to `Inertia::render()`
2. Search the corresponding page component and all its children for usage of each prop
3. Remove any prop that is not referenced
4. Add a note during code review to remove unused props when removing UI features

### Detection Checklist

- [ ] Every prop key is consumed by the page component or its children
- [ ] No debug/legacy data remains in production render calls
- [ ] Payload size is proportional to page complexity
- [ ] Removed UI features had their corresponding props cleaned up

### Related Rules

- Pass Only What the Page Renders (05-rules.md)

### Related Skills

- Set Up Typed Server Props with Secure Serialization (06-skills.md)

### Related Decision Trees

- Eager Props vs Lazy Props for Expensive Data (07-decision-trees.md)
