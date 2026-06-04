# Inertia + Laravel — Anti-Patterns

## Anti-Pattern 1: Returning redirect()->back() With Inertia

**Symptom:** Using `redirect()->back()` in controllers when validation fails or as a general response pattern.

**Problem:** Inertia handles responses differently from traditional Blade apps. `redirect()->back()` causes a full-page reload, losing Inertia's client-side state management. The SPA behavior breaks — flash messages flash, modals close, scroll positions reset.

```php
// BAD — breaks Inertia client state
public function store(Request $request)
{
    $validated = $request->validate(/* ... */);
    // ...
    return redirect()->back()->with('success', 'Created');
}
```

**Solution:** Return Inertia responses or redirect to named routes with Inertia-compatible flash messages.

```php
// GOOD — Inertia-aware redirect
return redirect()->route('posts.index')->with('success', 'Post created!');
```

**Detection:** Search for `redirect()->back()` in Inertia controller methods. Replace with named route redirects.

---

## Anti-Pattern 2: Passing More Data Than Necessary

**Symptom:** Passing entire Eloquent models or large data sets to Inertia without selecting only the fields the frontend needs.

**Problem:** Inertia serializes all props to JSON in the HTML payload. Passing full models (including relations, timestamps, pivot data) balloons the initial page load size. Large serialized state on every request increases TTFB and harms perceived performance.

```php
// BAD — passes entire model with relations
return Inertia::render('Posts/Index', [
    'posts' => Post::with(['comments', 'tags', 'author.profile'])->get()
]);
```

**Solution:** Use API resources or manually select only fields needed by the frontend.

```php
// GOOD — minimal data
return Inertia::render('Posts/Index', [
    'posts' => Post::all()->map(fn ($post) => [
        'id' => $post->id,
        'title' => $post->title,
        'author' => $post->author->name,
        'comment_count' => $post->comments_count,
    ])
]);
```

**Detection:** Search for `Inertia::render` with Eloquent collections passed directly. Flag models passed without resource transformation.

---

## Anti-Pattern 3: Form Validation Using Client-Side Only

**Symptom:** Relying solely on frontend validation with no server-side FormRequest or validation rules.

**Problem:** Client-side validation is trivially bypassed — disabling JavaScript or sending raw HTTP requests bypasses all frontend checks. Missing server-side validation leaves the application vulnerable to invalid, malicious, or incomplete data.

```javascript
// BAD — Vue component validates alone
const submit = () => {
    if (form.title.length < 3) {
        errors.title = 'Title too short';
        return;
    }
    axios.post('/posts', form.value);
};
```

**Solution:** Always validate server-side with FormRequests. Use frontend validation only for UX improvement.

```javascript
// GOOD — server-side validation with Inertia form
const form = useForm({ title: '' });
const submit = () => {
    form.post('/posts', {
        onSuccess: () => { /* ... */ },
        onError: (errors) => { /* server errors populate form */ },
    });
};
```

**Detection:** Search for `axios`, `fetch`, or `useForm` without corresponding FormRequest validation classes.

---

## Anti-Pattern 4: Handling Authentication Tokens Manually

**Symptom:** Manually managing bearer tokens, CSRF tokens, or session cookies for Inertia requests.

**Problem:** Inertia handles CSRF protection and session management automatically through Laravel's cookie-based authentication. Manual token handling adds unnecessary complexity and can introduce security holes.

```javascript
// BAD — manual token handling
const submit = () => {
    const token = localStorage.getItem('token');
    axios.post('/posts', form.value, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
```

**Solution:** Use Inertia's built-in form helper which handles session authentication automatically.

```javascript
// GOOD — Inertia handles auth
import { useForm } from '@inertiajs/vue3';
const form = useForm({ title: '' });
form.post('/posts');
```

**Detection:** Search for `Authorization`, `Bearer`, `localStorage.getItem` in Inertia frontend code.

---

## Anti-Pattern 5: Server-Side State in Session for Inertia

**Symptom:** Storing page-specific state (filters, search terms, active tabs) in the session or flash data across Inertia requests.

**Problem:** Every user interaction forces a server round-trip to read/write session data. Inertia is designed for client-side state management — the session should handle only authentication and global concerns.

```php
// BAD — tab state in session
public function index()
{
    $activeTab = session('active_tab', 'all');
    return Inertia::render('Dashboard', ['active_tab' => $activeTab]);
}

public function setTab(Request $request)
{
    session(['active_tab' => $request->tab]);
    return redirect()->back();
}
```

**Solution:** Manage UI state on the client side using Inertia's shared state or Pinia/Vuex.

```javascript
// GOOD — client-side state
const activeTab = ref('all');
```

**Detection:** Search for `session()`, `Session::`, `flash()` in Inertia controller methods for UI-related state.

---

## Anti-Pattern 6: Mixing Inertia and Blade in the Same Page Flow

**Symptom:** Some pages use Inertia with React/Vue, while others use Blade templates in the same user flow (e.g., dashboard in Inertia, settings in Blade).

**Problem:** Mixing rendering strategies means shared layout, navigation, and state management must be duplicated. Users experience hard page reloads when crossing the Inertia-Blade boundary. The unified SPA feel is broken.

```php
// BAD — mixed rendering
// routes/web.php
Route::get('/dashboard', [DashboardController::class, 'index']); // Inertia
Route::get('/settings', [SettingsController::class, 'edit']); // Blade (full reload)
```

**Solution:** Be consistent — either use Inertia for the entire application or keep Blade within its own route group.

```php
// GOOD — consistent rendering
Route::middleware(['inertia'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/settings', [SettingsController::class, 'edit']);
});
```

**Detection:** Search for both `Inertia::render(` and `view(` in the same controller or controller group.
