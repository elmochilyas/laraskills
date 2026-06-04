# Commit Strategies — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Commit Strategies |
| Focus | Anti-patterns in afterCommit(), dispatch timing, and transactional safety |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Dispatching Events/Jobs Inside Transactions Without `afterCommit()` | Reliability | Critical |
| 2 | Using `afterCommit()` for Side Effects That Must Always Run | Design | High |
| 3 | `afterCommit()` Without a Wrapping Transaction | Reliability | High |
| 4 | Listeners Assuming Models Still Exist After Commit | Reliability | Medium |
| 5 | Using `BroadcastsEvents` Instead of `BroadcastsEventsAfterCommit` | Reliability | High |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is dispatching events or jobs inside a database transaction without `afterCommit()`, causing side effects to execute against data that may be rolled back
- Using `afterCommit()` for audit logs, failure tracking, or compensating actions causes them to be silently skipped on rollback
- `afterCommit()` silently falls through when no transaction is active — the dispatch fires immediately with no error, making it easy to miss

---

## 1. Dispatching Events/Jobs Inside Transactions Without `afterCommit()`

### Category
Reliability

### Description
Dispatching events or queued jobs inside a `DB::transaction()` block without calling `->afterCommit()`, causing the dispatch to fire before the transaction commits and potentially execute against rolled-back data.

### Why It Happens
Developers focus on the persistence logic inside the transaction and forget to add `->afterCommit()` to dispatched jobs. The default dispatch behavior is immediate.

### Warning Signs
- `dispatch(new Job(...))` inside a `DB::transaction()` block without `->afterCommit()`
- Queue workers processing jobs that reference non-existent or stale data
- Listeners that query for a model that wasn't actually persisted
- Comments like "this job sometimes fails because the record doesn't exist"

### Why Harmful
- Queue workers execute against data that may never have been committed
- Runtime exceptions in workers due to `ModelNotFoundException`
- Data inconsistency between services when one commits and the other processes uncommitted data

### Preferred Alternative
```php
DB::transaction(function () use ($order) {
    $order->save();
    dispatch(new ProcessOrder($order->id))->afterCommit();
});
```

### Detection Checklist
- [ ] Search for `dispatch(` inside `DB::transaction(` blocks
- [ ] Verify all dispatches have `->afterCommit()` appended
- [ ] Check for `Bus::dispatch(` without `AfterCommit` variant

### Related
| Rule | `05-rules.md` — Always Use `afterCommit()` for Domain Events in Transactions |
| Decision Tree | `07-decision-trees.md` — afterCommit vs Immediate Dispatch |

---

## 2. Using `afterCommit()` for Side Effects That Must Always Run

### Category
Design

### Description
Applying `->afterCommit()` to dispatches that should execute even if the surrounding transaction fails, such as audit logging, failure tracking, or compensating actions.

### Why It Happens
Developers apply `afterCommit()` uniformly as a "best practice" without evaluating whether each specific side effect depends on the transaction's success.

### Warning Signs
- Audit logs marked `afterCommit()` — logs are lost on transaction failure
- Failure notification dispatches use `afterCommit()` — team never learns about failures
- Compensating actions (revert inventory, release hold) marked `afterCommit()` — never execute on failure
- Comments like "this should always run but has afterCommit"

### Preferred Alternative
```php
// Always logs, regardless of transaction outcome:
dispatch(new LogOrderAttempt($order));

DB::transaction(function () use ($order) {
    $order->save();
    dispatch(new ProcessOrder($order->id))->afterCommit();
});
```

### Detection Checklist
- [ ] Review each `afterCommit()` dispatch — should it always run?
- [ ] Separate audit/failure tracking from transaction-dependent logic
- [ ] Remove `afterCommit()` from dispatches that must execute unconditionally

### Related
| Rule | `05-rules.md` — Do Not Use `afterCommit()` for Side Effects That Must Execute Regardless of the Transaction |

