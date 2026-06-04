# Decision Trees — Eager Providers

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Eager Providers |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Must Be Eager vs Can Be Deferred | Whether a provider must remain eager based on its boot-time responsibilities | Every provider review | High |
| D02 | Lightweight vs Heavy Eager Provider | Whether an eager provider's `register()`/`boot()` workload is acceptable or needs optimization | Performance review | High |
| D03 | Keep Eager vs Convert to Deferred | Whether to convert an existing eager provider to deferred for performance | Periodic optimization | High |
| D04 | Consolidate vs Keep Separate | Whether to merge multiple tiny eager providers or keep them separate | Architecture review | Medium |

---

## D01: Must Be Eager vs Can Be Deferred

### Decision Context
You are auditing a provider to determine if it must remain eager or if it can be deferred.

### Criteria
1. **Boot-time artifacts**: Does `boot()` register routes, views, event listeners, middleware, or Blade directives?
2. **Startup requirements**: Does `register()` have side effects that must run at application initialization?
3. **Core infrastructure**: Is this provider part of the framework's core bootstrapping (routing, config, error handling)?

### Decision Tree
```
Provider being evaluated
├── Does boot() register routes (loadRoutesFrom), views, event listeners, or middleware?
│   ├── Yes → MUST be eager
│   └── No → Does register() have side effects required at startup (logging, cache warm, file writes)?
│       ├── Yes → MUST be eager
│       └── No → Is this a core framework provider (routing, config, error handling)?
│           ├── Yes → MUST be eager
│           └── No → Can be deferred
```

### Rationale
Boot-time artifact registration is the hard constraint: routes, event listeners, and views must be available from application start. Any provider that calls `loadRoutesFrom`, registers listeners, or defines views cannot be deferred. Similarly, providers with startup side effects must run at boot. Everything else is a candidate for deferral.

### Default
Any provider not registering boot-time artifacts and without startup side effects can be deferred. Remaining eager requires explicit justification.

### Risks
- Deferring a provider with boot-time artifacts causes routes/events/views to be unavailable until the deferred service is first resolved.
- Keeping providers eager unnecessarily increases bootstrap time.

### Related Rules/Skills
- Rule 2: Prefer Deferred Providers for Services Used on Fewer Than 30% of Routes
- Skill: Audit and Optimize Eager Provider Overhead

---

## D02: Lightweight vs Heavy Eager Provider

### Decision Context
You are profiling an eager provider to determine if its `register()`/`boot()` workload is acceptable.

### Criteria
1. **Execution time**: How long does the provider's `register()` + `boot()` take?
2. **Operations performed**: Does it perform database queries, API calls, or file I/O?
3. **Binding complexity**: How many bindings and registrations does it make?
4. **Frequency**: How many times per request is this provider executed?

### Decision Tree
```
Profiling eager provider workload
├── Does boot() perform database queries, API calls, or file I/O?
│   ├── Yes → Heavy — move I/O to deferred or lazy service
│   └── No → Does register() + boot() take >0.5ms?
│       ├── Yes → Heavy — analyze and optimize
│       └── No → Does it register >20 bindings?
│           ├── Yes → Medium — consider if consolidation helps
│           └── No → Lightweight — acceptable
```

### Rationale
Eager providers execute on every request, so their workload directly impacts TTFB. I/O operations in `boot()` are the biggest offenders — database connections and API calls during provider boot multiply across every request. Pure binding registrations (class-to-class mappings) are fast. Heavy operations should be moved to deferred providers or lazy-loaded services.

### Default
Lightweight is the target. Anything >0.5ms or doing I/O needs optimization.

### Risks
- Heavy eager providers degrade every request's TTFB.
- Database queries in `boot()` open connections on every request even when not needed.
- Small provider costs accumulate linearly — 30 providers × 0.3ms each = 9ms.

### Related Rules/Skills
- Rule 1: Keep Eager Provider `register()` and `boot()` Methods Lightweight
- Skill: Audit and Optimize Eager Provider Overhead

---

## D03: Keep Eager vs Convert to Deferred

### Decision Context
You have identified an eager provider that is eligible for deferral. Should you convert it?

### Criteria
1. **Utilization**: On what percentage of routes are the provider's services resolved?
2. **First-use latency**: Is the slightly slower first resolution acceptable?
3. **Manifest management**: Are you willing to manage the deferred manifest (rebuild on changes)?
4. **Provider count**: How many total providers are there? (Manifest overhead is fixed cost.)

### Decision Tree
```
Eligible eager provider (no boot-time artifacts, no startup side effects)
├── Are services used on <30% of routes?
│   ├── Yes → Convert to deferred (significant savings)
│   └── No → Are services used on 30-70% of routes?
│       ├── Yes → Is bootstrap time a current pain point?
│       │   ├── Yes → Convert to deferred (marginal but cumulative savings)
│       │   └── No → Keep eager (simpler, no manifest management)
│       └── No (>70%) → Keep eager (deferred overhead > savings)
```

### Rationale
Deferred providers eliminate bootstrap overhead but add complexity. For low-utilization providers (<30%), the savings clearly justify the complexity. For medium-utilization providers (30-70%), the decision depends on whether bootstrap time is a current concern. For high-utilization providers (>70%), the manifest lookup and on-demand registration overhead exceeds the savings.

### Default
Keep eager unless utilization is <30% or bootstrap time is a known issue.

### Risks
- Converting a provider that is actually used on more routes than estimated.
- Forgetting to rebuild manifest after conversion.
- Introducing first-use latency spikes on critical request paths.

### Related Rules/Skills
- Rule 2: Prefer Deferred Providers for Services Used on Fewer Than 30% of Routes
- Rule 3: Always Verify Whether a Provider Is Eager or Deferred
- Skill: Implement a Deferred Provider
- Skill: Audit and Optimize Eager Provider Overhead

---

## D04: Consolidate vs Keep Separate

### Decision Context
You have multiple tiny eager providers in the same domain. Should you consolidate them into one provider?

### Criteria
1. **Individual overhead**: How much bootstrap time does each provider add?
2. **Domain cohesion**: Do the providers belong to the same business domain?
3. **Deferral eligibility**: Are all providers equally eligible/ineligible for deferral?
4. **Testability**: Will consolidation make testing harder?

### Decision Tree
```
Multiple tiny eager providers in the same domain
├── Each provider adds <0.1ms bootstrap time?
│   ├── Yes → Does each have the same deferral eligibility?
│   │   ├── Yes → Consolidate into single provider
│   │   └── No → Keep separate (different lifecycle characteristics)
│   └── No (some are heavier) → Can the heavy registrations be separated?
│       ├── Yes → Keep heavy ones separate, consolidate light ones
│       └── No → Keep as-is
```

### Rationale
Each provider, no matter how small, adds overhead: PHP class autoloading, constructor execution, and method dispatch. Consolidating 5 tiny providers into 1 saves 4× the provider overhead. However, if providers have different lifecycle characteristics (one must be eager, another can be deferred), they must remain separate to enable selective deferral.

### Default
Consolidate providers in the same domain with the same lifecycle characteristics.

### Risks
- Over-consolidation creates a God provider that's hard to test and reason about.
- Mixing eager and deferrable responsibilities in one provider forces everything to be eager.
- Losing the ability to selectively defer specific bindings.

### Related Rules/Skills
- Rule 4: Never Convert All Providers to Deferred for "Optimization"
- Rule 5: Profile Eager Provider Bootstrap Time Regularly
- Skill: Audit and Optimize Eager Provider Overhead
