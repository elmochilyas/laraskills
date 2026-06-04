# Rebound Callbacks — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Rebound Callbacks
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | `rebinding()` vs `resolving()` for service configuration | Reacting to binding changes vs per-resolution setup | Correctness; timing; lifecycle |
| 2 | `rebinding()` vs manual `forgetInstance()` + `rebound()` | Registering interest in binding changes | Completeness; immediate callback delivery |
| 3 | Idempotent vs non-idempotent callback design | Ensuring safe multiple firings | Reliability; side effect accumulation |

---

## Decision 1: `rebinding()` vs `resolving()` for Service Configuration

### Decision Context
A service needs to be configured or initialized. Choose between `rebinding()` (react to binding changes) and `resolving()` (configure on every resolution).

### Decision Criteria
- **When should configuration apply?** Every resolution → `resolving()`; Only when binding changes → `rebinding()`
- **Is the binding expected to change during process lifetime?** Yes → `rebinding()`; No → `resolving()`
- **Is this for initial setup or for change notification?** Initial → `resolving()`; Change notification → `rebinding()`

### Decision Tree
```
Service configuration mechanism?
├── Configuration should apply on EVERY RESOLUTION
│   ├── Set cache TTL, attach event listeners, initialize state
│   │   └── Use resolving() — runs each time make() is called
│   └── Configuration is part of normal resolution lifecycle
│       └── Use resolving()
├── Configuration should apply ONLY ON BINDING CHANGE
│   ├── Rebuild client when API config changes
│   │   └── Use rebinding() — fires when binding is re-registered
│   ├── Sync middleware to router when kernel is rebound
│   │   └── Use rebinding() — framework core pattern
│   └── React to service provider re-registration
│       └── Use rebinding()
├── DON'T KNOW which to use?
│   ├── If the configuration must happen at least once
│   │   └── Use resolving() — guaranteed on every resolution
│   ├── If the configuration is about change tracking
│   │   └── Use rebinding()
│   └── When in doubt, use resolving() — more predictable
└── WRONG USAGE examples
    ├── rebinding() for per-resolution config → callback fires only once (never rebound)
    │   └── Configuration never applied in production
    ├── resolving() for change tracking → callback fires every resolution, wasteful
    │   └── Use rebinding() for change-specific reactions
    └── rebinding() when binding never changes → callback never fires
        └── Use resolving() for guaranteed execution
```

### Rationale
`resolving()` fires on every `make()` call — it's for per-resolution configuration. `rebinding()` fires only when a binding is re-registered after it has already been resolved — it's for change notification. Using `rebinding()` for per-resolution config means the callback may never fire (if the binding never changes) or fires too rarely.

### Default
Use `resolving()` for per-resolution configuration. Use `rebinding()` only for reacting to binding re-registrations.

### Risks
- `rebinding()` for per-resolution config → callback may never fire
- `resolving()` for change tracking → fires every resolution, not just on change
- Both callbacks registered for same abstract → `resolving()` runs first (runs in resolution pipeline), `rebinding()` runs on rebind

### Related Rules/Skills
- Do Not Use `rebinding()` for Per-Resolution Configuration
- Skill: React to Binding Re-registrations with `rebinding()`

---

## Decision 2: `rebinding()` vs Manual `forgetInstance()` + `rebound()`

### Decision Context
Need to react to binding re-registration. Choose between `rebinding()` (managed) or manual cache clearing + triggering.

### Decision Criteria
- **Need immediate callback if already resolved?** Yes → `rebinding()`; No → manual may work
- **Simplicity**: Prefer `rebinding()` — it handles immediate callback
- **Test teardown**: Specific cleanup → manual may be needed for isolation

### Decision Tree
```
How to react to binding re-registration?
├── General production code
│   └── ALWAYS use rebinding(): $app->rebinding(Abstract::class, $callback)
│   ├── Handles immediate callback if binding already resolved
│   ├── Correctly manages lifecycle
│   └── Cleaner, less error-prone
├── Manual: forgetInstance() + rebound()
│   ├── Only when fine-grained control is needed (test teardown)
│   │   └── Acceptable for test cleanup
│   └── Risk: misses immediate callback
│       └── If binding was already resolved, manual sequence fires callback, but rebinding() guarantees it
├── Immediate callback behavior
│   ├── rebinding() → if binding is already resolved, callback fires RIGHT NOW
│   │   └── Guarantees at least one execution
│   └── Manual forgetInstance() + rebind() → fires only on rebind
│       └── If missed immediate callback, consumer stays unsynchronized
└── Which binding change triggered?
    ├── rebinding() → automatically detects resolved status
    ├── Manual → must check $app->resolved() yourself
    └── rebinding() — less work, more correct
```

### Rationale
`rebinding()` handles the immediate-callback contract automatically — if the binding is already resolved, the callback fires immediately. Manual `forgetInstance() + rebound()` requires you to check `$app->resolved()` yourself and handle the immediate case explicitly. The managed API is always correct; the manual approach is error-prone.

### Default
Always use `rebinding()` for registering interest in binding changes. Use manual `forgetInstance() + rebound()` only in test teardown with specific cleanup needs.

### Risks
- Manual sequence misses the immediate callback → consumer stays with stale reference
- Manual sequence without `forgetInstance()` → new binding, but old cached instance returned
- Forgetting to call `rebound()` after `forgetInstance()` → callback never fires

### Related Rules/Skills
- Use `rebinding()` Instead of Manual `forgetInstance()` + `rebound()`
- Skill: React to Binding Re-registrations with `rebinding()`

---

## Decision 3: Idempotent vs Non-Idempotent Callback Design

### Decision Context
Designing the rebound callback logic. Decide whether the callback should be idempotent (safe to fire multiple times) or non-idempotent (assumes single fire).

### Decision Criteria
- **Binding may be rebound multiple times?** Yes → MUST be idempotent; No → idempotent is still safer
- **Callback appends vs sets**: Appends (addListener) → non-idempotent; Sets (setListeners) → idempotent
- **Stateful side effects**: Counter increments, push to array → non-idempotent

### Decision Tree
```
Rebound callback design?
├── Callback REPLACES/SETS state
│   ├── setListeners, setConfig, configure
│   │   └── IDEMPOTENT — safe to fire multiple times
│   ├── Same result regardless of call count
│   │   └── IDEMPOTENT — no side effect accumulation
│   └── Example: $gateway->setConfig([...]) replaces, doesn't append
├── Callback APPENDS/ADDS to state
│   ├── $gateway->addListener(...), $logger->pushHandler(...)
│   │   └── NON-IDEMPOTENT — duplicates on each fire
│   ├── Counter increment, array push
│   │   └── NON-IDEMPOTENT — accumulates
│   └── Risk: if callback fires 3 times, 3x listeners registered
├── Making non-idempotent callbacks safe
│   ├── Guard: check if already applied
│   │   └── if (!$gateway->hasListener('logger')) { ... }
│   ├── Replace: use set instead of add
│   │   └── setListeners([...]) instead of addListener(...)
│   └── Reset: clear before re-applying
│       └── $gateway->clearListeners(); $gateway->addListener(...)
└── Testing for idempotency
    ├── Manually trigger rebinding multiple times
    ├── Verify no duplicate listeners, handlers, or config
    └── Verify state is the same after 1 call vs 3 calls
```

### Rationale
Rebound callbacks can fire multiple times — during initial registration (immediate callback), during test setup (multiple mock overrides), or during package re-registration. A non-idempotent callback that appends listeners will register N copies of the same listener over N fires. Using set/replace patterns instead of add/append ensures safety.

### Default
Design all rebound callbacks to be idempotent — prefer `set` over `add`, `replace` over `append`. This prevents side effect accumulation.

### Risks
- Non-idempotent listener registration → N event listeners per N rebounds → performance degradation
- Non-idempotent counter → inflated metrics after multiple rebounds
- Non-idempotent config accumulation → memory growth from duplicated entries

### Related Rules/Skills
- Make Rebound Callbacks Idempotent
- Skill: React to Binding Re-registrations with `rebinding()`
