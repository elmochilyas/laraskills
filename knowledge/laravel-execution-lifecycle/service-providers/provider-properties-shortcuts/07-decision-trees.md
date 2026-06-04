# Decision Trees — Provider Properties Shortcuts

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Properties Shortcuts |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Property Shortcut vs Explicit register() Code | Whether to use `$bindings`/`$singletons` properties or write equivalent code in `register()` | Every new binding | Low |
| D02 | parent::register() Debugging | How to diagnose whether shortcut properties are actually being processed | Troubleshooting | Medium |
| D03 | mergeConfigFrom() Placement | Where to place `mergeConfigFrom()` calls within a provider | Every config merge | Medium |
| D04 | Subclass Property Inheritance | How to handle `$bindings`/`$singletons` when extending a provider class | Package development | Medium |

---

## D01: Property Shortcut vs Explicit register() Code

### Decision Context
You need to register a service binding. You can either add it to the `$bindings` or `$singletons` array property, or write `$this->app->bind()` / `$this->app->singleton()` in the `register()` method.

### Criteria
1. **Binding complexity**: Is this a simple interface-to-class mapping or does it need factory logic?
2. **Decorator/contextual binding**: Do you need `when()->needs()->give()`, tagging, or decorators?
3. **Conditional logic**: Does the binding depend on configuration or environment?
4. **Existing code pattern**: Which approach does the rest of the provider use?

### Decision Tree
```
New binding to register
├── Is it a simple interface-to-class mapping without factory logic?
│   ├── Yes → Does it need to be a singleton?
│   │   ├── Yes → Use $singletons property
│   │   └── No → Use $bindings property
│   └── No → Does it need factory/closure logic?
│       ├── Yes → Write explicit $this->app->bind() in register()
│       └── No → Does it need contextual binding (when()->needs()->give()) or tagging?
│           ├── Yes → Write explicit code in register()
│           └── No → Conditional binding based on config?
│               ├── Yes → Write explicit code in register()
│               └── No → Use property shortcut
```

### Rationale
Property shortcuts are syntactic sugar — they are processed by the base `ServiceProvider::register()` method and internally call `$this->app->bind()` or `$this->app->singleton()`. The advantage is less boilerplate and clearer intent. The limitation is that properties cannot express factory closures, contextual binding, tagging, decorators, or conditional logic. When you need any of these, write explicit code in `register()`.

### Default
Use `$bindings`/`$singletons` properties for simple interface-to-class mappings. Use explicit `register()` code for anything requiring logic.

### Risks
- Properties silently do nothing if `register()` is overridden without `parent::register()`.
- Properties are not merged with parent class — re-declaring replaces entirely.
- Substituting property for explicit code when factory logic is needed.

### Related Rules/Skills
- Skill: Create and Register a Service Provider

---

## D02: parent::register() Debugging

### Decision Context
Your `$bindings` or `$singletons` properties don't seem to work — services aren't registered despite being declared in the properties.

### Criteria
1. **parent::register() call**: Does your `register()` method call `parent::register()`?
2. **Property declaration**: Are the properties declared in the same class or inherited?
3. **Override analysis**: Does any ancestor class in the hierarchy override `register()`?

### Decision Tree
```
$bindings/$singletons not registering
├── Is register() overridden in this class or any parent class?
│   ├── Yes → Does the overridden register() call parent::register()?
│   │   ├── Yes → Check if parent::register() is called before or after explicit bindings
│   │   │   ├── Before → Properties processed, then explicit bindings added
│   │   │   └── After → Explicit bindings registered but properties may overwrite them
│   │   └── No → THIS IS THE BUG — parent::register() not called
│   └── No → register() is not overridden — properties should work
│       └── Check: Are properties declared correctly?
│           ├── protected $bindings = [Interface::class => Concrete::class];
│           └── Do the class names exist and are autoloadable?
├── Fix: Add parent::register() as the first call in register()
└── Verify: After fix, app()->bound(Interface::class) returns true
```

