# Inertia Form Handling

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Form Handling
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Inertia provides form handling through the `useForm` hook (React) or `useForm` composable (Vue). A form object manages client-side state (values, errors, processing state) and submits data to the server via Inertia's POST/PUT/PATCH/DELETE requests. The server responds with a redirect (success) or validation errors (failure), which Inertia automatically maps back to the form.

The engineering value is server-driven form validation without client-side validation duplication. The server defines validation rules. When validation fails, errors are returned and automatically populated in the form. When validation passes, the server redirects. The client does not need to duplicate validation logic.

---

## Core Concepts

### Form Object

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

### Server-Side Handling

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

        return redirect('/users')
            ->with('success', 'User created.');
    }
}
```

---

## Mental Models

### The Auto-Synced Form

The Inertia form is a state container that syncs with the server. When the user types, the form state updates locally. When submitted, the form sends itself to the server. If validation fails, the server sends back errors that the form absorbs. The developer never manually sets error states.

### The Managed Submission

The form object manages the entire submission lifecycle: loading state (processing), error state (errors), success handling (onSuccess), and error handling (onError). The developer provides callbacks for success/failure, but the form manages the request.

---

## Internal Mechanics

### Form Methods

| Method | HTTP Method | Use Case |
|---|---|---|
| `post(url)` | POST | Create resources |
| `put(url)` | PUT | Update resources (full) |
| `patch(url)` | PATCH | Update resources (partial) |
| `delete(url)` | DELETE | Delete resources |
| `get(url)` | GET | Navigation with query params |

### Error Handling

When the server returns validation errors (422 status), Inertia automatically:
1. Parses the error response
2. Maps errors to form fields (`errors.name`, `errors.email`)
3. Sets the form's `hasErrors` to true
4. Keeps the form data intact (user does not lose input)

### Success Handling

When the server returns a redirect (201, 302), Inertia:
1. Navigates to the redirect URL
2. Calls `onSuccess` callback
3. Clears errors
4. Optionally resets form fields (if `reset()` called)

---

## Patterns

### Update Form

```jsx
export default function EditUser({ user }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    // ... form JSX
}
```

### Delete with Confirmation

```jsx
export default function Show({ user }) {
    const { delete: destroy, processing } = useForm();

    const deleteUser = () => {
        if (confirm('Are you sure?')) {
            destroy(`/users/${user.id}`);
        }
    };

    return (
        <button onClick={deleteUser} disabled={processing}>
            Delete User
        </button>
    );
}
```

### File Upload

```jsx
import { useForm } from '@inertiajs/react';

export default function UploadAvatar() {
    const { data, setData, post, processing, progress } = useForm({
        avatar: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/avatar', {
            forceFormData: true, // Ensures FormData is used
        });
    };

    return (
        <form onSubmit={submit}>
            <input type="file" onChange={e => setData('avatar', e.target.files[0])} />
            {progress && <progress value={progress.percentage} max="100">{progress.percentage}%</progress>}
            <button type="submit" disabled={processing}>Upload</button>
        </form>
    );
}
```

### Transform Before Submit

```jsx
const transform = (data) => ({
    ...data,
    email: data.email.toLowerCase(),
});

const submit = (e) => {
    e.preventDefault();
    post('/users', { transform });
};
```

---

## Architectural Decisions

### Inertia Form vs Standard HTML Form

| Concern | Inertia Form | HTML Form |
|---|---|---|
| Error handling | Automatic (from server) | Manual |
| Loading state | Built-in (processing) | Manual (JS) |
| File uploads | With progress | Browser native |
| Validation feedback | Real-time (after server validation) | After page reload |
| Client-side logic | Optional (transform, callbacks) | Manual |

### useForm State Management

| Concern | Inertia useForm | Local useState |
|---|---|---|
| Form submission | Built-in | Manual fetch/AJAX |
| Error mapping | Automatic (server → form) | Manual |
| Processing state | Automatic | Manual boolean |
| File/form data | Automatic (FormData) | Manual |
| Reset | Built-in | Manual |

---

## Tradeoffs

| Concern | Inertia Form | Livewire Form | Alpine + AJAX |
|---|---|---|---|
| Validation round-trips | 1 (on submit) | Many (real-time) | 1 (on submit) |
| JavaScript | Required (React/Vue) | Minimal (Livewire) | Alpine (~10KB) |
| Error handling | Automatic (from 422) | Automatic (validate()) | Manual |
| File upload | With progress | With progress | Manual progress |

---

## Performance Considerations

Each form submission triggers a full Inertia request: the form data is sent, the server processes it, and if successful, the server redirects to a new page (which triggers a full page load). For forms with validation errors, the response is smaller (422 with just errors). Form submissions are not "live" — each submission is a round-trip.

---

## Production Considerations

### Always Validate on Server

Inertia forms rely on server-side validation. Do not rely on client-side validation alone — it can be bypassed. Server rules are the source of truth.

### Handle Network Errors

```jsx
post('/users', {
    onError: (errors) => {
        console.error('Validation failed:', errors);
    },
    onFinish: () => {
        // Always runs, success or failure
        console.log('Request completed');
    },
});
```

### Transform Data Before Submit

Use the `transform` option to normalize data (lowercase email, trim whitespace) before sending:

```jsx
post('/users', {
    transform: (data) => ({
        ...data,
        email: data.email.trim().toLowerCase(),
    }),
});
```

---

## Common Mistakes

### Forgetting preventDefault()

Always call `e.preventDefault()` in the submit handler to prevent the browser's default form submission:

```jsx
const submit = (e) => {
    e.preventDefault(); // Required
    post('/users');
};
```

### Not Resetting After Success

Form data persists after successful submission. Call `reset()` in `onSuccess` to clear the form:

```jsx
post('/users', {
    onSuccess: () => reset(),
});
```

### Mutating Form Data Directly

```jsx
// Bad — mutating the form object
data.name = 'New Name';

// Good — using setData
setData('name', 'New Name');
```

---

## Failure Modes

### Stale Errors

If the user navigates away and back, form errors persist. Errors are scoped to the component's lifecycle. Reset errors when the component unmounts or on successful navigation.

### Validation Error Overwrite

If multiple validation requests are in flight, a later response can overwrite earlier error messages. Ensure requests are sequential (not concurrent) for the same form.

---

## Ecosystem Usage

Inertia form handling integrates with the broader Laravel ecosystem. Validation rules are defined using Laravel's built-in Validator or FormRequest classes. File uploads use Laravel's filesystem configuration. Flash messages use Laravel's session. The `useForm` hook is part of the Inertia adapter ecosystem (@inertiajs/react, @inertiajs/vue3, @inertiajs/svelte).

## Related Knowledge Units

- **Page Components** (this workspace) — page component structure
- **Server Props** (this workspace) — receiving validation errors
- **Partial Reloads** (this workspace) — form state after partial reload
- **Shared Data** (this workspace) — flash messages after form success

---

## Research Notes

- `useForm` returns: `data`, `setData`, `post`/`put`/`patch`/`delete`, `processing`, `errors`, `hasErrors`, `recentlySuccessful`, `reset`, `clearErrors`
- Inertia form submissions are standard HTTP requests, not AJAX — they trigger full Inertia navigations
- File uploads require `forceFormData: true` option to use `FormData` instead of JSON
- Validation errors are expected as a 422 response with `{ errors: { field: ['message'] } }` structure
