# Inertia Form Handling — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Form Handling |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Client-Only Validation
2. Direct Data Mutation Instead of setData
3. Missing preventDefault in Form Submissions
4. Missing forceFormData for File Uploads
5. No Double-Submit Prevention

---

## Repository-Wide Anti-Patterns

- **Inertia::render() from non-controllers**: Rendering Inertia pages from services, middleware, or event listeners couples presentation to business logic.
- **Hardcoded URLs in frontend components**: Route paths change; always use named routes via Inertia's route helper.
- **Ignoring shared props**: Duplicating `auth`, `flash`, `user` across every controller instead of using `Inertia::share()`.
- **Session flash instead of Inertia flash**: Using `session()->flash()` without `Inertia::share('flash')` — Inertia never sees the message.

---

## Anti-Pattern 1: Client-Only Validation

### Category

Security

### Description

Relying solely on JavaScript/client-side validation for form fields without implementing equivalent validation on the Laravel server side.

### Why It Happens

Developers add client-side validation (HTML5 `required`, JavaScript validation) for UX feedback and assume it is sufficient. The server-side validation is seen as redundant rather than mandatory.

### Warning Signs

- Form submissions succeed even when JavaScript is disabled
- Controller or FormRequest has no validation rules for fields that are validated on the client
- Validation rules exist only in Vue/React components, not in PHP

### Why Harmful

Client-side validation is trivially bypassed — anyone can open DevTools, disable JavaScript, or send a direct HTTP request (curl, Postman) with invalid or malicious data. Without server-side validation, invalid data reaches the database.

### Consequences

- Invalid or malicious data stored in database
- SQL injection if raw input is used without validation
- Data integrity corruption
- Security vulnerabilities in downstream consumers that trust the data

### Alternative

Always validate on the server using `$request->validate()` or FormRequest classes. Add client-side validation as a UX enhancement only, never as a security boundary.

### Refactoring Strategy

1. Identify all form endpoints missing server-side validation
2. Add `$request->validate([...])` or FormRequest classes with rules matching the expected input
3. Ensure validation errors return 422 with `{ errors: { field: ['message'] } }` structure
4. Keep existing client validation as UX sugar — but verify server validation exists independently

### Detection Checklist

- [ ] Every form submission endpoint has `$request->validate()` or a FormRequest
- [ ] No controller method uses `$request->all()` without prior validation
- [ ] Server validation rules cover all required fields, types, and constraints
- [ ] File uploads have server-side type, size, and content validation

### Related Rules

- Always Validate on Server (05-rules.md)

### Related Skills

- Implement a Secure Inertia Form with Validation (06-skills.md)

### Related Decision Trees

- Server-Side Validation Only vs Client + Server Validation (07-decision-trees.md)

---

## Anti-Pattern 2: Direct Data Mutation Instead of setData

### Category

Framework Usage

### Description

Mutating the `data` object returned by `useForm` directly (e.g., `data.name = 'new'`) instead of using the `setData` method.

### Why It Happens

Developers familiar with plain JavaScript objects or state management libraries that support direct mutation may treat `useForm`'s data object as a regular mutable object. The Inertia proxy that tracks changes is invisible.

### Warning Signs

- Form submissions send stale data that differs from current form input
- Changes to form fields do not appear in the submitted payload
- `data.name = value` patterns in component code

### Why Harmful

Inertia's `useForm` tracks form state through a reactive proxy. Direct mutation bypasses the proxy, so Inertia does not detect the change. The form object has stale data when submitted, causing silent data loss.

### Consequences

- Form submits old/incorrect data silently
- Users think they submitted correct data but server receives something else
- Difficult to debug — no error or warning is shown
- Lost user input without any indication

### Alternative

Always use `setData('field', value)` for single fields or `setData({ field: value })` for multiple fields. This triggers the internal reactivity and ensures submitted data matches form state.

### Refactoring Strategy

1. Search all components for `data.<field>` assignment patterns (not inside object literals)
2. Replace each with `setData('<field>', value)`
3. For checkbox/radio groups, use the appropriate setData overload
4. Add a lint rule to prevent future direct mutations

### Detection Checklist

- [ ] No direct assignments to `data.property` in component files
- [ ] All field changes use `setData('field', value)` or `setData({...})`
- [ ] onChange handlers call `setData`, not direct assignment
- [ ] Third-party form library integration extracts values on submit, not via data mutation

### Related Rules

- Use setData, Never Direct Mutation (05-rules.md)

### Related Skills

- Implement a Secure Inertia Form with Validation (06-skills.md)

### Related Decision Trees

- useForm() vs Direct axios/fetch for Form Submission (07-decision-trees.md)

---

## Anti-Pattern 3: Missing preventDefault in Form Submissions

### Category

Reliability

### Description

Omitting `e.preventDefault()` in Inertia form submit handlers, causing the browser to submit the form natively instead of through Inertia's protocol.

### Why It Happens

Inertia forms use standard `<form>` elements with `onSubmit` handlers. Developers may forget to call `preventDefault` or assume Inertia's `post()` method handles it. Inertia does not — it relies on the developer to prevent native submission.

### Warning Signs

- Form submissions cause a full page reload instead of an Inertia SPA navigation
- Validation errors do not appear — the page refreshes and shows Laravel's default error bag or nothing
- The URL changes to the form action URL with a full page load

