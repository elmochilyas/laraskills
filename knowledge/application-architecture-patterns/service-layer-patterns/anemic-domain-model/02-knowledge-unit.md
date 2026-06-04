# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Avoiding anemic domain model in service-layer architectures
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Anemic Domain Model (Martin Fowler's anti-pattern) occurs when domain logic lives in service classes while the model classes are property bags with getters and setters. `User` has `getName()`/`setName()` but no `register()`/`activate()`/`changePassword()` methods. The business logic is in `UserService`, not `User`. This is the natural tendency of service-layer architectures: developers put behavior in services because it's the designated "logic" place, creating anemic models that don't protect their own invariants.

---

# Core Concepts

**Anemic Domain Model:**
```php
class User extends Model {
    // Only getters, setters, relationships
    protected $fillable = ['name', 'email', 'password', 'status'];
}

class UserService {
    public function register(array $data): User {
        // All business logic here
        $user = User::create($data);
        // Business logic that should be on User
    }
    public function activate(User $user): void {
        $user->update(['status' => 'active', 'activated_at' => now()]);
        // Business logic that should be on User
    }
}
```

**Rich Domain Model:**
```php
class User extends Model {
    public function register(array $data): self { ... }
    public function activate(): void {
        if ($this->status !== 'pending') {
            throw new \DomainException('Only pending users can be activated');
        }
        $this->status = 'active';
        $this->activated_at = now();
    }
}

class UserService {
    public function activate(User $user): void {
        $user->activate();  // Domain logic on the model
        $user->save();
        event(new UserActivated($user));
    }
}
```

---

# Mental Models

**The "Where does the rule live?" model:** Ask for every business rule: "Does this belong on the model or the service?" Rules about the entity's state belong on the entity. Rules about workflows belong in services.

**The "Self-Protecting Model" model:** A model should protect its own invariants. `User::activate()` should throw if the user is already active. The service shouldn't check `if ($user->status !== 'pending')`.

**The "Service as Orchestrator, Model as Domain Expert" model:** Services know the workflow (which steps, in what order). Models know the rules (what states are valid, what transitions are allowed).

---

# Internal Mechanics

**Signs of anemic domain model:**
- Models have `$fillable` or `$guarded` with all attributes
- Models have no methods beyond relationships and scopes
- Service methods contain `if` statements checking model state
- Service methods call `$model->update()` with raw arrays
- Model state changes are made directly by the service, not through model methods

---

# Patterns

**Tell, Don't Ask:** Instead of asking the model for its state and making decisions in the service, tell the model to do something and let it enforce rules:
```php
// Anemic
if ($invoice->status === 'pending') {
    $invoice->update(['status' => 'paid', 'paid_at' => now()]);
}
// Rich
$invoice->markAsPaid();
```

**Encapsulated state changes:** Model methods encapsulate state mutations:
```php
class Invoice extends Model {
    public function markAsPaid(): void {
        if ($this->status !== 'pending') {
            throw new InvoiceAlreadyPaidException();
        }
        $this->status = 'paid';
        $this->paid_at = now();
    }
}
```

**Service orchestrates, Model enforces:** The service decides the workflow; the model enforces its own rules.

---

# Architectural Decisions

**Add behavior to models first:** When implementing a new feature, add the behavior method to the model first. The service then calls the model method. Only extract to domain services if the behavior spans multiple models.

**Service methods should be thin:** A service method that calls 3 model methods and dispatches 2 events is fine. A service method with 30 lines of `if` statements checking model state is a sign of an anemic model.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Business rules are colocated with data | Models become larger | More methods on model classes |
| Invariants are enforced in one place | Eloquent models are already coupled to DB | Rich domain on Eloquent model isn't Clean Architecture |
| Easier to find business rules | Rich models may duplicate DB schema | Both model attributes and business logic on same class |

---

# Performance Considerations

Rich domain models have no performance cost. Method calls on models are the same as method calls on services.

---

# Production Considerations

Code review is the primary defense against anemic models. Reviewers should flag service methods that contain `if` statements checking model state.

---

# Common Mistakes

**All logic in services:** The most common pattern in service-layer architectures. Every business rule ends up in `UserService::method()` with `$user->update(['status' => ...])`.

**Rich models that still require services for state checks:** A model has `activate()` but the service still checks `if ($user->canBeActivated())` before calling it. Duplicate logic.

**Anemic models + controller logic:** The worst case: business rules in controllers, anemic models, and services as pass-through. Architecture has degraded completely.

---

# Failure Modes

**Logic duplication:** The model's `activate()` checks `status !== 'pending'`. The service also checks `status !== 'pending'` before calling `activate()`. Two sources of truth.

**Inconsistent enforcement:** Some services call `$model->activate()` (correct), others directly set `$model->status = 'active'` (bypassing the rule). The model can't protect itself from external direct state manipulation.

---

# Ecosystem

Fowler's original article (2003) coined the term. Laravel's Eloquent models naturally tend toward anemic because Eloquent encourages property bags with `$fillable`. Conscious effort is needed to add behavior to models.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-01 Service classes | LAP-05 Domain layer | LAP-09 Framework independence |
| SLP-10 Decision criteria | LAP-10 Domain entity mapping | DBC-01 Bounded context |

---

## Ecosystem Usage



---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
