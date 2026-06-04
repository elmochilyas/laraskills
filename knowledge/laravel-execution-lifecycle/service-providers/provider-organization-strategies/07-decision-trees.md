# Decision Trees — Provider Organization Strategies

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Organization Strategies |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Dedicated vs Consolidated Providers | Whether to create separate providers per bounded context or consolidate related bindings | Architecture decision | High |
| D02 | Proxy Provider vs Flat Provider List | Whether to use hierarchical provider trees via `$app->register()` delegation or keep a flat list | Applications with many sub-domains | High |
| D03 | Domain Directory vs Flat Namespace | Whether to organize provider files in subdirectories by domain or keep them flat in `app/Providers/` | Project structure decision | Medium |
| D04 | Extracting from AppServiceProvider | When to move registrations out of an overgrown `AppServiceProvider` into dedicated providers | Refactoring opportunity | High |

---

## D01: Dedicated vs Consolidated Providers

### Decision Context
You have a set of related registrations and must decide whether to create one provider per bounded context or consolidate multiple concerns into fewer providers.

### Criteria
1. **Application size**: How many total providers does the application currently have?
2. **Domain boundaries**: Do the registrations belong to different bounded contexts?
3. **Deferral eligibility**: Do the domains have different deferral characteristics?
4. **Team structure**: Do different teams own different domains?

### Decision Tree
```
Set of registrations to organize
├── Application has <5 providers total?
│   ├── Yes → Consolidate (organization overhead not justified)
│   └── No → Application has 5-30 providers?
│       ├── Yes → Do the registrations belong to different bounded contexts?
│       │   ├── Yes → Create one provider per bounded context (dedicated)
│       │   └── No → Consolidate into single provider for that domain
│       └── No (30+ providers) → Is provider count a performance concern?
│           ├── Yes → Can some providers be deferred?
│           │   ├── Yes → Dedicated providers (enables selective deferral)
│           │   └── No → Consolidate within domains, assess deferred-first policy
│           └── No → Keep dedicated providers for maintainability
```

### Rationale
Dedicated providers (one per bounded context) follow SRP, make it easy to locate registrations, and enable selective deferral. The cost is increased provider count and bootstrap overhead. For small applications (<5 providers), consolidation is simpler. For medium applications (10-30), dedicated providers are the sweet spot. For large applications (30+), dedicated providers help manage complexity but deferral becomes necessary for performance.

### Default
One provider per bounded context for medium-to-large applications. Consolidate for small applications.

### Risks
- Over-splitting: 50+ trivial providers degrading bootstrap performance.
- Over-consolidation: God provider impossible to test or selectively defer.
- Domain boundaries that don't align with actual architecture.

### Related Rules/Skills
- Skill: Create and Register a Service Provider

---

## D02: Proxy Provider vs Flat Provider List

### Decision Context
Your application has multiple sub-domains within a larger domain (e.g., `Payments` containing `Stripe`, `Invoices`, `Subscriptions`). You must decide whether to use a proxy provider that delegates to sub-providers or list all sub-providers directly in `bootstrap/providers.php`.

### Criteria
1. **Sub-provider count**: How many sub-providers exist within the domain?
2. **Registration coupling**: Are the sub-providers always registered together?
3. **Discoverability**: Should the architecture map (provider list) show granular detail?
4. **Team boundaries**: Do different teams own different sub-providers?

### Decision Tree
```
Multiple sub-providers within a domain
├── Are there >3 sub-providers within the domain?
│   ├── Yes → Do all sub-providers have the same lifecycle (all eager or all deferred)?
│   │   ├── Yes → Use proxy provider ($this->app->register() delegation)
│   │   └── No → Can lifecycle be split by sub-group?
│   │       ├── Yes → Use proxy provider for same-lifecycle groups
│   │       └── No → Keep flat (explicit lifecycle per provider)
│   └── No (≤3) → Are the sub-providers ALWAYS registered together?
│       ├── Yes → Use proxy provider (cleaner, fewer entries in bootstrap/providers.php)
│       └── No → Keep flat (explicit registration control)
```

