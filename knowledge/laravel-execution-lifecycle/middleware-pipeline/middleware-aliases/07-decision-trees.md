# Middleware Aliases — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Middleware Aliases
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Register alias vs use FQCN directly | Adding middleware referenced in route files | Readability; maintainability; boilerplate |
| 2 | Alias naming convention | Choosing the alias string | Consistency; discoverability; collision risk |
| 3 | Handle alias collision | Two sources register the same alias key | Correctness; debugging; behavior predictability |

---

## Decision 1: Register Alias vs Use FQCN Directly

### Decision Context
A middleware class needs to be referenced in route definitions. Decide whether to register a short alias or use the fully-qualified class name.

### Decision Criteria
- **Usage frequency**: Used in multiple route files → alias; one-off → either
- **Class name length**: Long (>30 chars) → alias; short → either
- **Decoupling need**: Framework upgrade may move classes → alias decouples
- **Route caching**: Routes will be cached → alias is fine; FQCN also works but is verbose
- **Standard vs custom**: Standard aliases already exist (`auth`, `throttle`) → use them

### Decision Tree
```
Middleware reference strategy?
├── Middleware is used in multiple route files
│   ├── Used in 3+ distinct route files
│   │   └── REGISTER ALIAS — reduces duplication and improves readability
│   └── Used in 2 route files
│       ├── Class name is short (<20 chars)
│       │   └── Either is acceptable; alias adds minor benefit
│       └── Class name is long (>20 chars)
│           └── REGISTER ALIAS — improves readability
├── Middleware is used only once
│   ├── Class name is short (<30 chars)
│   │   └── USE FQCN — alias registration adds unnecessary boilerplate
│   └── Class name is very long (>30 chars)
│       ├── Future routes may also need it
│       │   └── REGISTER ALIAS — future-proof
│       └── Truly one-off (experimental, temporary)
│           └── USE FQCN — will be removed soon
├── Application has route caching enabled
│   ├── Using alias → resolved at cache time (good)
│   └── Using FQCN → also resolved at cache time (also good)
│   └── Either works; alias is cleaner in route files
└── Middleware is from a third-party package
    └── USE the package-provided alias if available
```

### Rationale
The primary benefit of aliases is readability and decoupling. The cost is the boilerplate of one line in `bootstrap/app.php`. For middleware used in multiple places, the trade-off is clearly positive. For one-off middleware with short names, the alias registration is unnecessary overhead.

### Default
Register aliases for all custom middleware used in route definitions. Use FQCN only for temporary or single-use middleware with short class names.

### Risks
- Forgetting to register alias → `InvalidArgumentException` at runtime
- Registering alias but never using it → dead configuration (low risk)
- Using alias that was removed → runtime error

### Related Rules/Skills
- Register Custom Aliases for All Application Middleware
- Use the Full Class Name When Registering Aliases — Never Another Alias
- Skill: Register and Use Middleware Aliases

---

## Decision 2: Alias Naming Convention

### Decision Context
Choosing the string name for a middleware alias.

### Decision Criteria
- **Consistency with framework**: Follow Laravel's lowercase, single-word or hyphenated convention
- **Clarity**: Name should clearly convey the middleware's purpose
- **Collision avoidance**: Check existing framework and package aliases
- **Brevity**: Short enough to be convenient, long enough to be clear

### Decision Tree
```
Naming a middleware alias?
├── Standard framework pattern exists
│   ├── Use lowercase, single word: 'auth', 'guest', 'throttle', 'verified'
│   └── For multi-word, use hyphens: 'password.confirm' → 'password-confirm'
├── Custom application middleware
│   ├── Single responsibility → single word is ideal
│   │   └── e.g., 'role', 'audit', 'locale', 'maintenance'
│   ├── Multi-word description needed
│   │   ├── Use hyphens: 'log-requests', 'verify-tenant', 'check-subscription'
│   │   └── AVOID underscores: 'log_requests', 'verify_tenant'
│   └── Verbose but clear vs short but cryptic
│       └── Prefer clear over short: 'verify-team-membership' > 'vtm'
├── Collision risk check
│   ├── Check framework defaults: auth, guest, throttle, verified, can, signed, bindings, password.confirm
│   ├── Check package aliases (debugbar, telescope, etc.)
│   └── If collision exists → use different, more specific name
│       └── e.g., 'throttle' exists → use 'api-throttle' or 'custom-throttle'
└── Parameterized middleware naming
    └── Base alias without parameters; parameters added via colon syntax
        └── 'role:admin,editor' → alias is 'role', parameters are 'admin,editor'
```

### Rationale
Laravel uses lowercase, hyphenated alias names. Consistent naming prevents confusion and makes aliases discoverable. Aliases are more useful when they clearly convey purpose — cryptic shortcuts defeat the readability benefit.

### Default
Lowercase, single word. Use hyphens for multi-word names. Check for collisions before registering.

### Risks
- Cryptic aliases (`'m1'`, `'custom'`): reduce readability instead of improving it
- Collision with framework alias: silent behavior override across all routes
- Mixed-case aliases: inconsistent with framework convention; may cause confusion with case-insensitive file systems

### Related Rules/Skills
- Follow Laravel's Aliasing Convention — Lowercase, Hyphenated
- Never Register Custom Aliases That Collide with Framework Defaults
- Skill: Register and Use Middleware Aliases

---

## Decision 3: Handle Alias Collision

### Decision Context
Two sources (your app and a package, or two packages) register an alias with the same key. Decide how to resolve.

### Decision Criteria
- **Source of collision**: App vs package; package vs package; app vs framework
- **Intent**: Accidental (fix by renaming) vs intentional (replacing behavior)
- **Control**: Can you modify the package code? Yes → suggest fix; No → workaround needed

### Decision Tree
```
Alias collision detected?
├── App middleware vs framework alias
│   ├── Intentional replacement of framework behavior
│   │   └── Document explicitly and test all affected routes
│   └── Accidental collision
│       └── RENAME your alias to a non-colliding name
├── App middleware vs package alias
│   ├── Package alias is widely used in your app
│   │   └── RENAME your alias to avoid conflict
│   ├── Your alias is more important to your app
│   │   └── Override by registering after package (Laravel's last-registration-wins)
│   │   └── Ensure package routes are unaffected or updated
│   └── Both are equally important
│       └── Rename your alias; use FQCN for your middleware in routes
├── Package A vs Package B collision
│   ├── Both packages are essential
│   │   └── Fork/modify one package's alias registration
│   │   └── Or extend one package and register with different alias
│   ├── One package is optional
│   │   └── Remove the optional package or use FQCN for its middleware
│   └── Neither can be modified
│       └── Use FQCN for the middleware(s) in route definitions
└── Both aliases map to the same class (duplicate registration)
    └── Harmless — remove one registration for cleanliness
```

### Rationale
Alias collisions cause silent overrides — the last registration wins. This can change behavior across all routes without warning. The resolution depends on which alias is more important to your application. When in doubt, rename your custom alias to a more specific name.

### Default
Do not override framework aliases. If collision with a package, rename your alias. Document any intentional override.

### Risks
- Silent behavior change: middleware runs but with different class
- Package routes using overridden alias: get your middleware instead of the expected one
- Debugging difficulty: "I'm using `auth` middleware but it's behaving differently"

### Related Rules/Skills
- Never Register Custom Aliases That Collide with Framework Defaults
- Skill: Register and Use Middleware Aliases
