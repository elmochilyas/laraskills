# Phase 5: Action Naming Conventions Rules

---

## Rule: Choose One Naming Convention and Apply It Consistently

---

## Category

Maintainability

---

## Rule

All action classes in the codebase must follow exactly one naming convention — VerbNoun (`CreateOrder`), NounVerb (`OrderCreate`), VerbNoun+ActionSuffix (`CreateOrderAction`), or DescriptiveMethod (`CreateTeam` with `create()`). Mixed conventions within the same action directory are forbidden.

---

## Reason

Consistency is more important than which specific convention is chosen. A developer should be able to predict the name of any action in the codebase without searching. Mixed conventions force developers to guess the naming pattern for every new action they encounter, creating cognitive friction in every interaction with the action directory.

---

## Bad Example

```
app/Actions/
├── CreateOrder        // VerbNoun
├── UserUpdate         // NounVerb
├── DeleteUserAction   // VerbNoun + ActionSuffix
└── TeamCreate         // NounVerb (different entity)
```

---

## Good Example

```
app/Actions/
├── CreateOrder
├── UpdateOrder
├── CancelOrder
├── CreateUser
├── UpdateUser
└── DeleteUser
```

---

## Exceptions

Teams using domain subdirectories may use a different naming convention per subdirectory only if the convention difference is explicitly documented and the subdirectories represent distinct bounded contexts with separate teams. For single-team codebases, one convention across all actions is mandatory.

---

## Consequences Of Violation

Maintenance risks: developers cannot predict action names, slowing navigation and encouraging duplication. Code Organization risks: the action directory becomes chaotic, reducing confidence in the codebase's structure. Cognitive load increases with every action interaction.

---

---

## Rule: Use Domain Subdirectories Before Changing Naming Conventions

---

## Category

Code Organization

---

## Rule

