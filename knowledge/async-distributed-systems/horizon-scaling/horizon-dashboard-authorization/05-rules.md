# Rule Card: K082 — Horizon Dashboard Authorization

---

## Rule 1

**Rule Name:** configure-horizon-auth-production

**Category:** Always

**Rule:** Always configure `Horizon::auth()` for production environments.

**Reason:** The dashboard exposes job payloads (PII), retry capabilities, and supervisor controls — unauthorized access is a security risk.

**Bad Example:**
```php
// No auth configured — anyone can access /horizon in production
```

**Good Example:**
```php
Horizon::auth(function ($request) {
    return $request->user() && $request->user()->hasRole('admin');
});
```

**Exceptions:** Development environments where default local-only access is appropriate.

**Consequences Of Violation:** An attacker navigates to `/horizon` — they see failed job payloads containing API keys, PII, and business data. They can retry, delete, or pause all queue processing.

---

## Rule 2

**Rule Name:** return-false-not-exception

**Category:** Always

**Rule:** Always return `false` from auth callback for unauthenticated users — do not throw.

**Reason:** Throwing returns a 500 error and may leak error details, instead of a clean 403.

**Bad Example:**
```php
Horizon::auth(function ($request) {
    return $request->user()->isAdmin(); // Throws if no user
});
```

**Good Example:**
```php
Horizon::auth(function ($request) {
    return $request->user()?->isAdmin() ?? false;
});
```

**Exceptions:** None — unauthenticated requests should always get 403.

**Consequences Of Violation:** An unauthenticated request hits `/horizon` — the callback calls `isAdmin()` on null, throwing `ErrorException`. Horizon returns a 500 error with a stack trace including the callback location.

---

## Rule 3

**Rule Name:** consider-removing-horizon-routes

**Category:** Prefer

**Rule:** Prefer removing Horizon routes entirely in production if no remote monitoring is needed.

**Reason:** Removing routes eliminates the attack surface entirely — no auth bypass is possible if the route doesn't exist.

**Bad Example:**
```php
// Routes always registered — attack surface exists even with auth
```

**Good Example:**
```php
// config/horizon.php
'routes' => env('HORIZON_ROUTES_ENABLED', !app()->environment('production')),
```

**Exceptions:** Teams that need remote dashboard access in production (on-call monitoring).

**Consequences Of Violation:** A zero-day in Horizon's auth middleware is exploitable — but if routes are disabled at the config level, there's no route to exploit.

---

## Rule 4

**Rule Name:** keep-auth-callback-fast

**Category:** Always

**Rule:** Always keep `Horizon::auth()` callbacks fast — avoid database queries.

**Reason:** The callback runs on every dashboard request — slow callbacks degrade page load times.

**Bad Example:**
```php
Horizon::auth(function ($request) {
    return DB::table('permissions')->where('user_id', $request->user()->id)->exists(); // Query per page load
});
```

**Good Example:**
```php
Horizon::auth(function ($request) {
    return $request->user()?->isAdmin() ?? false; // Simple role check, no query
});
```

**Exceptions:** Roles cached in session or request-scoped data are acceptable.

**Consequences Of Violation:** Each of the 50 daily dashboard page loads triggers a database query — under heavy monitoring (auto-refresh), this adds unnecessary load to the database.
