# Service Orchestration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service Orchestration
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-01

---

## Executive Summary

Service orchestration is the pattern of coordinating multiple operations — across services, actions, or repositories — within a single service method to complete a business workflow. An orchestrated method validates preconditions, executes steps in sequence, manages transaction boundaries, handles partial failures, and dispatches post-completion events. The service acts as a workflow coordinator, not a logic container.

The engineering significance of orchestration is the centralization of workflow control. Without orchestration, each step in a workflow is called independently from the controller, which either grows fat (too many sequential calls) or leaks business knowledge (the controller knows the order of operations). Orchestration moves this sequence logic into the service layer, where it is testable, consistent, and reusable across entry points.

The dominant pattern in production Laravel applications is the Service-Action complement: services orchestrate, actions execute. A service method calls multiple action classes in sequence, each responsible for one discrete operation. The service provides the transaction boundary, error handling, and post-completion logic. This separation keeps both services (orchestration logic) and actions (execution logic) focused and testable.

---

## Core Concepts

### Orchestration vs Execution
Orchestration is the sequence, coordination, and error handling of operations. Execution is the operations themselves. A service method orchestrates when it:
- Checks preconditions before proceeding
- Calls multiple sub-operations in a specific order
- Manages a transaction boundary around the sequence
- Handles failures with compensating actions or rollbacks
- Dispatches events after completion

An action executes when it performs one discrete operation without coordinating others.

### Workflow Stages
An orchestrated service method typically follows this structure:
1. **Precondition validation** — assert that the workflow can proceed (throw if invalid)
2. **Sequence execution** — call sub-operations in order
3. **Transaction management** — wrap the sequence in a database transaction
4. **Failure handling** — rollback or compensate on failure
5. **Post-completion** — dispatch events, invalidate cache, trigger notifications

### Orchestration Depth
Orchestration depth is the number of nested coordination levels:
- **Level 1 — Direct:** Service calls repository methods directly (no action classes)
- **Level 2 — Action delegation:** Service calls action classes, each doing one operation
- **Level 3 — Multi-service:** Service calls other services, which may call their own actions
- **Level 4 — Coordinator pattern:** A dedicated coordinator class (not a service) manages the workflow, services are pure logic containers

The appropriate depth depends on workflow complexity and the need for action reusability.

---

## Mental Models

### Orchestrator as Conductor
An orchestra conductor does not play any instrument. The conductor ensures the right instruments play at the right time, at the right volume, and stop at the right moment. Similarly, an orchestrated service method does not execute business logic — it ensures the right actions execute in the right order, with the right error handling, and stop on failure.

### Steps as Sequenced Checkpoints
Each step in an orchestrated workflow is a checkpoint. If any checkpoint fails, the entire workflow is invalid. The orchestration layer controls the transaction — if step 3 fails, steps 1 and 2 must be rolled back. This is why orchestration and transaction management are tightly coupled: the orchestrator owns the transaction boundary.

### The Coordinator as Single Source of Truth
When a workflow is orchestrated from the controller, the sequence logic is in the route handler. When the same workflow needs to run from a CLI command, the sequence must be duplicated. An orchestrated service method is the single source of truth for the workflow — every entry point calls the same service method.

---

## Internal Mechanics

### Orchestration Execution Flow
An orchestrated service method executes sequentially — each step completes before the next begins. The flow:

```
Service::method()
  ├── Precondition checks (guard clauses, throw if invalid)
  ├── Step 1: Action/Service call → result
  ├── Step 2: Action/Service call (depends on Step 1 result)
  ├── Step 3: Action/Service call (may depend on Step 1 and/or Step 2)
  ├── Transaction owner wraps all steps
  ├── Post-completion (afterCommit callbacks)
  └── Return result
```

Sequential execution means total time is the sum of all step times. Parallel execution is possible only when steps are truly independent — use `Bus::batch()` or `dispatch()` for parallel work, but note that parallel execution cannot share a single transaction.

### Dependency Resolution for Orchestrated Services
The container resolves the orchestrator service and all its action/sub-service dependencies at construction time. Each action is instantiated once and cached on the orchestrator for the request lifetime. The resolution chain depth is:

```
Orchestrator → Action 1 (deps: A, B)
            → Action 2 (deps: B, C)
            → Action 3 (deps: A, D)
```

Total resolutions: 1 orchestrator + 3 actions + deduplicated dependencies (A, B, C, D). The container auto-resolves concrete classes — no explicit binding is needed for most orchestrator patterns.