When an action directory exceeds 20 files, add domain subdirectories (`App\Actions\{Domain}\`) rather than switching to a different naming convention. Do not rename existing actions to a new convention until domain subdirectories have been evaluated as the solution.

---

## Reason

Changing naming conventions requires renaming every existing action, all import references, all test files, and all documentation — a project-wide breaking change. Domain subdirectories solve the same navigation problem (grouping related actions) without renaming a single file. They are additive, not reductive, and can be introduced incrementally.

---

## Bad Example

```php
// Team switches from VerbNoun to NounVerb at 50+ actions:
// Rename CreateOrder → OrderCreate
// Rename CreateUser → UserCreate
// Rename CancelOrder → OrderCancel
// ... 47 more renames, all breaking changes
```

---

## Good Example

```php
// Team adds domain subdirectories instead:
app/Actions/
├── Order/
│   ├── CreateOrder.php
│   ├── CancelOrder.php
│   └── RefundOrder.php
├── User/
│   ├── CreateUser.php
│   ├── UpdateUser.php
│   └── DeleteUser.php
└── Billing/
    ├── GenerateInvoice.php
    └── ProcessRefund.php
// No renames needed — subdirectories added alongside existing structure
```

---

## Exceptions

If the current naming convention actively causes name collisions across domains (e.g., two `CreateOrder` in different bounded contexts), domain subdirectories plus a naming convention change may both be necessary. Execute the subdirectory extraction first, then rename within each subdirectory.

---

## Consequences Of Violation

Scalability risks: renaming 50+ actions is a multi-day refactor with high risk of missed references. Maintenance risks: branching conflicts when multiple developers rename different actions simultaneously. Code Review risks: rename-only diffs are difficult to review and often contain accidental changes.

---

---

## Rule: Match Method Name to Class Intent

---

## Category

Design

---

## Rule

The action class's public method name must either be a generic standard (`handle`, `execute`) or match the class's verb intent (`create`, `update`). Method names that conflict with or are unrelated to the class name are forbidden.

---

## Reason

A method name that conflicts with the class intent creates confusion — the developer must reconcile the class name's implied action with the different method name. A `CreateOrder` class with a method named `process()` forces developers to mentally map "process" to "create." Consistent naming reduces cognitive overhead and makes the class's purpose obvious.

---

## Bad Example

```php
class CreateOrder
{
    // "Create" implies creation, but method is named "process":
    public function process(array $data): Order { /* ... */ }
}

class CancelOrder
{
    // "Cancel" implies cancellation, but method is named "handle" for no reason:
    public function handle(int $id): void { /* ... */ }
}
```

---

## Good Example

```php
class CreateOrder
{
    // Method name matches class intent:
    public function handle(OrderData $data): Order
    {
        // handle() is generic — class name carries the specific intent
    }
}

// Alternative approach — method name reinforces class intent:
class CreateOrder
{
    public function create(OrderData $data): Order { /* ... */ }
}
```

---

## Exceptions

If the team standardizes on one generic method name (`handle` or `execute`) for all actions, the method name will not match every class intent individually — but the consistency across all actions compensates for the mismatch. This is the recommended approach for teams using Spatie's QueueableAction.

---

## Consequences Of Violation

Cognitive load: developers must remember the non-obvious method name for each action. Maintenance risks: inconsistent method naming prevents generic action invocation patterns. Code Review risks: method names become a recurring discussion point in reviews.

---

---

## Rule: Document the Naming Convention Decision Explicitly

---

## Category

Maintainability

---

## Rule

Every project using the action pattern must document the chosen naming convention in a project-level architecture decision record or conventions guide. The documentation must state which convention is used, why it was chosen, and under what conditions it might change.

---

## Reason

New team members should not have to infer the naming convention from existing code. Without explicit documentation, conventions drift as different developers interpret the "implied convention" differently. Written documentation provides a single source of truth that can be referenced during code review and onboarding.

---

## Bad Example

```php
// No documentation — convention is "just follow what's in app/Actions/"
// New developer sees CreateOrder and writes UserUpdate (NounVerb)
// Next developer sees both and is unsure which to follow
```

---

## Good Example

```php
// docs/architecture/action-naming-convention.md:
/*
# Action Naming Convention

Chosen convention: VerbNoun (e.g., `CreateOrder`, `CancelOrder`)
Reason: The team thinks in terms of operations.
Exceptions: None currently.
Change criteria: If we exceed 100 actions, we will add domain subdirectories
  before considering a naming convention change.
*/
```

---

## Exceptions

Solo developer projects may skip formal documentation if the single developer is the only consumer. As soon as a second developer joins, the convention must be documented.

---

## Consequences Of Violation

Code Organization risks: conventions drift silently as the team grows. Onboarding friction: new developers waste time inferring conventions from existing code. Code Review risks: every pull request re-litigates naming conventions because there is no authoritative reference.

---

---

## Rule: Prefer VerbNoun as Default, Switch to NounVerb Only for Entity-Heavy Domains

---

## Category

Code Organization

---

## Rule

New projects must default to the VerbNoun convention (`CreateOrder`, `UpdateUser`). Teams may switch to NounVerb (`OrderCreate`, `UserUpdate`) only when the domain is entity-heavy and the primary navigation pattern is entity-first discovery.

---

## Reason

VerbNoun is the most common convention in the Laravel ecosystem, follows natural English reading order, and is supported by Jetstream, Spatie examples, and most Laravel training materials. NounVerb is a specialization for domains where entity grouping is more valuable than operation grouping — but it reads less naturally and requires consistent application to provide value.

---

## Bad Example

```php
// Generic CRUD app using NounVerb:
class OrderCreate { /* ... */ }
class OrderRead { /* ... */ }
class OrderUpdate { /* ... */ }
class UserCreate { /* ... */ }
class UserRead { /* ... */ }

// Each entity adds "Verb" which reads unnaturally for CRUD operations
// "OrderCreate" vs the natural "CreateOrder"
```

---

## Good Example

```php
// Default VerbNoun for CRUD-heavy apps:
class CreateOrder { /* ... */ }
class CreateUser { /* ... */ }
class UpdateUser { /* ... */ }

// Switch to NounVerb for entity-heavy domains (e.g., healthcare):
class PatientAdmit { /* ... */ }
class PatientDischarge { /* ... */ }
class PatientTransfer { /* ... */ }
class InsuranceClaim { /* ... */ }
class InsuranceVerify { /* ... */ }
```

---

## Exceptions

Teams adopting Jetstream's conventions should use Jetstream's pattern (DescriptiveMethod: class `CreateTeam`, method `create()`), which is a third alternative that does not require choosing between VerbNoun and NounVerb.

---

## Consequences Of Violation

Code Organization risks: NounVerb applied to operation-heavy domains scatters read operations across entity names. Navigation friction: entity-first naming in an operation-first mental model makes actions harder to find.

---

---

## Rule: Use ActionSuffix Only When Necessary to Avoid Name Collisions

---

## Category

Code Organization

---

## Rule

The `Action` suffix (`CreateOrderAction`) must be used only when actions coexist in the same namespace as other class types (models, DTOs, jobs) with potential name collisions, or when the codebase has multiple teams requiring unambiguous type identification in imports. Otherwise, omit the suffix.

---

## Reason

The `App\Actions` namespace already provides unambiguous context — a class in `App\Actions\CreateOrder` is clearly an action. Adding `Action` suffix to every file creates longer class names, longer import statements, and more typing with no benefit. The tradeoff only pays off when the action is referenced alongside other class types in a shared namespace.

---

## Bad Example

```php
// No naming collision — suffix is redundant ceremony:
namespace App\Actions;

class CreateUserAction
{
    // "Action" suffix is redundant with the "App\Actions" namespace
}
```

---

## Good Example

```php
// No suffix needed — namespace provides the context:
namespace App\Actions;

class CreateUser
{
    // Clean, shorter, unambiguous
}

// Suffix needed when actions share a namespace with other types:
namespace App\Domain\User;

class CreateUserAction {}    // Action
class CreateUserData {}      // DTO
class CreateUserJob {}       // Job
class User extends Model {}  // Model
```

---

## Exceptions

Open-source packages and shared libraries should use the Action suffix because consumers may import actions alongside other class types from the same vendor namespace. Teams that prefer explicit type identification in import statements may also use the suffix consistently — but this must be a team-wide convention, not an ad hoc choice.

---

## Consequences Of Violation

Maintenance risks: inconsistent suffix usage creates a mix of `CreateUser` and `CreateUserAction` in the same codebase. Code Organization risks: the worst case is partial suffix usage — some actions have it, others do not, and there is no way to predict which.

---