---

## 3. `afterCommit()` Without a Wrapping Transaction

### Category
Reliability

### Description
Calling `->afterCommit()` on a dispatch that is not wrapped inside a database transaction, causing the `afterCommit()` behavior to be silently ignored and the dispatch to fire immediately.

### Why It Happens
Developers add `afterCommit()` "defensively" without ensuring there's an active transaction. The method silently falls through with no warning when no transaction is present.

### Warning Signs
- `dispatch(new Job(...))->afterCommit()` outside any `DB::transaction()` block
- Jobs execute immediately despite the `afterCommit()` call
- Comments like "afterCommit doesn't seem to work"
- No explicit documentation that the method requires a transaction to have effect

### Preferred Alternative
```php
DB::transaction(function () use ($order) {
    $order->save();
    dispatch(new ProcessOrder($order->id))->afterCommit();
});
```

### Detection Checklist
- [ ] Search for `afterCommit()` calls and verify each has an active transaction
- [ ] Check callers of methods that use `afterCommit()` — do they wrap in transactions?
- [ ] Document transaction requirements on methods that use `afterCommit()`

### Related
| Rule | `05-rules.md` — Document After-Commit Dependency on Transaction Boundaries |
| Skill | `06-skills.md` — Set Up afterCommit() Dispatch for Domain Events in Transactions |

---

## 4. Listeners Assuming Models Still Exist After Commit

### Category
Reliability

### Description
Writing event listeners or job handlers that assume the model still exists in its original state between the transaction commit and the listener execution, without re-fetching or checking existence.

### Why It Happens
Developers pass the model instance to the job constructor and use it directly in the `handle()` method, not considering that another process may have deleted or modified it in the meantime.

### Warning Signs
- Job `handle()` method receives the model and uses it without re-fetching
- `ModelNotFoundException` errors in queue workers
- Listeners that process stale data because the model changed between dispatch and execution
- Comments like "sometimes the model is gone by the time this runs"

### Preferred Alternative
```php
public function handle(Order $order): void
{
    $order = Order::find($order->id); // Re-fetch current state
    if ($order === null || $order->status !== 'placed') {
        return; // Already deleted or status changed
    }
    $order->processPayment();
}
```

### Detection Checklist
- [ ] Review job/event handlers that receive model instances
- [ ] Add existence checks and re-fetching for current state
- [ ] Handle deletion or state-change cases gracefully

### Related
| Rule | `05-rules.md` — Ensure Listeners Receiving After-Commit Events Handle Non-Existence Gracefully |
| Skill | `06-skills.md` — Set Up afterCommit() Dispatch for Domain Events in Transactions |

---

## 5. Using `BroadcastsEvents` Instead of `BroadcastsEventsAfterCommit`

### Category
Reliability

### Description
Applying the `BroadcastsEvents` trait (which broadcasts before the transaction commits) instead of `BroadcastsEventsAfterCommit`, risking broadcasts of uncommitted or rolled-back data.

### Why It Happens
Developers may not be aware that the default broadcast trait fires before commit, or they may not realize the model participates in transactional persistence.

### Warning Signs
- `use BroadcastsEvents` on any model
- Clients receiving model state that was never persisted (phantom data)
- UI flickering or reverting after broadcast
- Comments like "rollback causes phantom broadcast"

### Preferred Alternative
```php
use Illuminate\Database\Eloquent\BroadcastsEventsAfterCommit;
```

### Detection Checklist
- [ ] Search for `use BroadcastsEvents` (without AfterCommit)
- [ ] Replace with `BroadcastsEventsAfterCommit`
- [ ] Verify broadcasts only fire after successful transactions

### Related
| Rule | `05-rules.md` — Use `BroadcastsEventsAfterCommit` Over `BroadcastsEvents` |
| Decision Tree | `07-decision-trees.md` — Broadcast Commit Strategy |
