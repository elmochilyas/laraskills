# Commit Strategies — Decomposition

## Implementation Tasks

### 1. Audit all queued job dispatches for commit strategy
- Review all `dispatch()` calls in event listeners, observers, and controllers
- Categorize each dispatch:
  - Must be after-commit: user-facing notifications, external API calls, emails
  - Can be before-commit: cache invalidation, internal audit logs, idempotent operations
  - Must be before-commit: operations that need to run within the transaction for atomicity

### 2. Apply `afterCommit` to appropriate dispatches
- Add `->afterCommit()` to queueable events and job dispatches that must wait for transaction commit:
  ```php
  dispatch(new SendOrderConfirmation($order))->afterCommit();
  ```

### 3. Implement `BroadcastsEventsAfterCommit` for models
- Switch broadcast traits to `BroadcastsEventsAfterCommit` for models whose broadcasts must be transaction-consistent

### 4. Write tests for commit strategy behavior
- Test that after-commit jobs are deferred when inside a transaction
- Test that after-commit jobs are cancelled when the transaction rolls back
- Test that before-commit jobs dispatch immediately regardless of transaction state
- Test that after-commit jobs dispatch immediately when no transaction is active

### 5. Document commit strategy decisions per listener
- Create a decision matrix document:
  | Listener | Strategy | Rationale |
  |----------|----------|-----------|
  | `SendOrderEmail` | After-commit | User must not receive email for rolled-back order |
  | `InvalidateUserCache` | Before-commit | Cache invalidation is idempotent and harmless on rollback |
  | `SyncToSearchIndex` | After-commit | Search index must never contain uncommitted data |

### 6. Implement transaction monitoring
- Add logging for transaction duration and after-commit callback count
- Alert on transactions lasting > 5 seconds (delays all after-commit side effects)
- Monitor discarded after-commit callbacks (transaction rollbacks)

### 7. Add CI check for commit strategy consistency
- Create a static analysis rule that warns when:
  - A queued job does not specify `afterCommit()` for user-facing notifications
  - After-commit is used for audit-critical operations that should always run
  - Strategy is inconsistently applied across similar operations

## Validation Criteria
- [ ] All dispatches audited and categorized by commit strategy
- [ ] `afterCommit()` applied to user-facing, external, and non-idempotent operations
- [ ] `BroadcastsEventsAfterCommit` used for transaction-consistent broadcasts
- [ ] Tests verify after-commit deferral and rollback cancellation
- [ ] Decision matrix document exists and is referenced in code reviews
- [ ] Transaction monitoring alerts on long-running transactions
- [ ] CI check enforces commit strategy consistency
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization