# Accessor Patterns — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Accessor Patterns |
| Focus | Anti-patterns in accessor definition and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Accessor as Service Locator | Design | High |
| 2 | Side-Effect Accessor | Reliability | Critical |
| 3 | Implicit Authorization in Accessor | Security | Critical |
| 4 | Business Logic in Accessor | Code Organization | High |
| 5 | Uncached Expensive Accessor | Performance | Medium |
| 6 | Legacy Accessor Syntax in New Code | Framework Usage | Low |

## Repository-Wide Cross-Cutting Patterns

- Many teams treat accessors as a catch-all for any per-attribute transformation, conflating type coercion (casts), computed properties (accessors), and view formatting (presenters)
- The implicit invocation of accessors on every `->attribute` read makes them a common source of hidden side effects and performance problems
- Accessor anti-patterns frequently co-occur: a single accessor often violates multiple rules (e.g., business logic + side effects + service locator)

---

## 1. Accessor as Service Locator

### Category
Design

### Description
Calling `app()->make()`, `resolve()`, or any service container resolution inside an accessor closure. Accessors become implicitly coupled to framework bootstrapping and lose testability.

### Why It Happens
Developers find it convenient to resolve services inside the accessor rather than injecting them through the constructor or explicit method parameters. The short accessor syntax encourages inline resolution.

### Warning Signs
- Calls to `app()`, `resolve()`, `App::make()` inside an accessor closure
- Unit tests for the model that require bootstrapping the full service container
- Accessor cannot be tested by simply reading the attribute on a model instance

### Why Harmful
- Creates hidden coupling to the service container, making accessors untestable in isolation
- Violates dependency inversion principle — the accessor reaches out rather than receiving dependencies
- Every attribute read triggers container resolution, wasting resources

### Consequences
- Unit tests must bootstrap the framework (slow tests)
- Container resolution happens on every attribute read (performance overhead)
- Refactoring the resolved service requires changing every accessor that uses it

### Preferred Alternative
```php
// Explicit method with injection instead of accessor
public function resolveAvatarUrl(FileStorage $storage): string
{
    return $storage->url($this->avatar);
}
```

### Refactoring Strategy
1. Identify the service being resolved inside the accessor
2. Add an explicit method to the model that accepts the service as a parameter
3. Update callers to call the explicit method instead of reading the attribute
4. Remove the accessor or convert it to a pure formatting operation

### Detection Checklist
- [ ] Search for `app(`, `resolve(`, `app()->make(` in accessor closures
- [ ] Check test files — do accessor tests require `TestCase` bootstrapping?
- [ ] Review accessor return types — are they services or service-dependent objects?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Use Accessors as Service Locators |
| Skill | `06-skills.md` — Define a Cached Accessor (step 6 prohibition) |
| Decision Tree | `07-decision-trees.md` — Accessor vs Cast vs Presenter |

---

## 2. Side-Effect Accessor

### Category
Reliability

### Description
An accessor that writes to the database, dispatches jobs, sends emails, logs access, or performs any operation that changes system state. Accessors run implicitly on every attribute read, including during serialization, Blade rendering, and debugging sessions.

### Why It Happens
Developers see accessors as a convenient hook that fires automatically whenever an attribute is accessed. This seems useful for logging, tracking, or lazy initialization, but violates the principle of least surprise.

### Warning Signs
- Database queries in accessors that perform `UPDATE` or `INSERT` operations
- `dispatch()`, `Mail::send()`, `Log::info()` calls inside accessor closures
- Accessor that calls methods like `$this->save()`, `$this->update()`, `$this->increment()`
- Attribute reads causing observable side effects in application behavior

### Why Harmful
- Side effects execute unpredictably — serialization, Blade rendering, and `toArray()` all read attributes, triggering unintended operations
- Debugging becomes a nightmare when reading a model in `dd()` or `debugbar` triggers writes
- Race conditions and duplicate operations occur when the same accessor is read multiple times per request

### Consequences
- Duplicate email dispatches, job dispatches, or log entries per page load
- Accidental data modification during read-only API calls
- Performance degradation from hidden database writes
- Impossible to safely serialize models without triggering mutations

### Preferred Alternative
```php
// Explicit logging method instead of side-effect accessor
public function logAccess(): void
{
    Log::info('User profile accessed', ['user_id' => $this->id]);
    $this->timestamps = false;
    $this->update(['last_accessed_at' => now()]);
}
```

### Refactoring Strategy
1. Identify the side effect (DB write, dispatch, email, log)
2. Move it to an explicit method or event listener
3. Update controllers and jobs to call the explicit method where intentional
4. Remove the side effect from the accessor, keeping it as a pure transform

