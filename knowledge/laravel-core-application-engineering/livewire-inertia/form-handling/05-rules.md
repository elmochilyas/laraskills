## Rule: Always Validate on Server

Rely on server-side validation as the sole security boundary for form data. Client-side validation is UX-only sugar.

---

## Category

Security

---

## Rule

Every Inertia form submission must be validated server-side using Laravel's `$request->validate()` or FormRequest classes. Never trust client-side validation as a security mechanism. Never skip server validation because client validation is in place.

---

## Reason

Client-side validation is trivially bypassed — anyone can open DevTools, disable JavaScript, or send a direct HTTP request. Inertia forms submit standard HTTP requests. Without server-side validation, invalid or malicious data reaches your application logic and database.

---

## Bad Example

```php
// No server-side validation — trusting client entirely
public function store(Request $request): RedirectResponse
{
    User::create($request->all());
    return redirect('/users');
}
```

---

## Good Example

```php
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
    ]);
    User::create($validated);
    return redirect('/users');
}
```

---

## Exceptions

None. Server-side validation is mandatory for every form submission.

---

## Consequences Of Violation

Security risks: invalid or malicious data stored in database. Data integrity risks: corrupted records, SQL injection if raw input used.

---

## Rule: Always Call preventDefault

Call `e.preventDefault()` as the first line in every Inertia form submit handler.

---

## Category

Reliability

---

## Rule

In every `onSubmit` handler attached to an Inertia form, call `e.preventDefault()` before any other code. Never omit this call.

---

## Reason

Without `preventDefault()`, the browser submits the form natively, performing a standard HTTP request that bypasses Inertia's AJAX submission. This loses validation error mapping, progress tracking, and the Inertia navigation experience. The page performs a full reload instead of an Inertia visit.

---

## Bad Example

```jsx
const submit = (e) => {
    post('/users'); // Missing preventDefault — browser submits natively first
};
```

---

## Good Example

```jsx
const submit = (e) => {
    e.preventDefault();
    post('/users', { onSuccess: () => reset() });
};
```

---

## Exceptions

None. Every Inertia form handler must prevent default browser submission.

---

## Consequences Of Violation

Reliability risks: form submits via native HTTP, Inertia error handling broken. UX: full page reload instead of smooth SPA navigation.

---

## Rule: Reset Forms on Successful Submission

Call `reset()` in the `onSuccess` callback of create-type forms to clear form data after the server processes the submission.

---

## Category

UX

---

## Rule

In create forms (POST), call `reset()` inside the `onSuccess` callback. In edit forms (PUT/PATCH), decide based on UX — reset if the form should be ready for a new entry, keep values if the user should see their saved data.

---

## Reason

Without resetting, form data persists after submission. If the user navigates away and comes back, or if another user uses the same form on a shared device, the previous submission's data is still in the form fields. This is confusing and potentially leaks data between users.

---

## Bad Example

```jsx
const submit = (e) => {
    e.preventDefault();
    post('/users'); // Data persists after success
};
```

---

## Good Example

```jsx
const submit = (e) => {
    e.preventDefault();
    post('/users', {
        onSuccess: () => reset(),
    });
};
```

---

## Exceptions

Edit forms (PUT/PATCH) should not reset on success — the user expects to see their saved data. Clear individual fields that should be blank for a new entry.

---

## Consequences Of Violation

Data leakage risks: previous user's data visible in form fields. UX: stale data persists, confusing for subsequent entries.

---

## Rule: Use forceFormData for File Uploads

Always pass `forceFormData: true` as a submission option for forms that include file inputs.

---

## Category

Framework Usage

---

## Rule

When a form includes `<input type="file">`, add `forceFormData: true` to the `post()`/`put()` options. Do not omit this option — files will not be sent correctly without it.

---

## Reason

By default, Inertia submits form data as JSON. JSON cannot represent `File` objects — the file input value is serialized as an empty object or null. `forceFormData: true` switches the submission to `FormData` encoding, which correctly handles binary file data and supports multipart uploads.

---

