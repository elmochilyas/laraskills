# ECC Standardized Knowledge — Service Orchestration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Service Orchestration |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Service orchestration is the pattern of coordinating multiple services, actions, and external systems to complete a complex business workflow. An orchestrator service calls several sub-services in sequence, manages transaction boundaries, handles errors, and determines the workflow outcome. This is distinct from action composition because the orchestrated units are full services (each with multiple methods) rather than single-purpose actions. Orchestration centralizes workflow logic in one place, preventing a web of hidden dependencies where no class owns the overall workflow.

## Core Concepts

- **Orchestrator Service**: A service whose primary responsibility is calling other services in the correct sequence. Pure coordination — no domain logic.
- **Orchestration vs Composition**: Orchestration coordinates across domains using full services; composition coordinates within a domain using single-purpose actions.
- **Sequential Orchestration**: Steps execute in a defined order. The output of one service becomes input to the next.
- **Conditional Orchestration**: Sub-services execute only when conditions are met (e.g., plan type).
- **Compensation**: When a step fails, compensating actions reverse completed steps (especially for external API calls that can't be rolled back via database transactions).

## When To Use

- Complex cross-domain workflows involving 3+ services (checkout, onboarding, refund)
- When workflow sequence and error handling must be centralized in one class
- When auditability requires a single place to trace the workflow
- For coordinating operations that span multiple bounded contexts

## When NOT To Use

- Simple 2-step operations — a service calling 2 sub-methods is not orchestration
- Intra-domain workflows that can be handled by action composition
- When the orchestrator would coordinate only 1-2 services
- When the orchestration logic can be replaced by event-driven choreography

## Best Practices

- Keep orchestrators pure coordination — all domain logic belongs in sub-services
- Add logging at the orchestrator level to trace workflow execution
- Test orchestrators by mocking sub-services and verifying call sequence and data passing
- Use database transactions to wrap the orchestration sequence for atomicity
- Implement compensating actions for external system calls (payment gateways, email APIs)
- Place orchestrators at the application layer: `App\Orchestrators\` or `App\Services\Orchestration\`

## Architecture Guidelines

- An orchestrator coordinates across domains; a service orchestrates within its domain
- Reserve orchestrators for workflows involving 3+ services — otherwise use action composition or direct service calls
- Orchestrators must not contain domain logic — if you're writing business rules in the orchestrator, extract them to a sub-service
- Compensation patterns are needed for external system calls because database rollback cannot undo an API call
- Monitor orchestrator response time — they are the failure point for the entire workflow

## Performance Considerations

- Orchestration adds no direct performance overhead — it's just method calls
- The performance profile is the sum of all sub-service operations
- For slow sub-operations, consider dispatching them to the queue from within the orchestrator
- Long-running orchestrations should be modeled as state machines or saga patterns

## Security Considerations

- Authorization checks must happen in sub-services, not in the orchestrator — the orchestrator should not bypass security
- Logging at the orchestrator level must not leak sensitive DTO data
- Compensation actions for payment reversals must include audit trails
- Orchestrators handling financial workflows must have explicit rollback and escalation paths

## Common Mistakes

- **Orchestrator Doing Sub-Service Work**: Adding domain logic to the orchestrator. Solution: Keep orchestrators pure coordination — all domain logic in sub-services.
- **Over-Orchestration**: Creating orchestrators for every 2-step operation. Solution: Reserve orchestrators for workflows involving 3+ services.
- **Orchestrator Without Error Handling**: Assuming sub-services never fail. Solution: Handle failures at the orchestrator level with rollback or compensating actions.
- **Orchestrator God Class**: Coordinating 8+ services with accumulated conditional logic. Solution: Split into sub-orchestrators or extract steps into coordinator actions.

## Anti-Patterns

- **Orchestrator God Class**: 8+ services, error handling for each, accumulated conditional logic. Unreadable and untestable.
- **Missing Compensation**: 5-step orchestration where step 4 fails but steps 1-3 have already committed. No compensation logic exists.
- **Domain Logic in Orchestrator**: Orchestrator contains business rules instead of delegating to services. Violates the pure-coordination contract.

## Examples

### Sequential Orchestration with Transaction
```php
class UserOnboardingOrchestrator
{
    public function onboard(OnboardingDto $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = $this->users->create($dto);
            $this->teams->createDefault($user);
            $this->preferences->setDefaults($user);
            return $user;
        });
    }
}
```

### Orchestration with Compensation
```php
class RefundOrchestrator
{
    public function refund(RefundDto $dto): void
    {
        try {
            DB::beginTransaction();
            $this->payments->reverse($dto->transactionId);
            $this->orders->markRefunded($dto->orderId);
            $this->inventory->restock($dto->orderId);
            DB::commit();
        } catch (Throwable $e) {
            DB::rollBack();
            $this->payments->flagForManualReview($dto->transactionId);
            $this->notifier->sendRefundAlert($dto->orderId);
            throw $e;
        }
    }
}
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Service Class Design | Service patterns orchestrators coordinate | Prerequisite |
| Action Composition | Lighter alternative within a domain | Prerequisite |
| Service vs Action Decision | Choosing orchestration level | Related |
| Transaction Management | Transaction boundaries in orchestration | Related |
| Saga Pattern | Long-running orchestration with compensation | Follow-up |
| Event-Driven Orchestration | Using events instead of direct service calls | Follow-up |

## AI Agent Notes

- Service orchestration is the highest level of coordination in a service-oriented architecture — use sparingly
- Most CRUD operations don't need orchestration; they need simple action composition or single-service delegation
- Reserve orchestrators for cross-domain workflows involving 3+ services
- When generating orchestrators, ensure they contain zero domain logic — pure coordination only
- Always include error handling and compensation paths in orchestrator generation

## Verification

- [ ] Orchestrator is pure coordination — no domain logic inline
- [ ] Orchestrator handles 3+ services (otherwise use simpler pattern)
- [ ] Error handling exists with rollback or compensating actions
- [ ] External system calls have compensation paths
- [ ] Logging is present at the orchestrator level
- [ ] Orchestrator is testable with mocked sub-services
- [ ] Orchestrator is at the application layer, not domain layer
- [ ] Exception registry exists for documented skip exceptions