### Detection Checklist
- [ ] Search for `->save(`, `->update(`, `->dispatch(`, `Mail::`, `Log::` in accessor closures
- [ ] Check for `UPDATE` queries triggered by read operations in query logs
- [ ] Look for duplicate dispatches or emails that correlate with attribute reads

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Accessors Pure With No Side Effects |
| Knowledge | `04-standardized-knowledge.md` — Accessors are read-only transforms |
| Decision Tree | `07-decision-trees.md` — transformation without side effects vs operations |

---

## 3. Implicit Authorization in Accessor

### Category
Security

### Description
Checking user permissions, roles, or authorization gates inside an accessor to conditionally return masked or filtered attribute values. Accessors lack access to request context and run during serialization, making authorization invisible and unpredictable.

### Why It Happens
Developers want to protect sensitive data (SSN, email, internal notes) at the model level. An accessor that returns `***` for unauthorized users seems like a convenient enforcement point.

### Warning Signs
- `auth()->user()`, `auth()->check()`, `$request->user()` inside accessor closures
- Accessor that conditionally returns `null` or masked values based on user role
- `Gate::allows()`, `$this->authorize()` calls inside accessors
- Serialized output that varies depending on the authenticated user at serialization time

### Why Harmful
- Authorization has no request context during queue jobs, Artisan commands, or API resource serialization
- Serialized data (API JSON, cached responses) may contain protected data serialized in an authorized context and served to unauthorized users
- Impossible to reason about data exposure — the accessor's behavior depends on who reads the attribute and when
- Violates defense in depth by placing authorization at the wrong layer

### Consequences
- Security vulnerabilities from implicit access control during serialization
- Protected data leaked in API responses, job payloads, or cached views
- Authorization logic that cannot be audited (scattered across accessors instead of policies)

### Preferred Alternative
```php
// In policy
public function viewSsn(User $user, User $model): bool
{
    return $user->isAdmin();
}

// In controller
if ($request->user()->can('viewSsn', $user)) {
    return $user->ssn;
}
```

### Refactoring Strategy
1. Identify all accessors with conditional logic based on user context
2. Create or update Laravel Policies for the model
3. Move authorization checks to controller/policy layer
4. Make accessors return the full value unconditionally
5. Add API Resource classes that apply authorization at serialization time

### Detection Checklist
- [ ] Search for `auth()->`, `Gate::`, `$request->` in accessor closures
- [ ] Search for conditional `return` with `null` or masked values in accessors
- [ ] Compare accessor output in authenticated vs unauthenticated contexts
- [ ] Review `$appends` for accessors that expose sensitive computed data

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Never Perform Authorization in Accessors |
| Decision Tree | `07-decision-trees.md` — Accessor vs Cast vs Presenter (authorization context) |
| Knowledge | `04-standardized-knowledge.md` — Security considerations |

---

## 4. Business Logic in Accessor

### Category
Code Organization

### Description
Placing domain rules, business computations, or validation logic inside an accessor. The accessor is treated as a model-level computed property rather than a presentation transform, causing domain logic to execute on every attribute read.

### Why It Happens
Accessors look and behave like computed properties. When a value logically derives from stored attributes, developers reach for accessors without considering whether the computation is a business rule or a display concern.

### Warning Signs
- Accessor that applies discount rates, tax calculations, or pricing rules
- Accessor that checks model state (`$this->isVip()`, `$this->status === 'active'`) to determine business outcomes
- Accessor performing validation, eligibility checks, or scoring algorithms
- Unit tests for business logic that must boot a model instance

### Why Harmful
- Business rules execute transparently during serialization, Blade rendering, and API responses
- Cannot reuse business logic without going through the model (hard to extract to domain services)
- Logic scattered across accessors instead of centralized in domain methods or services
- Testing business logic requires model instantiation, slowing test suites

### Consequences
- Business rules hidden in accessors are missed during domain refactoring
- Serialization pipelines execute business logic unnecessarily
- Duplicated business rules when the same logic is needed outside of attribute reads
- Model classes grow bloated with implicit computations

### Preferred Alternative
```php
// Accessor handles formatting only
protected function discountPrice(): Attribute
{
    return Attribute::make(get: fn ($value) => number_format($value, 2));
}

// Business logic in explicit domain method
public function calculateDiscountedPrice(): Money
{
    return $this->isVip()
        ? $this->price->applyDiscount(0.8)
        : $this->price;
}
```

### Refactoring Strategy
1. Identify business rules embedded in accessor logic
2. Extract each rule to a domain method or service class
3. Keep the accessor only for lightweight formatting (number_format, concat, etc.)
4. Consider removing the accessor entirely if callers should use the domain method

