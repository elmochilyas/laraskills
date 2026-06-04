# Inertia Form Handling — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Inertia
- **Knowledge Unit:** Inertia Form Handling
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] `@inertiajs/react` or `@inertiajs/vue3` adapter installed
- [ ] Laravel Inertia middleware (`HandleInertiaRequests`) registered
- [ ] Server-side validation rules are defined for all form fields
- [ ] Component has access to `useForm` hook from Inertia adapter

## Implementation Checklist
- [ ] `useForm(initialValues)` is called with typed form data interface
- [ ] `e.preventDefault()` is called as the first line in submit handler
- [ ] Correct HTTP method used: `post()` for create, `put()`/`patch()` for update, `delete()` for destroy
- [ ] `reset()` is called in `onSuccess` callback for create forms
- [ ] Submit button is disabled during `processing` state
- [ ] `transform` callback is used for data normalization (trim, lowercase, etc.)
- [ ] `forceFormData: true` is set for forms with file inputs
- [ ] Validation errors are displayed per-field from `errors` object
- [ ] `onError` callback handles server validation failures
- [ ] `onFinish` callback provides user feedback after completion

## Verification Checklist
- [ ] Form submission triggers Inertia navigation (not native browser submit)
- [ ] Server returns 422 with `{ errors: { field: ['message'] } }` on validation failure
- [ ] Server returns 201/302 redirect on success
- [ ] Form data is preserved on validation failure (no input loss)
- [ ] `recentlySuccessful` state is used for success indicators
- [ ] Errors are scoped to component lifecycle (cleared on unmount)
- [ ] TypeScript interfaces exist for form data shape
- [ ] File upload progress indicator works (`progress.percentage`)

## Security Checklist
- [ ] Server-side validation is the source of truth (not client-side)
- [ ] CSRF protection is active (Laravel includes token automatically)
- [ ] File uploads have server-side type, size, and content validation
- [ ] Authorization checks exist in the server-side handler
- [ ] Sensitive data is never included in form data sent to client
- [ ] Method spoofing uses Inertia protocol headers, not `_method` field

## Performance Checklist
- [ ] Form submissions use `forceFormData: true` for file uploads (bypasses JSON)
- [ ] Large forms don't cause excessive serialization time
- [ ] No concurrent form submissions (submit button disabled during processing)
- [ ] Form data structure is flat (avoid deeply nested objects)

## Production Readiness Checklist
- [ ] Loading/submitting state is visually indicated
- [ ] Success message is displayed after form completion
- [ ] Error messages are user-friendly, not technical
- [ ] Network error handling is implemented (`onError`)
- [ ] Form reset on success is configured
- [ ] Unsaved changes warning is implemented for dirty forms

## Common Mistakes to Avoid
- [ ] Forgetting `e.preventDefault()` — browser submits natively, bypassing Inertia
- [ ] Not resetting after success — stale data persists on re-visit
- [ ] Mutating form data directly (`data.name = 'x'`) instead of `setData`
- [ ] Missing `forceFormData: true` for file uploads
- [ ] No processing indicator — users can double-submit
- [ ] Client-only validation without server rules
- [ ] Manual error state duplicating Inertia's built-in error handling
