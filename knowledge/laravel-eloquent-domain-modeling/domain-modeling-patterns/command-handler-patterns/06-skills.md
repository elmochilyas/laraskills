# Command Handler Patterns — Skills

---

## Skill 1: Implement a Command Handler

### Purpose
Create a command handler class that receives a command DTO, orchestrates domain logic, and returns a result — separating application orchestration from domain concerns.

### When To Use
- A single action (place order, register user) involves multiple domain steps
- You want a clear boundary between HTTP/CLI and domain logic
- The action is complex enough to warrant extraction from controllers

### When NOT To Use
- The action is a simple CRUD operation (use model methods directly)
- The action needs to return a response immediately (use controller)
- You're already using actions/action classes effectively

### Prerequisites
- Command DTO class with typed, readonly properties
- Domain model(s) affected by the command

### Inputs
- Command DTO class
- Handler class name
- Domain services/repositories needed

### Workflow

1. **Define the command DTO** with `readonly` properties:
   ```php
   class RegisterUserCommand
   {
       public function __construct(
           public readonly string $email,
           public readonly string $password,
           public readonly string $name,
       ) {}
   }
   ```

2. **Create the handler** with an `__invoke()` or `handle()` method:
   ```php
   class RegisterUserHandler
   {
       public function __construct(
           private readonly UserRepository $users,
           private readonly UserFactory $factory,
       ) {}
   ```

3. **Implement the handler** — validate business rules, call domain methods, persist

4. **Return a result DTO** or the affected aggregate

5. **Keep the handler thin** — orchestrate, don't implement domain logic inline

6. **Wire in a service provider** or dispatch via a command bus

### Validation Checklist

- [ ] Command DTO has readonly properties and no behavior
- [ ] Handler depends on domain abstractions (interfaces), not concretions
- [ ] Handler calls domain methods on models (doesn't inline logic)
- [ ] Handler returns a typed result or void
- [ ] Handler is wired for dependency injection
- [ ] No HTTP concerns in the command or handler

### Related Rules

| Rule | Reference |
|---|---|
| Keep command DTOs as data carriers only | `05-rules.md` Rule 1 |
| Handlers orchestrate, models decide | `05-rules.md` Rule 2 |
| Return typed results from handlers | `05-rules.md` Rule 3 |
| Inject domain abstractions, not Eloquent | `05-rules.md` Rule 4 |
| Wire in service providers, not controllers | `05-rules.md` Rule 5 |

### Success Criteria
- Command handler orchestrates the full business operation
- Domain logic stays in models/services, not in the handler
- Handler returns a meaningful result to the caller
- Handler is testable with mocked dependencies