### Detection Checklist
- [ ] Search for business keywords (discount, tax, eligibility, score, calculate) in accessors
- [ ] Check if the accessor calls other model methods that contain business logic
- [ ] Review whether the accessor value is used in persistence or validation decisions
- [ ] Assess if the accessor output depends on model state beyond raw attribute values

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Place Business Logic in Accessors |
| Knowledge | `04-standardized-knowledge.md` — Accessors should be pure functions |
| Decision Tree | `07-decision-trees.md` — Accessor vs Cast vs Presenter (computed vs business logic) |

---

## 5. Uncached Expensive Accessor

### Category
Performance

### Description
An accessor that performs expensive computation (database queries, API calls, complex string manipulation) without enabling `shouldCache: true`. The computation re-executes on every attribute read across Blade views, serialization, and loops.

### Why It Happens
The `shouldCache` option is easy to overlook. Developers test accessors in isolation (single read) and miss the repeated-read pattern common in views and API resources.

### Warning Signs
- Accessor that calls other models or performs DB queries
- Accessor with string formatting functions used in Blade `@foreach` loops
- Multiple identical queries in debug toolbar traced to a single accessor
- Slow page loads where the profiler shows repeated calls to the same accessor

### Why Harmful
- N+1 performance degradation applied to accessor computation instead of queries
- Blade layouts, partials, and API resources each trigger re-computation
- Uncached accessors scale poorly — doubling template reads doubles computation
- Profiling noise: the accessor cost is spread across template rendering rather than visible in the accessor itself

### Consequences
- Unnecessarily slow pages from repeated computation
- Hidden performance bottlenecks in template rendering pipelines
- CPU waste from recomputing stable values on each read
- Difficult to identify root cause — profiler shows many small calls rather than a single hotspot

### Preferred Alternative
```php
protected function summary(): Attribute
{
    return Attribute::make(
        get: fn ($value) => sprintf('%s - %s', $this->name, $this->formatExpensiveReport()),
        shouldCache: true
    );
}
```

### Refactoring Strategy
1. Enable `shouldCache: true` on the accessor definition
2. For legacy accessors (`get{Attr}Attribute()`), migrate to `Attribute::make()` with `shouldCache`
3. Verify the accessor output is stable per model instance (not dependent on mutable state or time)
4. For extremely expensive computations, consider replacing the accessor with an explicit method call

### Detection Checklist
- [ ] Review accessors without `shouldCache` for expensive operations
- [ ] Check debug toolbar for repeated identical queries during a single request
- [ ] Profile template rendering for repeated accessor invocations
- [ ] Search for DB query calls, API calls, or heavy computation in accessor closures

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Cache Expensive Accessor Computations |
| Skill | `06-skills.md` — Define a Cached Accessor (step 4) |
| Decision Tree | `07-decision-trees.md` — shouldCache decision branch |

---

## 6. Legacy Accessor Syntax in New Code

### Category
Framework Usage

### Description
Using the legacy `get{Attribute}Attribute()` naming convention for new accessors instead of the modern `Attribute::make(get: fn ($value) => ...)` API. This prevents caching, uses a deprecated pattern, and creates codebase inconsistency.

### Why It Happens
Developers familiar with older Laravel versions continue using the legacy syntax out of habit. Online tutorials and community code samples still show the legacy pattern. Teams lack a migration standard.

### Warning Signs
- `public function get{X}Attribute($value)` method definitions in new model code
- Accessor defined as a method with the `get..Attribute` naming convention
- Mixed usage of legacy and modern syntax within the same model class
- No `use Illuminate\Database\Eloquent\Casts\Attribute;` import in the model

### Why Harmful
- Legacy accessors cannot use `shouldCache` for performance optimization
- Deprecated API may be removed in future Laravel versions
- Codebase inconsistency makes it harder for new developers to learn the patterns
- Legacy accessors cannot be composed or chained like closure-based accessors

### Consequences
- No caching support for legacy accessors, leading to performance degradation
- Technical debt requiring migration effort later
- Inconsistent code style across the codebase
- Missed refactoring opportunities when touching legacy accessors during updates

### Preferred Alternative
```php
protected function name(): Attribute
{
    return Attribute::make(get: fn ($value) => ucfirst($value));
}
```

### Refactoring Strategy
1. Identify all legacy accessors using grep for `function get\w+Attribute`
2. Convert each to `Attribute::make()` with the same logic
3. Add `shouldCache: true` where appropriate
4. Enforce the modern syntax in code reviews and CI checks

### Detection Checklist
- [ ] Search for `function get\w+Attribute(` in model files
- [ ] Check new PRs for legacy accessor syntax in code review
- [ ] Verify `use Illuminate\Database\Eloquent\Casts\Attribute;` import exists
- [ ] Confirm all accessors use `Attribute::make(get: ...)` for new code

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Attribute::make Over Legacy Accessor Methods |
| Skill | `06-skills.md` — Define a Cached Accessor (step 2) |
| Decision Tree | `07-decision-trees.md` — Legacy vs Modern Accessor Syntax |