### Why Harmful

Without `preventDefault()`, the browser submits the form natively as a standard HTTP request. This bypasses Inertia's AJAX submission, validation error mapping, progress tracking, and navigation handling. The user gets a full page reload instead of a smooth SPA experience.

### Consequences

- Full page reload on form submission — defeats SPA purpose
- Inertia validation error mapping broken — errors not displayed per-field
- Upload progress tracking unavailable
- Form state (processing, recentlySuccessful) lost on native navigation

### Alternative

Always call `e.preventDefault()` as the first line in every Inertia form submit handler, before any other code.

### Refactoring Strategy

1. Search all component files for form `onSubmit` handlers
2. Verify `e.preventDefault()` is the first statement in each
3. If missing, add it before any other logic
4. Add a lint rule or code review check for this pattern

### Detection Checklist

- [ ] Every form `onSubmit` handler calls `e.preventDefault()` as first statement
- [ ] No form submission results in a full page reload
- [ ] Validation errors appear per-field without page refresh
- [ ] URL does not change to form action on submission

### Related Rules

- Always Call preventDefault (05-rules.md)

### Related Skills

- Implement a Secure Inertia Form with Validation (06-skills.md)

### Related Decision Trees

- useForm POST vs router.visit for Form Actions (07-decision-trees.md)

---

## Anti-Pattern 4: Missing forceFormData for File Uploads

### Category

Framework Usage

### Description

Submitting forms that include file inputs without passing `forceFormData: true` in the submission options, causing files to be sent as empty/null values.

### Why It Happens

Developers may not know that Inertia defaults to JSON submission, or they may assume that file inputs are automatically handled. The `forceFormData` option is not obvious — it's not required for non-file forms, so it's easy to forget when files are added later.

### Warning Signs

- File uploads always arrive as `null` or empty on the server
- `$request->hasFile('avatar')` returns false even though a file was selected
- No error is shown — the file is silently not sent

### Why Harmful

By default, Inertia submits form data as JSON. JSON cannot represent `File` objects — the file input value is serialized as an empty object or null. Without `forceFormData: true`, file uploads silently fail. The server never receives the file, and the user sees no error because the form submission "succeeds" (just without the file).

### Consequences

- File uploads silently fail — user thinks upload succeeded
- No file data stored — avatar, document, or attachment missing
- Frustrating user experience with no error feedback
- Wasted time debugging why files don't arrive

### Alternative

Always pass `forceFormData: true` as a submission option when a form includes file inputs. This switches submission to FormData encoding, which correctly handles binary file data.

### Refactoring Strategy

1. Identify all forms that include `<input type="file">`
2. Add `forceFormData: true` to the `post()`/`put()` options
3. Verify on the server that `$request->hasFile('field')` returns true
4. Do NOT add `forceFormData: true` to non-file forms (it's slightly larger and prevents nested data)

### Detection Checklist

- [ ] All forms with file inputs use `forceFormData: true`
- [ ] No form without file inputs uses `forceFormData: true`
- [ ] Server-side file validation exists for type, size, and content
- [ ] File upload progress is shown using `progress.percentage`

### Related Rules

- Use forceFormData for File Uploads (05-rules.md)

### Related Skills

- Implement a Secure Inertia Form with Validation (06-skills.md)

### Related Decision Trees

- useForm POST vs router.visit for Form Actions (07-decision-trees.md)

---

## Anti-Pattern 5: No Double-Submit Prevention

### Category

UX / Reliability

### Description

Failing to disable the submit button during form processing, allowing users to click multiple times and submit the form concurrently.

### Why It Happens

Double-submit prevention is a UX concern that is often overlooked. Developers focus on validation and data handling but forget that users may click rapidly, press Enter repeatedly, or experience network latency that makes the first click appear to do nothing.

### Warning Signs

- Duplicate records created in the database from a single form
- Multiple identical emails sent to a user
- Submit button remains clickable after being clicked
- No visual feedback (spinner, disabled state) during submission

### Why Harmful

Each click creates a separate form submission request. The last request wins (because it updates the record), but intermediate requests may create duplicate records, send duplicate notifications, process payments multiple times, or cause race conditions in the database.

### Consequences

- Duplicate database records (orders, users, posts)
- Multiple emails, notifications, or webhooks
- Double charges for payment forms
- Race conditions from concurrent request processing
- Data inconsistency in related tables

### Alternative

Use the `processing` property from `useForm` to disable the submit button during submission. Set `disabled={processing}` on the button and optionally show a loading indicator.

### Refactoring Strategy

1. Identify all form submit buttons that lack a `disabled` binding
2. Add `disabled={processing}` using the processing state from `useForm`
3. Optionally add a loading state (e.g., "Saving..." text, spinner)
4. For forms that trigger navigation on success, double-submit prevention is still needed for the window before navigation

### Detection Checklist

- [ ] Every submit button is disabled during `processing`
- [ ] Visual feedback (text change, spinner) indicates submission in progress
- [ ] No duplicate records created on rapid form submission
- [ ] Payment forms have additional idempotency keys or lock mechanisms

### Related Rules

- Disable Submit During Processing (05-rules.md)

### Related Skills

- Implement a Secure Inertia Form with Validation (06-skills.md)

### Related Decision Trees

- useForm() vs Direct axios/fetch for Form Submission (07-decision-trees.md)
