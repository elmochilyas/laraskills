# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Incremental migration from MVC to layered architecture
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Migrating from Laravel's default MVC structure to a layered architecture (Clean/Hexagonal) is best done incrementally, not as a big-bang rewrite. The migration path follows a progression: start with services (extract business logic from controllers), then add actions (isolate operations), then introduce interfaces (decouple from framework), and finally restructure into layers (domain, application, infrastructure). Each step provides incremental benefit and can be stopped when the cost/benefit balance is met.

---

# Core Concepts

The migration has four phases:
1. **Controller thinning:** Extract business logic from controllers into Service classes. This is the lowest-cost, highest-value first step.
2. **Action isolation:** Break Services into single-purpose Action classes. This prevents god services and improves testability.
3. **Interface introduction:** Add interfaces for services/repositories where variation exists or is anticipated. This enables dependency inversion.
4. **Full restructuring:** Move code into Domain/Application/Infrastructure directories with strict dependency rules. This is the highest-cost, highest-value step.

---

# Mental Models

**The "Strangler Fig" model:** New code goes into the new structure. Old code stays in the old structure. Gradually, the new structure "strangles" the old one. At any point, you can stop and both structures coexist.

**The "Blue/Green Code" model:** Blue code is the old MVC structure. Green code is the new layered structure. Green grows over time. You don't need to convert all blue to green at once.

**The "Incremental Benefit Gate" model:** Each phase provides standalone benefit. Phase 1 (services) improves testability. Phase 2 (actions) prevents god objects. Phase 3 (interfaces) enables mocking. Phase 4 (layers) provides framework independence. Stop when the next phase's cost exceeds its benefit.

---

# Internal Mechanics

**Phase 1 - Extract Services:**
```php
// Before
class UserController {
    public function store(Request $request) {
        $user = User::create($request->validated());
        Mail::to($user)->send(new WelcomeMail($user));
        return redirect()->route('users.show', $user);
    }
}
// After
class UserController {
    public function __construct(private UserRegistrationService $service) {}
    public function store(StoreUserRequest $request) {
        $user = $this->service->register($request->validated());
        return redirect()->route('users.show', $user);
    }
}
```

**Phase 2 - Extract Actions:**
```php
class UserRegistrationService {
    public function register(array $data): User {
        return app(CreateUserAction::class)->execute($data);
        // plus notifications, etc.
    }
}
```

**Phase 3 - Introduce Interfaces:**
```php
interface UserRepository { ... }
class EloquentUserRepository implements UserRepository { ... }
```

**Phase 4 - Restructure into layers:**
Move files to `Domain/`, `Application/`, `Infrastructure/`, `Presentation/`.

---

# Patterns

**Parallel structure:** Keep the old `app/` directory and add `src/Domain/`, `src/Application/`, `src/Infrastructure/`. Both PSR-4 roots work simultaneously.

**Adapters as glue:** Write adapter classes that bridge old Laravel-idiomatic code to new layer-architected code. The adapter calls the old service from the new use case.

**Feature-by-feature migration:** Migrate one feature at a time. Don't attempt to restructure the entire codebase. Each feature gets converted when it's touched for new development.

---

# Architectural Decisions

**Stop after Phase 1 when:** The primary pain is fat controllers. Service classes solve this without introducing complex abstractions.

**Stop after Phase 2 when:** Service classes are growing into god objects. Action classes prevent this while keeping the structure simple.

**Stop after Phase 3 when:** Testing requires mocking data access. Interfaces provide this without full layer restructuring.

**Proceed to Phase 4 when:** Business logic is genuinely complex, framework independence adds value, and the team has the maturity to maintain strict layering.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Incremental benefit at each phase | Migration takes months to complete | Team must maintain both structures during transition |
| No big-bang rewrite needed | Inconsistent architecture during migration | Some features are layered, others are MVC |
| Stop at any phase | Partial migration may never complete | The 80/20 rule: last 20% of migration is hardest |
| Risk is contained per feature | Architectural drift between old and new | Old features degrade while new ones get the benefit |

---

# Performance Considerations

During migration, the coexistence of two structures (old Eloquent-model-heavy and new domain-entity-mapped) means the application has two patterns. Performance characteristics differ: old pattern is faster to write, new pattern has mapping overhead.

---

# Production Considerations

During migration, document the current migration phase prominently. New developers should know which parts of the application use which architecture.

Automation helps: architectural tests should only enforce on the migrated directories. The old `app/` directory has relaxed rules.

---

# Common Mistakes

**Big-bang rewrite:** Trying to migrate everything at once. The application is broken for weeks, features are blocked, and the risk of regression is enormous.

**Deciding Phase 4 on day one:** Committing to full Clean Architecture before experiencing the pain that justifies it. Often results in over-engineering.

**Inconsistent enforcement:** Allowing old-pattern violations in new directories because "it's just this one time." New layers must be strictly enforced from the start.

---

# Failure Modes

**Permanent half-migration:** The application stays at Phase 2 forever because Phase 3/4 cost is never justified. This is acceptable if recognized as the intentional stopping point.

**Architecture lip service:** Directories are renamed to `Domain/` but code still imports Eloquent everywhere. The structure says Clean Architecture, the code says MVC. Enforcement was skipped.

---

# Ecosystem Usage

The `laravel-ddd-toolkit` package provides commands to scaffold layered files incrementally. Modulate's `--layered` flag creates layer directories. Several community articles document the "From MVC to Hexagonal" migration path in Laravel.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-01 Three-layer architecture | LAP-14 Clean Architecture tradeoffs | AEG-09 Refactoring remediation |
| LAP-02 Clean Architecture | SLP-03 Controller thinning | DBC-08 Evolutionary boundaries |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche—most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
