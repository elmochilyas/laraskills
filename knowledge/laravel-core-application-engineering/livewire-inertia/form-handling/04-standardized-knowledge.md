# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Form Handling |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Inertia provides form handling through the `useForm` hook (React) or `useForm` composable (Vue). A form object manages client-side state (values, errors, processing state) and submits data to the server via Inertia's POST/PUT/PATCH/DELETE requests. The server responds with a redirect (success) or validation errors (failure), which Inertia automatically maps back to the form. The engineering value is server-driven form validation without client-side validation duplication — the server defines rules, and errors are auto-populated in the form object.

---

## Core Concepts

- **`useForm(initialValues)`**: Creates a form object with `data`, `setData`, `post/put/patch/delete`, `processing`, `errors`, `hasErrors`, `recentlySuccessful`, `reset`, `clearErrors`
- **Form methods**: `post()` (create), `put()` (full update), `patch()` (partial update), `delete()` (destroy), `get()` (navigation with query params)
- **Auto error mapping**: When server returns 422 with `{ errors: { field: ['message'] } }`, Inertia maps errors to form fields automatically
- **Success handling**: Server redirect triggers `onSuccess` callback; form errors are cleared, form can optionally reset
- **File uploads**: Use `forceFormData: true` to send as FormData; supports progress tracking via `progress.percentage`
- **Transform option**: Transform data before submission with the `transform` callback (e.g., lowercase email, trim whitespace)

---

## When To Use

- Any form submission in an Inertia application (create, update, delete)
- Forms that need server-side validation with automatic client-side error display
- File uploads with progress indication
- Forms requiring dirty state tracking or unsaved changes warnings
- Replacements for standard HTML forms that need better UX (no page reload on validation errors)

## When NOT To Use

- Simple search forms (use query parameters with `router.get` or `Inertia.visit`)
- Livewire forms where real-time validation is required (Inertia is submit-based, not real-time)
- Forms that don't interact with the server (purely client-side state)

---

## Best Practices

- **Always validate on server** — Inertia forms rely on server-side validation; client-side validation is UX only
- **Call `e.preventDefault()`** — prevents the browser's default form submission behavior
- **Reset forms on success** — call `reset()` in `onSuccess` to clear form data after successful submission
- **Use `transform` for data normalization** — trim whitespace, lowercase emails, format dates before submission
- **Handle network errors gracefully** — use `onError` and `onFinish` callbacks for user feedback
- **Use `forceFormData: true` for file uploads** — ensures FormData is used instead of JSON
- **Type form data with TypeScript** — use `useForm<FormDataInterface>()` for type-safe form handling

---

## Architecture Guidelines

- Form submissions are standard HTTP requests, not AJAX — they trigger full Inertia navigations
- Server validation errors return 422 with `{ errors: { field: ['message'] } }` structure — Inertia automatically parses this
- Success responses should redirect (201/302) — Inertia navigates to the redirect URL
- Validation errors keep form data intact — user doesn't lose input on validation failure
- Errors are scoped to the component's lifecycle — they persist until the component unmounts or form resets
- File uploads require `forceFormData: true` — otherwise files are sent as JSON (which doesn't support file objects)

---

## Performance

Each form submission triggers a full Inertia request. Validation errors return smaller responses (422 with errors only). Success responses trigger a redirect with full page navigation. Form submissions are not "live" — each submission is a round-trip. For large forms with many fields, serialization and network transfer time are the primary costs. File uploads with `forceFormData: true` bypass JSON serialization entirely.

---

## Security

- Server-side validation is mandatory — client validation is bypassable
- Inertia forms are standard HTTP requests — CSRF protection applies automatically (Laravel includes the CSRF token)
- File uploads must have server-side validation for file type, size, and content
- Form method spoofing (`PUT`, `PATCH`, `DELETE`) is handled by Inertia's protocol headers, not `_method` field
- Always validate authorization in the server-side handler — Inertia does not add or remove authorization

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forgetting `preventDefault()` | Not calling `e.preventDefault()` | Browser submits the form natively, bypassing Inertia | Call `e.preventDefault()` as the first line in submit handler |
| Not resetting after success | Form data persists after submission | User sees stale data on re-visit | Call `reset()` in `onSuccess` callback |
| Mutating form data directly | `data.name = 'new'` instead of `setData` | Form tracking breaks, reactivity lost | Always use `setData('name', 'new')` |
| Missing `forceFormData` for files | Uploading files without the option | Files sent as JSON (empty/null) | Add `forceFormData: true` to submission options |
| Stale errors on re-visit | Errors persist after navigation away and back | User sees old validation errors | Reset errors on component mount or unmount |

---

## Anti-Patterns

- **Client-only validation**: Relying on JS validation without server-side rules — validation is easily bypassed
- **Manual error state**: Keeping a separate `errors` state that duplicates Inertia's built-in error handling
- **Concurrent form submissions**: Firing multiple submit requests for the same form — later responses overwrite earlier errors
- **No processing indicator**: Submitting without disabling the submit button or showing a spinner — users can double-submit
- **Over-nesting form data**: Using deeply nested form objects (`user.profile.address.street`) — hard to manage and type

---

## Examples

### Create Form

```jsx
import { useForm } from '@inertiajs/react';

export default function CreateUser() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/users', {
            onSuccess: () => reset(),
            transform: (data) => ({
                ...data,
                email: data.email.trim().toLowerCase(),
            }),
        });
    };

    return (
        <form onSubmit={submit}>
            <input value={data.name} onChange={e => setData('name', e.target.value)} />
            {errors.name && <div>{errors.name}</div>}
            <input value={data.email} onChange={e => setData('email', e.target.value)} />
            {errors.email && <div>{errors.email}</div>}
            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} />
            {errors.password && <div>{errors.password}</div>}
            <button type="submit" disabled={processing}>Create</button>
        </form>
    );
}
```

### Server Handler

```php
class UserController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
        ]);

        User::create($validated);

        return redirect('/users')->with('success', 'User created.');
    }
}
```

### File Upload with Progress

```jsx
const { data, setData, post, processing, progress } = useForm({ avatar: null });

const submit = (e) => {
    e.preventDefault();
    post('/avatar', { forceFormData: true });
};

return (
    <form onSubmit={submit}>
        <input type="file" onChange={e => setData('avatar', e.target.files[0])} />
        {progress && <progress value={progress.percentage} max="100" />}
        <button type="submit" disabled={processing}>Upload</button>
    </form>
);
```

---

## Related Topics

- Page Components — page component structure
- Server Props — receiving validation errors
- Partial Reloads — form state after partial reload
- Shared Data — flash messages after form success
- Form Request Validation — server-side validation patterns
- Input Preparation — transforming data before validation

---

## AI Agent Notes

- `useForm` returns: `data`, `setData`, `post`/`put`/`patch`/`delete`, `processing`, `errors`, `hasErrors`, `recentlySuccessful`, `reset`, `clearErrors`
- Inertia form submissions are standard HTTP requests, not AJAX
- File uploads require `forceFormData: true` to use FormData
- Validation errors return 422 with `{ errors: { field: ['message'] } }` structure
- The `transform` option allows data normalization before submission

---

## Verification

- All forms call `e.preventDefault()` in submit handlers
- `reset()` is called in `onSuccess` for create forms
- `forceFormData: true` is used for forms with file inputs
- Server-side validation rules exist for all form fields
- Submit buttons are disabled during `processing` to prevent double-submit
- Error messages are displayed per-field for all validated fields
