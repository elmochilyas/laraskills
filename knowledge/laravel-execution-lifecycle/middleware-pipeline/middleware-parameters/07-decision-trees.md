# Middleware Parameters — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Middleware Parameters
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Colon-delimited parameters vs constructor injection | Passing configuration to middleware | Flexibility; type safety; readability |
| 2 | Fixed parameters vs variadic `...$params` | Defining the middleware `handle()` signature | Reliability; backward compatibility |
| 3 | String comparison vs type casting | Using parameter values inside middleware | Correctness; logic bugs |

---

## Decision 1: Colon-Delimited Parameters vs Constructor Injection

### Decision Context
Your middleware needs configuration data. Choose between colon-delimited route parameters (`'throttle:60,1'`) or constructor dependency injection.

### Decision Criteria
- **Configuration complexity**: Simple scalars (strings, ints) → colon; objects, arrays, or services → constructor
- **Variability per route**: Same middleware, different values per route → colon; same value everywhere → constructor
- **Sensitivity**: Not secrets → colon; secrets, API keys → NEVER colon
- **Number of parameters**: 1-4 → colon; 5+ → constructor (configuration object)
- **Route caching needed**: Both work → colon params are serialized in cache

### Decision Tree
```
Middleware configuration approach?
├── Configuration is complex (objects, arrays, services)
│   └── Use constructor injection — proper types, validation, autocomplete
├── Configuration is simple scalars (strings, ints)
│   ├── Same values for all routes
│   │   └── Hardcode in middleware or use constructor defaults
│   ├── Different values per route
│   │   ├── 1-4 parameters
│   │   │   └── Use colon-delimited syntax: 'throttle:60,1'
│   │   └── 5+ parameters
│   │       └── Use constructor injection with a config object
│   └── Values are secrets (API keys, tokens)
│       └── NEVER use colon-delimited — visible in route files and cache
├── Configuration is a boolean flag
│   ├── True/false toggle
│   │   └── Use colon with string comparison: $enabled === 'true'
│   └── Complex conditional
│       └── Use constructor injection
└── Parameters are optional with defaults
    └── Colon-delimited with variadic and defaults works well:
        `$param = $params[0] ?? 'default'`
```

### Rationale
Colon-delimited parameters are for simple, per-route configuration where the same middleware needs different values on different routes. Constructor injection is for complex configuration, shared dependencies, and cases where configuration doesn't vary per route. Never pass secrets through route parameters — they are visible in route files, cache files, and version control.

### Default
Use colon-delimited parameters for 1-4 simple scalar values that vary per route. Use constructor injection for everything else.

### Risks
- Secrets exposed in route files and cache
- More than 4 parameters becomes unreadable
- `'false'` string is truthy in PHP — comparison bugs

### Related Rules/Skills
- Limit Parameterized Middleware to 3-4 Parameters Maximum
- Do Not Pass Sensitive Data as Middleware Parameters
- Skill: Implement Parameterized Middleware

---

## Decision 2: Fixed Parameters vs Variadic `...$params`

### Decision Context
Defining `handle($request, $next, ...)` — choose between explicit named parameters or a variadic `...$params` catch-all.

### Decision Criteria
- **Parameter count guarantee**: All callers always pass exact count → fixed; optional params → variadic
- **Backward compatibility**: May add params later → variadic (not breaking)
- **Type safety**: Need type hints per param → fixed; all strings anyway → variadic
- **Documentation clarity**: Named params are self-documenting → fixed; variadic needs docblock

