# Skill: Implement a Secure Inertia Form with Validation

## Purpose

Build an Inertia form using `useForm` with server-side validation, proper error handling, file upload support, and TypeScript typing.

## When To Use

Any form submission in an Inertia application — create, update, delete, or file upload.

## When NOT To Use

- Simple search forms (use query parameters with `router.get`)
- Purely client-side forms that don't interact with the server
- Livewire forms where real-time validation is preferred

## Prerequisites

- Inertia JS adapter installed (`@inertiajs/react`, `@inertiajs/vue3`, or `@inertiajs/svelte`)
- Server-side validation rules defined in the controller or FormRequest

## Inputs

- Form fields and their types
- Server endpoint URL
- Validation rules
- Success/error handling requirements

## Workflow

1. Define a TypeScript interface for the form data shape
2. Initialize `useForm<FormInterface>()` with default values
3. In the submit handler, call `e.preventDefault()` as the first statement
4. Call the appropriate form method (`post`, `put`, `patch`, `delete`) with options:
   - `onSuccess: () => reset()` for create forms
   - `preserveScroll: true` if needed
   - `forceFormData: true` if the form includes file inputs
5. Bind each input using `setData('field', value)` — never mutate `data` directly
6. Display per-field errors from `errors` object
7. Disable the submit button during `processing` to prevent double-submit
8. On the server, validate with `$request->validate()` or FormRequest before any business logic
9. Return a redirect on success (201/302) — Inertia navigates to the redirect URL
10. Return 422 with `{ errors: { field: ['message'] } }` on validation failure — Inertia auto-maps errors

## Validation Checklist

- [ ] `e.preventDefault()` called in every submit handler
- [ ] `reset()` called in `onSuccess` for create forms (not for edit forms)
- [ ] `forceFormData: true` used for forms with file inputs
- [ ] Server-side validation rules exist for all form fields
- [ ] Submit button disabled during `processing`
- [ ] Error messages displayed per-field via `errors` object
- [ ] Form data typed with `useForm<T>()` generic
- [ ] No direct mutation of `data` object (always uses `setData`)

## Common Failures

- Forgetting `preventDefault()` — browser submits natively, bypassing Inertia
- Not resetting after success — stale data persists in form fields
- Mutating `data` directly instead of using `setData` — reactivity broken, stale values submitted
- Missing `forceFormData` for file uploads — files sent as null
- No `processing` check on submit button — double-submit creates duplicate records

## Decision Points

- Create forms (POST): always reset on success. Edit forms (PUT/PATCH): keep values so user sees saved data
- Single-field forms (search): use `router.get` with query params instead of `useForm`
- Third-party form libraries (React Hook Form): use them for field management, extract values on submit

## Performance Considerations

Each form submission triggers a full Inertia request. Validation errors return smaller 422 responses. Success responses trigger a redirect with full page navigation. File uploads with `forceFormData: true` bypass JSON serialization.

## Security Considerations

Server-side validation is mandatory — client validation is bypassable. CSRF protection applies automatically. File uploads must have server-side validation for type, size, and content. Always validate authorization in the server-side handler.

## Related Rules

- Always Validate on Server (05-rules.md)
- Always Call preventDefault (05-rules.md)
- Reset Forms on Successful Submission (05-rules.md)
- Use forceFormData for File Uploads (05-rules.md)
- Disable Submit During Processing (05-rules.md)
- Use setData, Never Direct Mutation (05-rules.md)
- Type Form Data with TypeScript (05-rules.md)

## Related Skills

- Create an Inertia Page Component with Typed Props (inertia/page-components)
- Configure and Type Shared Data (inertia/shared-data)
- Write Server-Side Tests for Inertia Pages (inertia/testing)

## Success Criteria

- Form submits via Inertia (no full page reload on validation errors)
- Server-side validation errors displayed per-field automatically
- File uploads show progress and complete successfully
- Submit button disabled during processing prevents double-submit
- Form data is typed in TypeScript
- Create forms reset on success; edit forms preserve values
