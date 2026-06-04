# Default Middleware Members — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Default Middleware Members
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Keep vs remove default middleware | Configuring middleware for web vs API vs hybrid | Performance; security; functionality |
| 2 | Modify default group composition | Adding/removing middleware from web or api groups | Blast radius; dependency chain integrity |
| 3 | Understanding the dependency chain | Reordering default middleware | Correctness of sessions, auth, CSRF |

---

## Decision 1: Keep vs Remove Default Middleware

### Decision Context
Deciding which default middleware to keep or remove based on application type.

### Decision Criteria
- **Application type**: Traditional web → keep all; API-only → remove session/cookie/CSRF; Hybrid → keep in web, strip from api
- **Session usage**: Uses session auth → keep StartSession, EncryptCookies; Token-based auth → can remove
- **Blade views**: Uses Blade with validation errors → keep ShareErrorsFromSession; No views → can remove
- **Route model binding**: Uses route model binding → keep SubstituteBindings; Always resolves manually → can remove

### Decision Tree
```
Default middleware configuration?
├── Traditional web app (Blade, session auth, CSRF forms)
│   ├── Keep ALL default middleware
│   ├── Global: TrustProxies, HandleCors, PreventRequestsDuringMaintenance, ValidatePostSize, TrimStrings, ConvertEmptyStringsToNull
│   ├── Web group: EncryptCookies, AddQueuedCookies, StartSession, ShareErrorsFromSession, VerifyCsrfToken, SubstituteBindings
│   └── API group: SubstituteBindings, ThrottleRequests:api
│   └── Only remove if you understand EXACTLY what you're doing
├── API-only app (token auth, no sessions, no views)
│   ├── Global: KEEP TrustProxies, HandleCors, PreventRequestsDuringMaintenance
│   ├── Global: REMOVE TrimStrings, ConvertEmptyStringsToNull (API handles its own input)
│   ├── Web group: REMOVE entirely (no web routes)
│   └── API group: KEEP SubstituteBindings, ThrottleRequests:api
│       └── ADD auth middleware for token verification
├── SPA with Sanctum (cookie-based SPA auth)
│   ├── Global: KEEP TrustProxies, HandleCors, PreventRequestsDuringMaintenance
│   ├── Web group: KEEP EncryptCookies, StartSession (SPA uses cookies)
│   ├── Web group: May skip VerifyCsrfToken (SPA uses Sanctum)
│   └── API group: KEEP SubstituteBindings, ThrottleRequests:api
└── Hybrid (web + API, same app)
    ├── Keep default web group for web routes
    ├── Keep default api group for API routes
    └── Don't remove anything — defaults handle both correctly
```

### Rationale
Default middleware is designed for traditional web applications. API-only applications should remove session, cookie, and CSRF middleware to avoid unnecessary I/O. Hybrid applications benefit from the group separation — web routes get session state, API routes get stateless throttling.

### Default
Keep all default middleware for traditional web apps. Remove session/cookie/CSRF for API-only apps.

### Risks
- Removing `StartSession` breaks all session-based auth and `auth()->user()`
- Removing `SubstituteBindings` breaks route model binding
- Removing `VerifyCsrfToken` exposes POST routes to CSRF attacks
- Removing `EncryptCookies` when using session auth: session IDs stored in encrypted cookies → session loss

### Related Rules/Skills
- Never Remove `SubstituteBindings` from Any Group
- Audit Default Middleware for API-Only Applications
- Skill: Audit Default Middleware Composition

---

## Decision 2: Modify Default Group Composition

### Decision Context
Adding or removing middleware from the default `web` or `api` groups.

### Decision Criteria
- **Scope**: Affects ALL routes in that group (including packages and future routes)
- **Dependency chain**: Insert at the correct position in the chain
- **Alternatives**: Custom group vs modifying default

