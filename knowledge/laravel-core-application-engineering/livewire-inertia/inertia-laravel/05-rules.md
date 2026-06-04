# Rules: Inertia + Laravel

## Rule 1 — Register HandleInertiaRequests Middleware

**Rule Name:** register-inertia-middleware
**Category:** Always
**Rule:** The `HandleInertiaRequests` middleware must be registered in the web middleware group.
**Reason:** Without it, Inertia cannot handle XHR requests, and shared data is unavailable.
**Bad Example:**
```php
// bootstrap/app.php — middleware not registered
->withMiddleware(function (Middleware $middleware) {
    // HandleInertiaRequests not added
})
```
**Good Example:**
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(prepend: [
        \App\Http\Middleware\HandleInertiaRequests::class,
    ]);
})
```
**Exceptions:** None — this middleware is required for Inertia to function.

## Rule 2 — Redirect to Named Routes, Not back()

**Rule Name:** redirect-to-named-routes
**Category:** Always
**Rule:** Use `redirect()->route()` instead of `redirect()->back()` in Inertia controllers.
**Reason:** `redirect()->back()` causes a full page reload, breaking Inertia's SPA behavior.
**Bad Example:**
```php
return redirect()->back()->with('success', 'Created');
```
**Good Example:**
```php
return redirect()->route('posts.index')->with('success', 'Created');
```
**Exceptions:** When the redirect target is genuinely the previous page (e.g., cancel button).

## Rule 3 — Transform Models Before Passing as Props

**Rule Name:** transform-models-before-props
**Category:** Always
**Rule:** Pass transformed data (API Resources, DTOs, or select arrays), not full Eloquent models.
**Reason:** Full models include all attributes and relationships, bloating the Inertia payload.
**Bad Example:**
```php
return Inertia::render('Posts/Index', [
    'posts' => Post::with('comments', 'tags')->get(),
]);
```
**Good Example:**
```php
return Inertia::render('Posts/Index', [
    'posts' => PostResource::collection(Post::paginate(20)),
]);
```
**Exceptions:** Internal admin pages where teams control both frontend and backend.

## Rule 4 — Use FormRequest for Validation

**Rule Name:** use-form-request-for-validation
**Category:** Always
**Rule:** All input validation must use Form Requests. Never rely on client-side validation alone.
**Reason:** Form Requests integrate with Inertia's validation error handling automatically.
**Bad Example:**
```php
public function store(Request $request): RedirectResponse
{
    $request->validate([...]); // Validation in controller
}
```
**Good Example:**
```php
public function store(StorePostRequest $request): RedirectResponse
{
    Post::create($request->validated());
}
```
**Exceptions:** None — server-side validation is mandatory.

## Rule 5 — No Manual Auth Token Handling

**Rule Name:** no-manual-auth-tokens
**Category:** Always
**Rule:** Do not manage authentication tokens manually in Inertia applications.
**Reason:** Inertia uses Laravel's session-based authentication automatically.
**Bad Example:**
```javascript
const token = localStorage.getItem('token');
form.post('/posts', { headers: { Authorization: `Bearer ${token}` } });
```
**Good Example:**
```javascript
const form = useForm({ title: '' });
form.post('/posts'); // Inertia handles auth automatically
```
**Exceptions:** Applications that integrate with third-party APIs requiring token-based auth.

## Rule 6 — Keep UI State on Client

**Rule Name:** keep-ui-state-on-client
**Category:** Prefer
**Rule:** Store UI state (tabs, filters, search terms) on the client, not in Laravel session.
**Reason:** Inertia manages client-side state. Session storage adds unnecessary server round-trips.
**Bad Example:**
```php
public function setTab(Request $request): RedirectResponse
{
    session(['active_tab' => $request->tab]);
}
```
**Good Example:**
```javascript
// In Vue component:
const activeTab = ref('all');
```
**Exceptions:** UI state that must persist across browser sessions.

## Rule 7 — Consistent Rendering Strategy

**Rule Name:** consistent-rendering-strategy
**Category:** Prefer
**Rule:** Use Inertia for all pages within the same application flow. Avoid mixing Inertia and Blade.
**Reason:** Mixed rendering breaks the SPA feel and requires duplicated layouts.
**Bad Example:**
```php
Route::get('/dashboard', [DashboardController::class, 'index']); // Inertia
Route::get('/settings', [SettingsController::class, 'edit']); // Blade
```
**Good Example:**
```php
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/settings', [SettingsController::class, 'edit']);
// Both use Inertia
```
**Exceptions:** Standalone Blade pages outside the main application flow (landing pages, marketing).