### Transaction Propagation
When the orchestrator wraps the workflow in `DB::transaction()`, all sub-operations within the closure participate in the same transaction. If a sub-operation calls `DB::transaction()` internally, it creates a savepoint — not a nested transaction. The savepoint can roll back only the sub-operation's changes, not the entire workflow. The orchestrator's transaction controls the final commit.

### afterCommit Registration
Callbacks registered via `DB::afterCommit()` during orchestration are queued on the connection's transaction manager. They fire only when the outermost transaction commits. If the workflow nests transactions (creating savepoints), afterCommit callbacks registered after the inner "commit" but before the outer commit fire at the outer commit — not immediately. This is by design but can be surprising when multiple afterCommit callbacks are registered at different nesting levels.

---

## Patterns

### Action Composition Within a Service

The service composes multiple action classes, each responsible for one operation:

```php
class CheckoutService
{
    public function __construct(
        private ValidateCartAction $validateCart,
        private ReserveInventoryAction $reserveInventory,
        private ProcessPaymentAction $processPayment,
        private CreateOrderAction $createOrder,
        private SendConfirmationAction $sendConfirmation,
    ) {}

    public function checkout(Cart $cart, User $user): Order
    {
        $this->validateCart->execute($cart);
        $this->reserveInventory->execute($cart->items());
        $charge = $this->processPayment->execute($cart->total(), $user);
        $order = $this->createOrder->execute($cart, $charge, $user);
        $this->sendConfirmation->execute($user, $order);
        return $order;
    }
}
```

Each action is independently testable. The service test verifies orchestration (correct actions called, correct order). The action tests verify business logic.

### Multi-Service Orchestration

The service coordinates multiple sub-services:

```php
class ProjectService
{
    public function __construct(
        private ActivityService $activityService,
        private NotificationService $notificationService,
        private ProjectRepository $projects,
    ) {}

    public function createProject(array $data, User $creator): Project
    {
        return DB::transaction(function () use ($data, $creator) {
            $project = $this->projects->create([...$data, 'owner_id' => $creator->id]);

            if ($data['create_default_tasks'] ?? false) {
                $this->createDefaultTasks($project);
            }

            $this->activityService->log('project.created', $project, $creator);
            $this->notificationService->notifyProjectCreated($project);

            DB::afterCommit(fn () =>
                Cache::forget("user:{$creator->id}:projects")
            );

            return $project;
        });
    }

    private function createDefaultTasks(Project $project): void
    {
        // Internal helper — not an action, not reusable outside this service
    }
}
```

The service controls the transaction boundary, calls sub-services, and manages post-commit operations.

### Conditional Orchestration

The workflow branches based on business conditions:

```php
class OrderProcessingService
{
    public function process(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $this->validateOrder->execute($order);

            if ($order->requiresApproval()) {
                $this->requestApproval->execute($order);
                return; // Workflow pauses for approval
            }

            $this->fulfillOrder->execute($order);

            if ($order->isExpress()) {
                $this->expediteShipping->execute($order);
            }
        });
    }
}
```

Conditional orchestration should be at the orchestration layer, not embedded in individual actions. The condition determines WHICH actions to run, not HOW an action runs.

### Event-Driven Post-Completion

After the transaction commits, dispatch events for side effects:

```php
class RegistrationService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->users->create($data);
            $this->roles->assign($user, 'member');

            DB::afterCommit(function () use ($user) {
                Event::dispatch(new UserRegistered($user));
                $this->mailer->sendWelcome($user);
                Cache::tags(['users'])->flush();
            });

            return $user;
        });
    }
}
```

The `DB::afterCommit()` callback only runs if the transaction commits. This prevents side effects for rolled-back operations.

### Application Coordinator Pattern (Expert)

A dedicated coordinator class abstracts orchestration into a reusable layer:

```php
final class ApplicationCoordinator
{
    public function __construct(
        private CommandBus $bus,
    ) {}

    public function run(object $command): Result
    {
        return DB::transaction(function () use ($command) {
            $result = $this->bus->dispatch($command);

            if ($result instanceof Err) {
                return $result;
            }

            $value = $result->unwrap();
            if (method_exists($value, 'releaseEvents')) {
                DB::afterCommit(fn () => collect($value->releaseEvents())
                    ->each(fn ($event) => Event::dispatch($event)));
            }

            return $result;
        });
    }
}
```

Every command follows the same path: Coordinator → Bus → Handler → Result. Transaction management and event dispatch are centralized.

### Cache Invalidation in Orchestration

Cache invalidation happens after the transaction commits:

```php
class UserProfileService
{
    public function updateProfile(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $user = $this->users->update($user, $data);

            DB::afterCommit(function () use ($user) {
                Cache::forget("user:{$user->id}:profile");
                Cache::tags(['users'])->flush();
            });

            return $user;
        });
    }
}
```

Cache BEFORE the transaction commit means invalidating data before the new data is written — a race condition window. Always invalidate after commit.

---

## Architectural Decisions

### Why Orchestration Belongs in Services, Not Controllers
Controllers are HTTP-aware. Orchestration that lives in controllers cannot be reused from CLI commands, queue jobs, or scheduled tasks. Moving orchestration to services makes the workflow accessible from any entry point without HTTP overhead.

### Why Orchestration Belongs in Services, Not Actions
Actions are single-purpose. An action that orchestrates sub-actions is not actually a single purpose — it is a workflow coordinator disguised as an action. The orchestration layer should be explicit about its coordinating role, not hidden inside an action named after one step.

### When to Use a Dedicated Coordinator
For highly complex workflows (5+ steps, conditional branching, compensation), a dedicated coordinator class is superior to a service method. The coordinator owns the transaction boundary, event dispatch, and error handling. Services remain pure logic containers. The coordinator pattern is appropriate when:
- Multiple services must participate in a single transaction
- Compensation actions are required for partial failure
- The workflow is complex enough to need its own tests independent of any service

---

## Tradeoffs

### Action Composition vs Multi-Service Orchestration

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Action composition: Each action is independently testable, reusable, single-purpose | Action composition: More files, more constructor dependencies in the orchestrating service | Use action composition for discrete operations with clear boundaries |
| Multi-service orchestration: Service calls other services naturally; shared DI reduces constructor bloat | Multi-service orchestration: Services become orchestration layers rather than logic containers | Use multi-service for cross-domain coordination |

### Transaction in Orchestrator vs Transaction in Actions

| Approach | Benefit | Cost |
|----------|---------|------|
| Transaction in orchestrator | Single rollback scope, clear ownership | Cannot delegate transaction decisions to actions |
| Transaction in each action | Actions are self-contained, independently usable | Nested transactions create savepoints, not real nesting |
| Community consensus: Orchestrator owns the transaction boundary |

### Explicit vs Implicit Orchestration

| Pattern | Benefit | Cost |
|---------|---------|------|
| Explicit: Service method calls actions in sequence | Visible workflow, easy to debug, grep-able | Verbose for simple workflows |
| Implicit: Events trigger next steps | Looser coupling between steps | Workflow is invisible — must trace event handlers |

---

## Performance Considerations

### Sequential Execution
Orchestrated steps execute sequentially. Total workflow time is the sum of all step times. For workflows with independent steps, consider parallel dispatch using `dispatch()` or `Bus::batch()` — but only when steps truly have no ordering dependency.

### Transaction Duration
The transaction in an orchestrated method should be short. Long transactions hold database locks, increasing contention and deadlock risk. Keep external API calls and slow operations outside the transaction — use `DB::afterCommit()` for post-transaction work.

### Cache Invalidation Timing
Cache invalidation inside a transaction invalidates data before the new data is visible, creating a window where stale reads return empty. Always invalidate AFTER the transaction commits using `DB::afterCommit()`.

---

## Production Considerations

### Error Handling Strategy
Orchestrated workflows should define error handling at the orchestration level:
- **Validation errors:** Throw early with clear messages — do not enter the transaction
- **Business logic errors:** Throw domain exceptions inside the transaction — the transaction rolls back
- **Infrastructure errors:** Let exceptions bubble to the global handler — log and alert
- **Partial failures:** Use compensating actions for external system calls made before the failure

### Orchestration Depth Limits
Limit orchestrator dependency count to 5–8. Beyond that, the orchestrator has too many responsibilities. Split into multiple orchestration methods or a coordinator class.

### Workflow Documentation
Complex orchestrations should include sequence documentation. At minimum, the method PHPDoc should describe the workflow steps. For very complex workflows, maintain a decision tree document alongside the code.

---

## Common Mistakes

### Orchestrating Inside an Action
Why it happens: An action grows to handle multiple steps because "it's all one operation." Why it's harmful: The action loses its single purpose. It cannot be reused for a sub-step because it always runs the full sequence. Better approach: Keep actions to one operation. Extract orchestration to a service or coordinator.

### Orchestrating from the Controller
Why it happens: It seems simpler to call three actions from the controller than to create a service method. Why it's harmful: The sequence cannot be reused from CLI or queue. The controller becomes fat with orchestration logic. Better approach: Create a service method that encapsulates the sequence. The controller calls one method.