### Decision Tree
```
Modifying a default group?
├── Adding middleware to web group
│   ├── Does EVERY web route need this?
│   │   ├── Yes (localization, global view data)
│   │   │   └── Append to web group: $middleware->web(append: [...])
│   │   └── No (admin-only, tenant-specific)
│   │       └── Create a CUSTOM group instead
│   └── Position in dependency chain
│       ├── Needs session → append AFTER SubstituteBindings
│       ├── Modify request before binding → before SubstituteBindings
│       └── Infrastructure → prepend at beginning
├── Adding middleware to api group
│   ├── Does EVERY API route need this?
│   │   ├── Yes (versioning, custom auth)
│   │   │   └── Append to api group
│   │   └── No (version-specific, endpoint-specific)
│   │       └── Use route-level middleware
│   └── Position: typically after throttle, before or after bindings
├── Removing middleware from default groups
│   ├── Is this middleware essential? (SubstituteBindings, StartSession)
│   │   ├── Essential → DO NOT REMOVE
│   │   └── Optional (ShareErrorsFromSession for pure API)
│   │       └── Remove from group: $middleware->web(remove: [...])
│   └── Use group-specific remove, not global remove
└── RISK: Modifying defaults affects package routes
    └── Packages register routes in 'web' — your additions apply to them
    └── Use custom groups to avoid this
```

### Rationale
Default groups are broadly scoped — `web` applies to all routes in `routes/web.php`, including those from packages. Adding middleware to a default group is convenient but has wide-reaching effects. The safer pattern is to create custom groups for application-specific middleware sets.

### Default
Use custom groups for application-specific middleware. Modify default groups only when genuinely every route in that group needs the change.

### Risks
- Adding to default groups affects package routes unexpectedly
- Removing from default groups breaks package functionality that depends on that middleware
- Wrong position in dependency chain (session middleware after auth) breaks functionality

### Related Rules/Skills
- Do Not Modify Default Groups Without Understanding the Dependency Chain
- Create Custom Groups for Distinct Route Types Instead of Modifying Defaults
- Skill: Audit Default Middleware Composition

---

## Decision 3: Understanding the Dependency Chain

### Decision Context
Understanding or modifying the ordering of default middleware to avoid breaking framework functionality.

### Decision Criteria
- **Dependency direction**: EncryptCookies → StartSession → Authenticate → SubstituteBindings
- **Insertion point**: New middleware goes before or after the framework middleware it depends on
- **Risk of reordering**: Reversing dependency direction breaks functionality

### Decision Tree
```
Default middleware dependency chain?
├── Cookie encryption layer
│   ├── EncryptCookies — decrypts all cookies on inbound
│   ├── AddQueuedCookiesToResponse — queues cookies for outbound
│   └── MUST run before any middleware that reads cookies (StartSession)
├── Session layer
│   ├── StartSession — starts session, makes session data available
│   └── MUST run after cookie decryption (session ID is in cookie)
│   └── MUST run before auth (auth uses session to persist login)
├── Error sharing layer
│   ├── ShareErrorsFromSession — shares validation errors to views
│   └── MUST run after session is started
│   └── Not needed if no Blade views or no form validation
├── CSRF layer
│   ├── VerifyCsrfToken — validates CSRF token on state-changing requests
│   └── MUST run after session (CSRF token stored in session)
│   └── Not needed for stateless APIs
├── Authentication layer
│   ├── Authenticate (alias) — checks if user is authenticated
│   └── MUST run after session is started (user data in session)
│   └── Running before session = auth always fails
└── Binding layer
    ├── SubstituteBindings — replaces route params with models
    └── Runs after auth (unauthenticated rejected before model loading)
    └── MUST run before middleware that accesses bound models
```

### Rationale
The dependency chain is: cookies → session → errors → CSRF → auth → bindings. Each step depends on the previous one. Breaking this chain (e.g., running auth before session) causes auth to fail because the session hasn't started yet. When inserting custom middleware, position it at the correct point in this chain based on what it depends on.

### Default
Follow the default ordering. Insert custom middleware after the framework middleware it depends on.

### Risks
- Auth before session: `Auth::check()` always returns false
- SubstituteBindings before auth: unnecessary model loading on rejected requests
- CSRF before session: CSRF token validation fails (no session to read token from)
- EncryptCookies after StartSession: session cookie ID can't be decrypted

### Related Rules/Skills
- Do Not Modify Default Groups Without Understanding the Dependency Chain
- Skill: Audit Default Middleware Composition