### Rationale
The base `ServiceProvider::register()` method calls `registerBindings()` which iterates over `$bindings` and `$singletons` and registers them with the container. If any class in the inheritance hierarchy overrides `register()` without calling `parent::register()`, this processing is skipped. The properties silently appear correct in source code but no bindings are registered.

### Default
Always call `parent::register()` as the first line when overriding `register()` in a provider.

### Risks
- Silent failure — no error, no warning, bindings just don't register.
- Detection difficult because the properties look correct in code.
- Adding `parent::register()` after explicit bindings may cause unexpected override behavior.

### Related Rules/Skills
- Skill: Create and Register a Service Provider

---

## D03: mergeConfigFrom() Placement

### Decision Context
You are writing a package provider and need to merge default configuration with the application's published config.

### Criteria
1. **Method timing**: `mergeConfigFrom()` must run during `register()`, before the application boot phase.
2. **Config cache interaction**: With config cache enabled, merge happens once during caching.
3. **Override protection**: Merging should not overwrite user-published config values.

### Decision Tree
```
Package config merge needed
├── Should this always be placed in register()?
│   ├── Yes → Call mergeConfigFrom() inside register()
│   └── No → Check: Is this being called after config is cached?
│       ├── Yes → Move to register() — mergeConfigFrom() must run before config cache
│       └── No → Ensure it's in register(), NOT boot()
├── parent::register() ordering?
│   ├── Call parent::register() first, then mergeConfigFrom()
│   └── Because: parent::register() processes $bindings/$singletons; config merge is separate
```

### Rationale
`mergeConfigFrom()` uses recursive `array_merge` to add package config keys that don't exist in the published config. It must be called in `register()` because config caching during `php artisan config:cache` captures the state after all providers have registered. If called in `boot()`, the merge either happens too late (after cache) or on every request (if no cache).

### Default
Always call `mergeConfigFrom()` in `register()` after `parent::register()`.

### Risks
- Calling in `boot()` = merge happens after config cache; changes don't take effect in production.
- Calling before `parent::register()` = properties not yet processed (minor, usually fine).
- Forgetting `mergeConfigFrom()` entirely = package config keys missing.

### Related Rules/Skills
- Skill: Create and Register a Service Provider

---

## D04: Subclass Property Inheritance

### Decision Context
You are extending an existing provider class and want to add or modify `$bindings` or `$singletons`.

### Criteria
1. **Property override behavior**: PHP class properties override — they don't merge.
2. **Parent property contents**: What bindings does the parent class declare?
3. **Intent**: Do you want to add bindings, replace bindings, or remove bindings?

### Decision Tree
```
Extending a provider with $bindings/$singletons
├── Do you want to ADD bindings to the parent's set?
│   ├── Yes → Declare NEW bindings in subclass
│   │   └── WARNING: Subclass property REPLACES parent property entirely
│   │   └── If you need parent's bindings too, manually merge in register():
│   │       ├── parent::register(); // Process parent's shortcuts
│   │       └── $this->app->bind(SubclassInterface::class, SubclassConcrete::class);
│   └── No → Do you want to REPLACE a specific binding from parent?
│       ├── Yes → Declare only the binding to replace in subclass
│       │   └── Must manually register remaining parent bindings in register()
│       └── No → Do you want to REMOVE a parent binding?
│           ├── Yes → Cannot use properties — must call $app->offsetUnset() after parent::register()
│           └── No → No change needed
```

### Rationale
PHP class properties are not inherited via merging — a subclass declares its own `$bindings` array which completely replaces the parent's. This is a common source of confusion because method results (like `register()`) call parent methods, but properties do not accumulate. To combine parent and subclass bindings, you must manually register the parent's bindings via `parent::register()` and then add subclass-specific bindings in `register()` code.

### Default
Assume subclass property declarations replace — not merge — parent declarations. Use `register()` code to combine manually.

### Risks
- Silently losing parent bindings by re-declaring `$bindings` in subclass.
- Assuming PHP merges arrays across class inheritance (it doesn't for properties).
- Unexpected behavior when a parent package updates its `$bindings`.

### Related Rules/Skills
- Skill: Create and Register a Service Provider