### Mixing Transaction Boundaries
Why it happens: Each action has its own `DB::transaction()`, and the orchestrator also wraps the sequence in a transaction. Why it's harmful: Nested transactions become savepoints, not real nesting. An inner rollback only rolls back to the savepoint, not to the start of the outer transaction. Better approach: The orchestrator owns the transaction. Actions must not manage their own transactions — they receive the connection context from the outer transaction.

### External API Calls Inside the Transaction
Why it happens: The API call is part of the workflow, so it's included in the transaction block. Why it's harmful: If the API call succeeds but the transaction rolls back, the external system has irreversible state. Better approach: Move external calls after the transaction using `DB::afterCommit()`.

### Forgetting Post-Completion Steps
Why it happens: The test only checks that the database was updated, not that cache was invalidated or events were dispatched. Why it's harmful: Stale cache serves old data. Event listeners don't fire. The bug is silent until a user reports stale data. Better approach: Test that `DB::afterCommit()` callbacks are registered, or use `Event::fake()` and `Cache::shouldReceive()` to verify post-completion behavior.

---

## Failure Modes

### Partial Commit
An exception caught inside `DB::transaction()` without re-throw causes Laravel to commit the partial work. The transaction closure tracks exceptions — if caught inside, no exception escapes, and the transaction commits. Always let exceptions bubble out of the transaction closure.

### Cross-Service Transaction Coupling
Service A calls Service B, both using `DB::transaction()`. Service B's transaction becomes a savepoint when called inside Service A's transaction. If Service B rolls back, it only rolls back to the savepoint — Service A's outer changes are not affected. The savepoint behavior means "rollback in B" does NOT undo A's changes.

### Event Before Commit Side Effects
An event dispatched inside the transaction triggers listeners before the data is committed. Listeners that query the database may find no data (because the transaction hasn't committed) or stale data (because the update hasn't applied). The fix is `ShouldDispatchAfterCommit` interface or dispatching events after the transaction, not inside it.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream's `CreateTeam` action orchestrates team creation: create team record, attach owner, send invitation. The orchestration is inside the action (not a separate service), following Jetstream's action-per-operation pattern.

### Laravel Horizon
Horizon's queue management services orchestrate worker processes. `HorizonService` coordinates queue metrics collection, process supervision, and dashboard data aggregation. This is multi-service orchestration within the framework itself.

### Spatie Packages
Spatie's `laravel-media-library` uses service-level orchestration for media operations. The `MediaService` coordinates file storage, database persistence, and event dispatch. Operations that span multiple concerns are orchestrated at the service level.

### Monica CRM
Monica CRM's relationship management services orchestrate complex workflows. `RelationshipService::createRelationship()` handles relationship creation, activity logging, notification dispatch, and cache invalidation in a single orchestrated method.

---

## Related Knowledge Units

### Prerequisites
- Service Class Design — How services are structured and how they compose dependencies
- Transaction Management — Transaction boundaries for orchestrated workflows

### Related Topics
- Actions Pattern — Single-purpose actions as the execution counterpart to orchestration
- Stateless Service Design — Why orchestration services must be stateless

### Advanced Follow-up Topics
- Service vs Action Decision — When to orchestrate at the service vs action level
- Domain vs Application Services — Orchestration layer in DDD architecture
- Event System — Post-completion event dispatch patterns

---

## Research Notes

### Source Analysis
- Laravel Jetstream: `CreateTeam`, `AddTeamMember` actions — orchestration at the action level
- tegos/laravel-action-and-service-guideline — Action composition rules (max 5–8 dependencies)
- Steve McDougall Application Coordinator pattern — centralized orchestration with command bus
- Monica CRM production code — multi-service orchestration with post-completion event dispatch

### Key Insight
The distinction between orchestration and execution is the most important architectural boundary in the service layer. Orchestration coordinates; execution performs. Mixing them creates services that are neither good coordinators nor good executors. The Service-Action complement pattern codifies this boundary: services orchestrate actions, actions execute operations.

### Key Controversy
The Application Coordinator pattern versus service-level orchestration is debated. The coordinator pattern centralizes transaction management and event dispatch, but adds another layer. Service-level orchestration is simpler but can lead to inconsistent transaction and event handling across services. The coordinator pattern is preferred for applications where transaction consistency across services is critical.

### Version-Specific Notes
- `DB::afterCommit()` available since Laravel 8 — critical for post-commit orchestration
- `ShouldDispatchAfterCommit` available since Laravel 9 — for event dispatch after transaction commit
- Orchestration patterns are framework-version-independent (Laravel 5.x through 13.x)