### Decision Tree
```
Middleware handle() signature?
├── Parameters are REQUIRED (always provided)
│   ├── Count is fixed and guaranteed (e.g., throttle always gets maxAttempts)
│   │   └── Use FIXED parameters: handle($request, $next, $maxAttempts, $decayMinutes)
│   └── Type safety is important
│       └── Use FIXED with type hints: handle($request, $next, string $guard = 'web')
├── Parameters are OPTIONAL (may be omitted)
│   ├── Some routes may not pass any parameters
│   │   └── Use VARIADIC: handle($request, $next, ...$params)
│   └── Number of params varies per route
│       └── Use VARIADIC: handle($request, $next, ...$roles)
├── PARAMETER COUNT MAY CHANGE IN FUTURE
│   ├── Add a parameter in a future version
│   │   └── Use VARIADIC — adding a param is not a breaking change
│   └── Currently optional but may become required
│       └── Use VARIADIC — flexible for future evolution
└── Both work (fixed with defaults vs variadic)
    ├── handle($request, $next, $guard = 'web') — works if only 0 or 1 param
    └── handle($request, $next, ...$params) — works for 0, 1, 2, ... params
    └── Variadic is safer unless all callers always provide all params
```

### Rationale
Variadic parameters handle any number of arguments gracefully — missing parameters result in an empty array rather than a `TypeError`. Fixed parameters with defaults work for known, stable parameter counts. The safest default is variadic unless you have a strong guarantee that all callers will always provide the same number of parameters.

### Default
Use variadic `...$params` for middleware with optional parameters. Use fixed parameters only when the count is guaranteed and will never change.

### Risks
- Fixed with too-few params → `TypeError` at runtime
- Adding a new parameter to fixed signature → breaking change for all routes
- Variadic is slightly less self-documenting — compensate with good docblock

### Related Rules/Skills
- Use Variadic Parameters for Optional Arguments
- Document the Parameter Order and Types in the Middleware Docblock
- Skill: Implement Parameterized Middleware

---

## Decision 3: String Comparison vs Type Casting

### Decision Context
Using parameter values inside `handle()` — deciding how to compare and transform parameters that arrive as strings.

### Decision Criteria
- **Parameter is used as string** → compare with `===`
- **Parameter is used as integer** → cast with `(int)` at top of method
- **Parameter is used as boolean** → compare with `=== 'true'` or `=== 'false'`
- **Parameter is used in multiple places** → cast once at top, use typed variable

### Decision Tree
```
Using parameter values inside handle()?
├── Comparing for equality
│   ├── String-to-string comparison
│   │   └── Use ===: $guard === 'api'
│   ├── String-to-boolean interpretation
│   │   ├── $enabled === 'true' — only 'true' string means true
│   │   └── if ($enabled) — WRONG! 'false' is truthy in PHP
│   └── String-to-numeric comparison
│       └── (int) $maxAttempts === 60 — cast to int first
├── Using as a different type
│   ├── Integer value
│   │   └── Cast at top: $maxAttempts = (int) ($params[0] ?? 60);
│   ├── Float/decimal value
│   │   └── Cast: $rate = (float) ($params[0] ?? 1.0);
│   ├── Boolean value
│   │   └── Compare: $enabled = ($params[0] ?? 'false') === 'true';
│   └── Array of values
│       └── Already array if variadic: in_array($role, $roles)
├── Type safety best practice
│   ├── Cast ALL parameters at the TOP of handle()
│   │   └── Clear, consistent, easy to verify
│   └── Then use typed variables throughout
│       └── No surprises in the middle of the method
└── Common pitfalls
    ├── '0' is falsy in PHP: if ('0') returns false
    ├── 'false' is truthy in PHP: if ('false') returns true
    └── 'null' is truthy in PHP: 'null' as string → truthy
```

### Rationale
All colon-delimited parameters arrive as strings. PHP's loose typing makes string-to-boolean interpretation especially dangerous — the string `"false"` is truthy. Explicit casting and string comparison with `===` prevents logic bugs that are hard to trace.

### Default
Cast all parameters to their intended types at the top of `handle()`. Use `===` for all string comparisons.

### Risks
- Truthy check on `'false'` string → logic always takes the true branch
- `'0'` as falsy → conditional accidentally skips
- Assuming `'42'` behaves as int → auto-casting works in arithmetic but fails in strict comparisons

### Related Rules/Skills
- Compare Parameter Values with String Literals, Not Truthy Checks
- Type-Cast String Parameters Explicitly at the Top of `handle()`
- Skill: Implement Parameterized Middleware
