# Anti-Patterns â€” Service Orchestration
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Service Layer |
| Knowledge Unit | Service Orchestration |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Orchestrator Service Does Everything | High | Medium | Single service orchestrates an entire workflow without delegation |
| Missing Transaction Boundaries | High | Medium | Multi-step orchestration missing database transaction wrapping |
| Orchestration Without Error Recovery | High | Medium | Workflow steps execute sequentially without compensating actions on failure |
| Overly Complex Orchestration | Medium | Medium | Service orchestration too complex, hard to understand flow |
| Tight Coupling Between Orchestrator and Services | Medium | Medium | Orchestrator depends on concrete service implementations |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Orchestration Pattern Standard | No standard for how services orchestrate multi-step workflows | Inconsistent approaches, hard to follow |
| Orchestration Mixed with Business Logic | Same service both orchestrates and implements business rules | Can't reuse business logic independently |

## Anti-Pattern Details

### AP-SO-01: Orchestrator Service Does Everything
**Description**: A single service orchestrates an entire workflow â€” validation, business logic, persistence, notifications â€” without delegating sub-tasks.
**Root Cause**: Developer keeps all workflow steps in one method for clarity.
**Impact**: Monolithic method, hard to test individual steps, SRP violation.
**Detection**: Service method exceeds 30 lines with multiple distinct sub-tasks.
**Solution**: Delegate each workflow step to dedicated action classes or sub-services. Orchestrator coordinates.

### AP-SO-02: Missing Transaction Boundaries
**Description**: Multi-step orchestration doesn't wrap database operations in a transaction.
**Root Cause**: Developer assumes all steps succeed, no rollback consideration.
**Impact**: Partial execution leaves system in inconsistent state.
**Detection**: Orchestration method has multiple database writes without DB::transaction().
**Solution**: Wrap multi-step orchestration in DB::transaction(). Handle exceptions for rollback.

### AP-SO-03: Orchestration Without Error Recovery
**Description**: Workflow steps execute sequentially; failure mid-way doesn't trigger compensating actions.
**Root Cause**: Error recovery considered after initial implementation.
**Impact**: System left in inconsistent state on partial failure.
**Detection**: Orchestration lacks catch blocks or compensating logic.
**Solution**: Implement compensating actions for each workflow step. Use try-catch with rollback logic.

### AP-SO-04: Tight Coupling Between Orchestrator and Services
**Description**: Orchestrator depends on concrete service implementations instead of interfaces.
**Root Cause**: Direct instantiation or concrete type-hinting.
**Impact**: Can't swap implementations for testing or alternative workflows.
**Detection**: Orchestrator type-hints concrete classes instead of interfaces.
**Solution**: Program to interfaces. Use DI container to resolve implementations.