### Rationale
Proxy providers create a hierarchical provider tree: the parent provider delegates to sub-providers via `$this->app->register()`. This reduces clutter in `bootstrap/providers.php` (the architecture map) and groups related concerns. However, it adds indirection — you need to look inside the proxy to see which sub-providers exist. For 3+ sub-providers that are always registered together, the proxy pattern is cleaner.

### Default
Use proxy provider for 3+ sub-providers that share lifecycle characteristics. Keep flat for ≤3 sub-providers or when they have different deferral needs.

### Risks
- Proxy provider hides sub-providers from the architecture map.
- Mixing eager and deferred sub-providers under one proxy.
- Proxy itself becomes another potential source of bugs.

### Related Rules/Skills
- Skill: Create and Register a Service Provider

---

## D03: Domain Directory vs Flat Namespace

### Decision Context
You are organizing provider files. Should you place them directly in `app/Providers/` or in subdirectories like `app/Providers/Payments/`?

### Criteria
1. **Provider count**: How many provider files exist?
2. **Domain count**: How many distinct bounded contexts have providers?
3. **Namespace conventions**: Does your project already use domain-based directory structure?
4. **Tooling**: Do your IDE and autoloader handle subdirectories cleanly?

### Decision Tree
```
Provider file organization
├── Total provider files <10?
│   ├── Yes → Keep flat in app/Providers/ (simpler, fewer directories)
│   └── No → Are there ≥3 distinct bounded contexts with providers?
│       ├── Yes → Use domain subdirectories (app/Providers/Payments/, app/Providers/Notifications/)
│       └── No → Use flat structure with descriptive names (PaymentsServiceProvider, NotificationsServiceProvider)
```

### Rationale
Flat organization is simpler for small applications but becomes hard to navigate with 10+ provider files. Domain subdirectories group related providers together and scale well. For applications with only 1-2 domains, descriptive naming (prefixing with domain name) achieves clarity without subdirectories.

### Default
Flat structure for <10 providers. Domain subdirectories for 10+ providers across 3+ domains.

### Risks
- Subdirectories without corresponding namespace updates break autoloading.
- Inconsistent conventions — mixing flat and directory-structured providers.
- Deep nesting that over-complicates the provider directory.

### Related Rules/Skills
- Skill: Create and Register a Service Provider

---

## D04: Extracting from AppServiceProvider

### Decision Context
`AppServiceProvider` has grown beyond its original scope. You must decide when and what to extract into dedicated providers.

### Criteria
1. **AppServiceProvider size**: How many bindings and boot-time registrations does it contain?
2. **Domain mismatch**: Do the registrations belong to different logical domains?
3. **Testability**: Is the provider hard to test because it registers too many unrelated services?
4. **Performance**: Could extracting enable selective deferral of some bindings?

### Decision Tree
```
AppServiceProvider has grown large
├── Does it register bindings from multiple domains?
│   ├── Yes → Extract domain-specific bindings to dedicated providers
│   └── No → Does it contain >50 lines of code?
│       ├── Yes → Split into: AppServiceProvider (cross-cutting) + domain provider(s)
│       └── No → Keep as-is (AppServiceProvider for truly app-wide registrations)
├── After extraction, AppServiceProvider should only contain:
│   ├── Application-wide config (environment-specific registrations)
│   ├── Cross-cutting concerns that don't belong to any single domain
│   └── Shortcut properties ($bindings, $singletons) for domain-agnostic services
```

### Rationale
`AppServiceProvider` is a common dumping ground for all application registrations. As the application grows, it becomes a God provider that violates SRP. The extraction threshold depends on domain boundaries and maintainability. Cross-cutting concerns (environment-specific registration, app-wide macros) remain in `AppServiceProvider`. Domain-specific registrations move to dedicated providers.

### Default
Extract when `AppServiceProvider` exceeds 50 lines or contains registrations from 2+ distinct domains.

### Risks
- Over-extraction: creating many trivial providers with <5 lines each.
- Under-extraction: leaving a God provider that's hard to test and reason about.
- Extracting everything including truly cross-cutting concerns.

### Related Rules/Skills
- Skill: Create and Register a Service Provider
