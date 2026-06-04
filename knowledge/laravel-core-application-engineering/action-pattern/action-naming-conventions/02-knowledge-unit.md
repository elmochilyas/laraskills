# Action Naming Conventions

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Actions Pattern
- **Knowledge Unit:** Action Naming Conventions
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Action naming conventions determine how developers find, identify, and reason about single-operation classes across a codebase. Unlike service naming (which follows entity-oriented conventions like `UserService`), action naming has no single standard — the community has four competing conventions with different tradeoffs for navigation, discoverability, and cognitive load.

The engineering significance is that naming conventions directly affect codebase scalability. A convention that works for 10 actions (flat file listing, natural verb-noun order) breaks at 100 actions (alphabetical scattering, naming collisions, file overload). The right convention depends on team size, action count, and navigation preferences — not on any inherent "correct" naming schema.

---

## Core Concepts

### The Four Naming Conventions

**1. VerbNoun (most common)**
`CreateOrder`, `UpdateUser`, `DeleteProduct`, `PublishPost`, `ArchiveArticle`
- Action reads as a natural English command
- Files sort by verb: all "Create" actions cluster alphabetically
- Verb-noun clustering: useful when scanning "what creation operations exist?" — less useful for "what operations exist on Order?"

**2. NounVerb / ResourceVerb**
`OrderCreate`, `UserUpdate`, `ProductDelete`, `PostPublish`, `ArticleArchive`
- Files sort by resource: all "Order" operations cluster alphabetically
- Noun-first clustering: useful when working on one entity across multiple operations — all Order-related actions are adjacent
- Less natural English reading

**3. VerbNoun + ActionSuffix**
`CreateOrderAction`, `UpdateUserAction`, `PublishPostAction`
- Explicit suffix signals the class is an action — eliminates ambiguity with models, DTOs, or value objects
- Redundant with namespace (`App\Actions\CreateOrderAction` — both the path and the name say "action")
- Slightly longer import statements and class names

**4. VerbNoun (descriptive method name)**
Class `CreateUser`, method `create()`. Class `UpdateTeamName`, method `update()`.
- Jetstream convention — the class name is the action identity; the method name describes the operation
- Enables method polymorphism: `create()` returns different types across different action classes
- Adds indirection — caller must know both the class and the method

### The Semantic Units of Action Names
Every action name contains three semantic units:

| Unit | Example | Purpose |
|------|---------|---------|
| Verb | `Create`, `Publish`, `Archive` | The operation |
| Noun | `Order`, `Post`, `User` | The subject |
| Qualifier | `Action`, (suffix) | The type marker |

The convention determines the order of these units and whether the qualifier is included.

---

## Mental Models

### Action Name as File Path in a Flat Directory
In a flat `app/Actions/` directory, the class name IS the file path. A developer finding `CreateOrder` in a file listing knows the operation immediately. A developer finding `OrderCreate` in a file listing knows the subject immediately. The convention choice determines which axis of discovery is optimized: operation-first (VerbNoun) or subject-first (NounVerb).

### Action Name as Documentation
The class name is the first documentation a developer encounters. `ProcessRefundAction` communicates more context than `RefundProcessor` or `Refund` because it combines the verb (Process), noun (Refund), and type (Action). A good action name eliminates the need for most comments about purpose.

### Jetstream's Descriptive Method Names
Jetstream uses domain-specific method names that describe what the action does with the input: `create(User $user, array $input)`, `update(User $user, array $input)`, `delete(User $user)`. The method name is a second semantic layer — the class says "what," the method says "how." This adds a dimension of expressiveness at the cost of one more thing to remember.

---

## Internal Mechanics

### Autoloading Impact
The naming convention has zero impact on autoloading. Composer's PSR-4 autoloader maps namespace to directory and class name to file name. `App\Actions\CreateOrder` maps to `app/Actions/CreateOrder.php`. `App\Actions\OrderCreate` maps to `app/Actions/OrderCreate.php`. The convention affects the file path but not the resolution speed.

### IDE Alphabetical Sorting
When navigating `app/Actions/` in an IDE or editor:

- **VerbNoun**: Files sorted: `ArchiveArticle`, `CreateOrder`, `DeleteProduct`, `PublishPost`, `UpdateUser`. If a developer is looking for all operations on "Order," they must scan the entire list because "Order" appears at the end of each name.
- **NounVerb**: Files sorted: `ArticleArchive`, `OrderCreate`, `PostPublish`, `ProductDelete`, `UserUpdate`. If a developer is looking for all operations on "Order," they find them adjacent because "Order" appears at the start.
- **ActionSuffix**: Same as VerbNoun but with a longer name: `CreateOrderAction`, `UpdateUserAction`.

### Git History Grouping
Renaming an action changes its class name, file name, and git history. **VerbNoun to NounVerb migration is a breaking rename** — all imports, route references, and test references must update. The naming decision is expensive to reverse at scale.

---

## Patterns

### Domain Subdirectory Pattern
Rather than relying on class name ordering, use subdirectories per domain:

```
app/Actions/
├── User/
│   ├── CreateUser.php
│   ├── UpdateUser.php
│   ├── SuspendUser.php
│   └── SendPasswordReset.php
├── Order/
│   ├── CreateOrder.php
│   ├── CancelOrder.php
│   ├── RefundOrder.php
│   └── ShipOrder.php
└── Billing/
    ├── ProcessPayment.php
    ├── GenerateInvoice.php
    └── ApplyDiscount.php
```

- **Purpose**: Organize actions by domain without relying on class name ordering.
- **Benefits**: Domain boundaries are explicit; file count per directory stays manageable; teams can own domains.
- **Tradeoffs**: Requires an additional namespace segment; actions shared across domains must be placed carefully.

### Verb-Noun with Suffix Pattern
`CreateOrderAction`, `UpdateUserAction`, `PublishPostAction`

- **Purpose**: Eliminate ambiguity with other classes in the same namespace — a `CreateOrder` could be a command, a request, or a job; `CreateOrderAction` is unambiguous.
- **Benefits**: Explicit type identification; no collision risk with models or DTOs; grep-friendly.
- **Tradeoffs**: Longer class names; redundant with namespace.

### Descriptive Method Name Pattern (Jetstream)
Class name is the entity operation, method name is the action:

```php
class CreateTeam { public function create(User $user, array $input): Team {} }
class UpdateTeamName { public function update(User $user, array $input): Team {} }
class DeleteTeam { public function delete(User $user): void {} }
```

- **Purpose**: Use the method name to express the operation variant — `create()`, `update()`, `delete()` rather than a generic `handle()` or `execute()`.
- **Benefits**: Method name tells the reader how the action is applied; consistent across all actions (`create()` in CreateTeam, `create()` in CreateUser).
- **Tradeoffs**: Caller must remember the method name; method names cannot be resolved by convention (no automatic `->handle()` call).

---

## Architectural Decisions

### VerbNoun vs NounVerb
The choice between VerbNoun and NounVerb is a choice about which axis of discovery to optimize:

- **Choose VerbNoun** when the team thinks in terms of operations: "I need to create something" → search for "Create*". Common in CRUD-heavy applications where the verb is the primary action unit.
- **Choose NounVerb** when the team thinks in terms of entities: "I need to do something with Orders" → find all "Order*" actions. Common in domain-heavy applications where the entity is the primary action unit.