## Bad Example

```jsx
post('/avatar', {
    // Missing forceFormData — avatar sent as null
});
```

---

## Good Example

```jsx
post('/avatar', {
    forceFormData: true, // Ensures file is sent as FormData
});
```

---

## Exceptions

Forms without file inputs should NOT use `forceFormData`, as FormData encoding is slightly larger and prevents nested data structures.

---

## Consequences Of Violation

Reliability risks: files arrive as null or empty on the server. UX: file upload silently fails, user sees no error.

---

## Rule: Disable Submit During Processing

Use the `processing` property from `useForm` to disable the submit button during form submission.

---

## Category

UX

---

## Rule

Set `disabled={processing}` on every form submit button. Additionally, use `wire:loading.attr="disabled"` in Livewire or equivalent visual feedback to indicate the submission is in progress.

---

## Reason

Without disabling during processing, users can double-click or press Enter multiple times, causing multiple form submissions. Each submission creates a separate request — the last one wins, but intermediate requests may create duplicate records, send duplicate emails, or cause race conditions.

---

## Bad Example

```jsx
<button type="submit">Save</button>
// Clickable multiple times — double-submit risk
```

---

## Good Example

```jsx
<button type="submit" disabled={processing}>
    {processing ? 'Saving...' : 'Save'}
</button>
```

---

## Exceptions

If the form submission triggers a navigation that unmounts the form immediately (e.g., redirect to a different page after success), double-submit prevention is still needed for the brief window before navigation.

---

## Consequences Of Violation

Data integrity risks: duplicate records created. Reliability risks: race conditions from concurrent submissions.

---

## Rule: Use setData, Never Direct Mutation

Always update form data through the `setData` method. Never assign to `data.property` directly.

---

## Category

Framework Usage

---

## Rule

Use `setData('field', value)` or `setData({ field: value })` for all form field updates. Do not mutate the `data` object directly with assignment operators.

---

## Reason

Inertia's `useForm` tracks form state through a reactive proxy. Direct mutation (`data.name = 'new'`) bypasses the proxy, so Inertia does not detect the change — the form object has stale data when submitted. Only `setData` triggers the internal reactivity that ensures the submitted data matches the form's current state.

---

## Bad Example

```jsx
const handleChange = (e) => {
    data.name = e.target.value; // Direct mutation — reactivity broken
};
```

---

## Good Example

```jsx
const handleChange = (e) => {
    setData('name', e.target.value); // Correct — triggers reactivity
};
```

---

## Exceptions

When using third-party form libraries (e.g., React Hook Form) that manage their own field state, extract the values on submit and pass them to Inertia's submit method directly rather than using `useForm` for field management.

---

## Consequences Of Violation

Reliability risks: form submits stale data, user values silently discarded. Debugging difficulty: hard to trace why submitted data differs from form input.

---

## Rule: Type Form Data with TypeScript

Pass a typed interface to `useForm<T>()` for type-safe form handling.

---

## Category

Maintainability

---

## Rule

Define an explicit interface for every form's data shape and pass it as the generic parameter to `useForm<T>()`. Include all fields with their correct types.

---

## Reason

Without the generic, `data` properties are `any`, `setData` accepts any key name, and the `transform` callback receives untyped data. This allows misspelled field names and incorrect value types to go undetected until runtime — or worse, until a bug is discovered in production.

---

## Bad Example

```tsx
const { data, setData } = useForm({ name: '', email: '' });
// data.name is any — no type checking
```

---

## Good Example

```tsx
interface CreateUserForm {
    name: string;
    email: string;
    password: string;
}

const { data, setData } = useForm<CreateUserForm>({
    name: '',
    email: '',
    password: '',
});
// data.name is string — fully typed
```

---

## Exceptions

For single-field search forms or trivial two-field forms, the type inference from the initial values object may be sufficient. Add the generic when the form grows beyond three fields.

---

## Consequences Of Violation

Maintenance risks: field renames miss a setData call, form breaks silently. Developer experience: no autocompletion, no type checking for form operations.
