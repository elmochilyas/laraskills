## Default To Service Plus Action For Most Laravel Applications
---
## Architecture
---
## Rule
Default to the Service + Action combination for most Laravel applications. Services coordinate workflows and manage transactions. Actions execute single leaf-node operations.
---
## Reason
Service + Action is the "sweet spot" that provides clear structure without Clean Architecture overhead. Most teams should stop here and only add Use Cases when the cost of framework-coupled logic exceeds the abstraction cost.
---
## Bad Example
```php
// Jumping directly to Use Case pattern for a simple CRUD app
class CreateProductUseCase
{
    public function execute(CreateProductInput $input): CreateProductOutput
    {
        $product = $this->products->create($input);
        return new CreateProductOutput($product);
    }
}
// 3 files (use case, input DTO, output DTO) for simple creation
```
---
## Good Example
```php
// Service + Action for most applications
class ProductService
{
    public function create(array $data): Product
    {
        return $this->createProductAction->execute($data);
    }
}
// Simpler, less ceremony, adequate for most projects
```
---
## Exceptions
Clean Architecture projects where framework independence is a stated requirement. Projects with multiple delivery mechanisms (HTTP + CLI + queue).
---
## Consequences Of Violation
Over-engineering (use cases where not needed) or under-engineering (all logic in services) — both cause maintenance issues.

## Adopt Use Cases When Framework Coupling Pain Exceeds Abstraction Cost
---
## Architecture
---
## Rule
Adopt the Use Case pattern only when the pain of framework-coupled logic (inability to test without HTTP, unreusable from CLI/queue) exceeds the cost of Clean Architecture abstractions.
---
## Reason
Use Cases add abstraction layers (interfaces, DTOs, bindings) that are justified when you need framework independence. Adding them prematurely for simple CRUD is over-engineering.
---
## Bad Example
```php
// Use Cases for a simple blog with single delivery mechanism
class CreatePostUseCase
{
    public function __construct(
        private PostRepository $posts,       // Interface
        private TransactionManager $tx,      // Wrapped transaction
        private Authorizer $auth,            // Wrapped auth
    ) {}
    public function execute(CreatePostInput $input): CreatePostOutput
    {
        return $this->tx->execute(fn() =>
            $this->posts->create($input)
        );
    }
}
// 6 files for a 2-line operation — over-engineering
```
---
## Good Example
```php
// Service + Action suffices for a simple blog
class PostService
{
    public function create(array $data): Post
    {
        return Post::create($data);
    }
}
```
---
## Exceptions
Projects already following Clean Architecture (established pattern). Projects with explicit framework-independence requirements.
---
## Consequences Of Violation
Unnecessary abstraction overhead for simple projects, reduced developer productivity, architecture astronaut syndrome.

## Document The Team's Chosen Pattern Explicitly
---
## Maintainability
---
## Rule
Document the team's chosen architectural pattern explicitly in the project README or an ADR. Specify what goes in Services, what goes in Actions, and what goes in Use Cases.
---
## Reason
The worst state is a codebase where some features use services, some use actions, some use use cases — without clear rules. Inconsistency is worse than any single pattern choice.
---
## Bad Example
```php
// No documented standard — each developer chooses their own pattern
// Feature A: Service with all logic (Developer A)
// Feature B: Action classes (Developer B)
// Feature C: Use Cases (Developer C)
// No one can predict where to find logic for a given feature
```
---
## Good Example
```php
// Documented in project README
// ## Architecture Decision
// This project uses Service + Action pattern.
// - Services: orchestration, transaction management
// - Actions: leaf-node single operations
// - Controllers: HTTP only (validate, call service, respond)
// - Use Cases: not used (single delivery mechanism)
// All new features must follow this pattern.
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Pattern soup — different features use different patterns with no consistency, confusion about what to use, difficulty onboarding.

## Avoid Architecture Paralysis
---
## Process
---
## Rule
Avoid architecture paralysis — debating pattern selection for weeks instead of shipping. Pick a reasonable pattern, ship, and refactor later if needed.
---
## Reason
The choice between Service, Action, and Use Case has minor performance impact (~50μs). Database query time dominates. Debating for weeks is worse than any single pattern choice.
---
## Bad Example
```php
// Team spends 3 weeks debating pattern choice
// Sprint 1: "Should we use Services or Use Cases?"
// Sprint 2: "What about Actions?"
// Sprint 3: "Maybe CQRS?"
// Zero features shipped in 3 weeks
```
---
## Good Example
```php
// Team picks Service + Action pattern in 1 hour
// Ships features for 3 weeks
// After 6 months, evaluates and decides if Use Cases are needed
// "We can always refactor" — proven by real experience
```
---
## Exceptions
Projects with clear Clean Architecture requirements from the start.
---
## Consequences Of Violation
Delayed delivery, reduced team morale, over-analysis without shipping value.

## Avoid Pattern Soup
---
## Maintainability
---
## Rule
Do not mix Services, Actions, and Use Cases inconsistently across the codebase. Pick one dominant pattern and use it consistently for all new features.
---
## Reason
Pattern soup makes the codebase unpredictable. Developers must understand multiple patterns and guess which one a given feature uses. Consistency improves readability and maintainability.
---
## Bad Example
```php
// Three features, three different patterns — no consistency
// Feature A: All logic in ProductController (no pattern)
// Feature B: UserService with inline logic (service pattern)
// Feature C: RegisterUserAction (action pattern)
// Feature D: CheckoutUseCase (use case pattern)
```
---
## Good Example
```php
// Consistent Service + Action across ALL features
// ProductController → ProductService → CreateProductAction
// UserController → UserService → RegisterUserAction
// OrderController → OrderService → PlaceOrderAction
// One pattern, predictable, maintainable
```
---
## Exceptions
Large codebases transitioning from one pattern to another (temporary inconsistency during migration, with clear migration plan).
---
## Consequences Of Violation
Unpredictable codebase, developer confusion, difficulty onboarding, decreased productivity.

## Use A Decision Tree For What Goes Where
---
## Maintainability
---
## Rule
Use a documented decision tree to determine where logic goes: Complex with multiple sub-steps → Service (or Use Case). Simple single operation → Action (or repository method).
---
## Reason
A decision tree removes ambiguity and ensures consistent placement of logic. Developers don't need to guess — they follow the tree.
---
## Bad Example
```php
// No decision criteria — arbitrary placement
// Sometimes single operations become actions
// Sometimes complex workflows stay in controllers
// No one can predict
```
---
## Good Example
```php
// Documented decision tree:
// 1. Single simple operation (e.g., create one record)?
//    → Model method or repository method
// 2. Single operation with business logic?
//    → Action class
// 3. Multiple operations that must be coordinated?
//    → Service class (orchestrating actions)
// 4. Framework independence needed?
//    → Use Case with DTO contracts
// 5. Complex workflow spanning multiple services?
//    → Service coordinating actions
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Arbitrary pattern choices, inconsistent architecture, difficult code review, onboarding friction.