### ActionSuffix Decision
The `Action` suffix provides one concrete benefit: eliminating ambiguity. In a codebase that has `App\Actions\CreateOrder` and `App\DTOs\CreateOrder`, the suffix disambiguates. In a codebase with a clean namespace structure (`App\Actions\` is actions only), the suffix is redundant.

### Jetstream vs Community Convention
Jetstream uses VerbNoun with descriptive method names. This is significant as an official framework convention, but Jetstream's action count is small (10-15 actions) and bounded. At Jetstream's scale, VerbNoun without subdirectories works. At 50+ actions, subdirectories become necessary regardless of naming convention.

---

## Tradeoffs

| Convention | Benefit | Cost | Best At |
|-----------|---------|------|---------|
| VerbNoun | Natural English, easy imports | Alphabetical scatter by entity | < 30 actions, operation-first thinking |
| NounVerb | Entity adjacency, easy entity scan | Unnatural English, harder imports | Entity-heavy domains |
| VerbNoun+ActionSuffix | Unambiguous type identification | Verbose names, redundant with namespace | Large teams, multi-contributor OSS |
| Descriptive Method | Expressive method names, polymorphic calls | Must remember method names (not standardized) | Jetstream-style bounded action sets |

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain subdirectories provide natural grouping | Extra directory layer per action | Standard practice at 50+ actions; unnecessary at < 20 |
| Flat directory is simple to navigate at low volume | Becomes unmanageable at high volume | Add subdirectories when any directory exceeds 20 actions |
| ActionSuffix eliminates naming collisions | Longer class names, redundant with path | Use when actions coexist with other class types in the same folder |

---

## Performance Considerations

### No Performance Impact
Naming convention has zero impact on runtime performance. Class names are resolved via autoloading, which is cached by OpCache. The length of the class name, the presence of a suffix, and the ordering of semantic units do not affect execution speed.

### IDE Performance
At extreme scale (500+ actions in a flat directory), IDE file listings and autocomplete may slow down. The solution is subdirectories per domain, not a naming convention change.

---

## Production Considerations

### Enforce by Convention, Not by Tooling
Action naming should be documented in the team's coding standards and enforced in code review. Automated naming enforcement (PHPCS or PHPStan rules) is possible but unusual — most teams do not lint for action naming.

### Migration Cost
Changing from VerbNoun to NounVerb (or vice versa) after 50+ actions exist requires renames of every class, import, and test reference. This is a project-wide refactor best done in a single commit or not at all.

### The Critical Rule: Be Consistent
The most harmful naming anti-pattern is a mix of conventions within the same codebase. A codebase with `CreateOrder`, `UserUpdate`, and `CancelOrderAction` in the same directory creates cognitive chaos — developers can never predict the name of an action they haven't seen. Consistency across the entire action directory is more important than which specific convention is chosen.

### Jetstream Compatibility
Applications that use Jetstream scaffolding inherit Jetstream's naming convention (`VerbNoun` + `create()`, `update()` methods). Teams extending Jetstream actions should maintain the same convention for consistency. Teams building their own actions independently of Jetstream can choose any convention.

---

## Common Mistakes

### Verb-Noun for Read Operations
Read operations (`Get`, `Show`, `Find`, `List`) create a cluster under "G," "S," "F," "L" in VerbNoun ordering. A `GetOrder`, `ShowOrder`, `FindOrder`, `ListOrders` pattern scatters read operations. NounVerb (`OrderGet`, `OrderShow`, `OrderFind`, `OrderList`) keeps read operations adjacent to write operations on the same entity.

### ActionSuffix Inconsistency
Some actions named `CreateOrder`, others named `DeleteOrderAction` — the inconsistency is worse than either choice. If the team decides on ActionSuffix, all actions must use it. If the team decides against it, no actions should use it.

### Method Name Mismatch with Class Name
An action class `CreateOrder` whose method is named `process()` instead of `create()` or `handle()` creates confusion — the class says one thing, the method says another. The method name should either be the generic `handle()` (consistent across all actions) or descriptive `create()` (matches the class intent).

---

## Failure Modes

### Action Name Collision
Without a subdirectory structure, two domains can produce colliding action names: `App\Actions\CreateOrder` (e-commerce) and `App\Actions\CreateOrder` (purchase orders). The collision is resolved by renaming or subdirectories. Domain subdirectories (`App\Actions\Ecommerce\CreateOrder`, `App\Actions\Purchasing\CreateOrder`) prevent the collision.

### IDE Navigation Failure
In a flat directory with 200+ actions, a developer searching for "the action that sends welcome emails" cannot guess the name — is it `SendWelcomeEmail`, `SendWelcomeEmailAction`, `SendEmailWelcome`, `EmailWelcomeSend`? Without consistent naming, IDE search becomes guesswork.

### Grep Failure for Cross-Cutting Changes
When a model named `Order` is renamed to `Purchase`, every action with "Order" in its name must be refactored. With VerbNoun, `CreateOrderAction`, `CancelOrderAction`, `ShipOrderAction` are easily found via grep. With NounVerb, `OrderCreateAction`, `OrderCancelAction`, `OrderShipAction` are equally grep-friendly. The grep consistency is the same — what matters is that all actions follow the same pattern.

---

## Ecosystem Usage

### Laravel Jetstream
**Pattern**: VerbNoun, no suffix, descriptive method names.
`CreateTeam`, `UpdateTeamName`, `DeleteTeam`, `AddTeamMember`, `RemoveTeamMember`
Methods: `create()`, `update()`, `delete()`, `add()`, `remove()`.
Directory: `app/Actions/Jetstream/`

### Spatie Open Source Packages
**Pattern**: VerbNoun + ActionSuffix, `execute()` method.
`AddViewAction`, `CreateContractAction`, `GeneratePdfAction`, `ProcessWebhookAction`.
Directory: package-specific.

### Lorisleiva Laravel Actions
**Pattern**: VerbNoun, no suffix, domain subdirectories. `handle()` method.
`app/Actions/User/CreateNewUser`, `app/Actions/User/UpdateUserDetails`.
Lorisleiva argues the namespace communicates the category — no suffix needed.

### Monica CRM
**Pattern**: Mixed — predominantly VerbNoun with ActionSuffix for standalone operations, service methods for entity operations.
Directory: `app/Actions/` with domain subdirectories.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — the structural context for naming; understanding what an action is informs how it should be named

### Related Topics
- Action Composition — how action names affect readability in orchestration code
- Directory Conventions — how `app/Actions/` subdirectory structure complements naming conventions

### Advanced Follow-up Topics
- Action vs Service vs Use Case — how naming patterns differ across the three organizational patterns
- Feature-based Structure — how action names interact with feature-based (domain) directory layouts

---

## Research Notes

- Jetstream's descriptive method pattern (`create()`, `update()`) is unique among the major conventions. Most community conventions use `handle()` or `execute()`. Jetstream's choice is not widely adopted outside of Jetstream-scaffolded projects.
- The VerbNoun vs NounVerb debate has no resolution because both optimize different discovery axes. The absence of a winner suggests that subdirectories (which solve the same problem differently) are the practical answer.
- The ActionSuffix debate is similarly unresolved. Spatie uses it consistently. Lorisleiva argues against it. Jetstream does not use it. The choice correlates with naming collision risk in the codebase.
- Action method name auto-detection (Spatie's `queueMethod()`) creates a subtle constraint: teams that prefer `handle()` must override the detection. This biases new Spatie users toward `execute()` or `__invoke()`.
- At large scale (100+ actions), domain subdirectories are effectively mandatory regardless of naming convention. The naming convention becomes secondary to the directory structure at that scale.