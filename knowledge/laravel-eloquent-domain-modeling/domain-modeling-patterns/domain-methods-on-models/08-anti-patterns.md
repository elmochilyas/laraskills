# Domain Methods on Models — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Domain Methods on Models |
| Focus | Anti-patterns in domain method design on Eloquent models |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Technical Method Names Instead of Ubiquitous Language | Maintainability | Medium |
| 2 | External Side Effects in Domain Methods | Architecture | High |
| 3 | Missing Precondition Guards | Reliability | Critical |
| 4 | Caller Must Remember to `save()` | Design | High |
| 5 | Generic DomainException Instead of Specific Exceptions | Maintainability | Medium |
| 6 | Boolean Flags Changing Method Behavior | Design | High |

## Repository-Wide Cross-Cutting Patterns

- The most common pattern is method names that describe the technical action (`updateStatus('paid')`) rather than the business intent (`markAsPaid()`)
- External side effects (email, dispatch, logging) inside domain methods are a recurring issue that couples domain to infrastructure
- Precondition guards are frequently missing, allowing invalid state transitions

---

## 1. Technical Method Names Instead of Ubiquitous Language

### Category
Maintainability

### Description
Naming domain methods with technical descriptions of what they do (`updateStatus`, `setState`, `changeAttribute`) instead of business intent expressed in ubiquitous language (`markAsPaid`, `cancel`, `approve`).

### Why It Happens
Developers naturally name methods after the implementation. `updateStatus` is the generic CRUD pattern. Business terms require domain knowledge that developers may not have.

### Warning Signs
- `public function updateStatus(string $status)` — generic, accepts any status
- `public function setState(string $state)` — technical, not business
- Method parameters that include status values: `$order->updateStatus('paid')`
- No named methods for specific business operations
- Method names that match database column operations
- Business stakeholders wouldn't recognize method names in the code

### Why Harmful
- Code communicates how, not what — `$order->updateStatus('paid')` describes the DB operation, not the business event
- Each call site must know the status value string, duplicating magic strings
- Method signatures are permissive — `updateStatus('cancelled')` works even if cancellation has specific rules
- Business logic leak: status values are exposed to callers as method parameters
- Ubiquitous language is absent from the codebase

### Consequences
- Magic strings scattered across callers: `$order->updateStatus('paid')`, `$order->updateStatus('cancelled')`
- No discoverability: what operations are available? (must know status values)
- Business changes ripple: adding a new status requires updating all callers
- Onboarding slower: business terminology must be mentally translated to technical method names
- Code review gap: "should this status change be allowed?" can't be answered at the method signature

### Preferred Alternative
```php
public function markAsPaid(): void
{
    // ...
}
public function cancel(string $reason): void
{
    // ...
}
```

### Refactoring Strategy
1. Identify technical method names on models (`updateStatus`, `setState`, `change`)
2. For each, create named methods using domain terms
3. Move business rules (preconditions, related attribute changes) into the named methods
4. Update callers to use named methods
5. Remove or deprecate the generic technical method

### Detection Checklist
- [ ] Search for methods named `updateStatus`, `setState`, `change*`, `update*` on models
- [ ] Check if status strings are passed as method parameters
- [ ] Verify business stakeholders would recognize method names
- [ ] Count magic strings in caller code for status transitions
- [ ] Review available model methods — do they express business operations?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Name Domain Methods in Ubiquitous Language |
| Skill | `06-skills.md` — Add a Domain Method With Invariant Enforcement |
| Decision Tree | `07-decision-trees.md` — Domain Method vs Controller Inline Logic |

---

## 2. External Side Effects in Domain Methods

### Category
Architecture

### Description
Including external I/O operations (dispatching events, sending emails, calling APIs, logging to external systems) inside domain methods on models. The domain method becomes coupled to infrastructure and cannot be tested in isolation.

### Why It Happens
It's convenient: the domain method does "everything" related to the operation. The developer may not recognize that these side effects are separate concerns. The event dispatch seems like part of "marking as paid."

### Warning Signs
- `Event::dispatch()`, `Mail::send()`, `Log::info()`, `dispatch()` inside model domain methods
- Model methods that accept injected services or use facades for external operations
- Tests requiring `Mail::fake()`, `Event::fake()`, or `Queue::fake()` to test domain logic
- Domain method names that imply side effects (`markAsPaidAndNotify`)
- Side effects that execute during factory creation or test setup
- `Http::post()` or external API calls inside domain methods

### Why Harmful
- Domain logic cannot be tested without mocking external infrastructure
- Side effects execute during seeding, factory creation, and test setup
- Changing email content or notification channel requires modifying domain code
- External service failures crash business operations
- The domain method violates the Single Responsibility Principle

### Consequences
- Brittle tests that require infrastructure mocking
- Test pollution: factory creation triggers emails, events, API calls
- Domain logic coupled to specific notification channels
- External service outages block core business operations
- Harder to reprocess failed business operations

### Preferred Alternative
```php
public function markAsPaid(): void
{
    $this->status = 'paid';
    $this->paid_at = now();
    $this->save();
}

// Side effects explicit in the caller:
$invoice->markAsPaid();
Event::dispatch(new InvoicePaid($invoice->id));
```

### Refactoring Strategy
1. Identify external side effects in domain methods
2. Remove side effects from the domain method
3. Add domain event dispatch at the caller level (controller, action, command)
4. Create event listeners for each side effect
5. Update tests to verify domain method behavior independently

### Detection Checklist
- [ ] Search for `dispatch(`, `Mail::`, `Log::`, `Http::`, `Notification::`, `Storage::` in model methods
- [ ] Check test setup for `->fake()` calls related to model method tests
- [ ] Verify domain methods can be tested without event faking
- [ ] Check if factory creation triggers side effects
- [ ] Profile test suite for slow model operations due to side effects

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Domain Methods Free of External Side Effects |
| Rule | `05-rules.md` — Give Each Domain Method a Single Responsibility |
| Decision Tree | `07-decision-trees.md` — Domain Method vs Action/Service Class |

---

## 3. Missing Precondition Guards

### Category
Reliability

### Description
Domain methods that allow invalid state transitions because they don't check preconditions before mutating state. An invoice can be paid twice, an order can be shipped after cancellation, and invalid state data flows through the system.

### Why It Happens
Precondition checks seem like "validation that happens elsewhere." The controller or form request "should have" checked. The method is written for the happy path and exceptions are added later.

### Warning Signs
- Domain methods that set attributes without checking current state
- No `if` conditions or `throw` statements at the beginning of domain methods
- Invalid state transitions possible (pay an already-paid invoice, cancel a shipped order)
- Validation for the operation exists only in controllers or form requests
- Business rule violations discovered in production data
- Support tickets for data in impossible states

### Why Harmful
- The domain model does not guarantee its own consistency
- Invalid state can be persisted and flow through downstream processes
- Each caller must independently validate preconditions (unreliable)
- Business rules are scattered across controllers instead of centralized in the model
- Data corruption discovered late, requiring manual remediation

### Consequences
- Duplicate payments processed (invoice paid twice)
- Orders shipped after cancellation
- Data remediation scripts needed for invalid states
- Business reporting with incorrect data
- Loss of trust in data integrity

### Preferred Alternative
```php
public function markAsPaid(): void
{
    if ($this->status === 'paid') {
        throw new InvoiceAlreadyPaidException($this->id);
    }
    if ($this->status !== 'sent') {
        throw new InvalidInvoiceStatusException($this->id, $this->status, 'sent');
    }

    $this->status = 'paid';
    $this->paid_at = now();
    $this->save();
}
```

### Refactoring Strategy
1. Identify domain methods missing precondition checks
2. Document all valid preconditions for each operation
3. Add guard clauses at the start of each method
4. Create domain-specific exception classes for each precondition violation
5. Add tests that verify preconditions are enforced

### Detection Checklist
- [ ] Search for domain methods that set attributes before any conditional check
- [ ] Review docblock for `@throws` annotations — are all failure modes documented?
- [ ] Check if invalid state transitions are possible in code
- [ ] Audit database for data in impossible states
- [ ] Verify controllers don't duplicate precondition checks that should be in the model

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Guard Preconditions at the Start of Every Domain Method |
| Skill | `06-skills.md` — Add a Domain Method With Invariant Enforcement |

---

## 4. Caller Must Remember to `save()`

### Category
Design

### Description
Domain methods that modify model attributes but do not call `$this->save()`, requiring the caller to save the model after the method invocation. The caller can forget to save, save in the wrong order, or skip save entirely.

### Why It Happens
Some developers prefer domain methods to be "in-memory operations" and let the caller control persistence. This may be intended for batching multiple mutations in a single transaction. However, it creates an incomplete API.

### Warning Signs
- Domain methods that set `$this->attribute = 'value'` but don't call `$this->save()`
- Controller code like `$order->markAsPaid(); $order->save();` — two-step process
- Some domain methods call `save()` internally, others don't (inconsistent)
- Commented-out `$this->save()` calls in domain methods
- Bugs where data changes are lost because `save()` was forgotten
- Tests that verify model changes but fail to persist

### Why Harmful
- Callers may forget to call `save()`, losing data changes silently
- Inconsistent API: which methods save and which don't?
- Callers must remember the save step for every domain method invocation
- The domain method's contract is incomplete — it changes state but doesn't persist it
- Increases cognitive load for developers using the model

### Consequences
- Data loss from forgotten saves
- Inconsistent patterns across the codebase
- Bugs that are hard to reproduce (data exists in memory but not in database)
- Code reviews that must verify save is called after every domain method
- Developer frustration: "I called markAsPaid() but it didn't persist"

### Preferred Alternative
```php
public function markAsPaid(): void
{
    $this->status = 'paid';
    $this->paid_at = now();
    $this->save();
}

// Caller:
$invoice->markAsPaid(); // Complete — saves internally
```

### Refactoring Strategy
1. Identify domain methods that don't call `$this->save()`
2. Add `$this->save()` as the last step in each method
3. Search for callers that manually save after calling these methods
4. Remove the redundant `->save()` calls from callers
5. For methods that must batch in transactions, add clear documentation or a separate API

### Detection Checklist
- [ ] Search for domain methods that set `$this->attribute` but don't call `$this->save()`
- [ ] Check for `->save()` calls immediately after domain method calls in controllers
- [ ] Verify consistency: all domain methods of the same type should save or not save
- [ ] Review tests to ensure persisted state is verified, not just in-memory
- [ ] Check for data loss bugs attributed to forgotten saves

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Call `$this->save()` Inside the Domain Method |
| Skill | `06-skills.md` — Add a Domain Method With Invariant Enforcement |

---

## 5. Generic DomainException Instead of Specific Exceptions

### Category
Maintainability

### Description
Throwing generic `\DomainException` or `\InvalidArgumentException` from domain methods instead of domain-specific exception classes. Callers cannot distinguish between different failure modes without parsing error messages.

### Why It Happens
Creating custom exception classes seems like boilerplate. Generic exceptions are "good enough." The developer may not anticipate that callers need to distinguish between failure types.

### Warning Signs
- `throw new \DomainException('Invoice is already paid')` in domain methods
- Callers catching `\DomainException` and checking `$e->getMessage()` with `str_contains()`
- Tests asserting on exception messages instead of exception classes
- API responses that return generic error messages for all domain failures
- No custom exception classes in the project's exception hierarchy
- Error handling that logs and returns "invalid operation" for all failures

### Why Harmful
- Callers must parse error messages to determine the failure reason (brittle)
- Different failure types cannot be handled independently
- Tests assert on message strings, which are fragile and change with refactoring
- Monitoring cannot distinguish between different failure types
- Exception class hierarchy doesn't document the domain's failure modes

### Consequences
- API responses with unhelpful error messages
- Tests that break when error messages are reworded
- Inability to handle specific failures differently (retry, skip, alert)
- Poor developer experience when debugging (exception message must be read)
- Missing documentation of contract failure modes

### Preferred Alternative
```php
// Specific exceptions:
throw new InvoiceAlreadyPaidException($this->id);
throw new InvalidInvoiceStatusException($this->id, $this->status, 'sent');

// Caller catches specific types:
try {
    $invoice->markAsPaid();
} catch (InvoiceAlreadyPaidException $e) {
    // Handle gracefully — already paid is not an error
}
```

### Refactoring Strategy
1. Identify generic exceptions thrown from domain methods
2. Create specific exception classes for each distinct failure mode
3. Replace generic exceptions with specific ones
4. Update callers to catch specific exception types
5. Update tests to assert on exception types, not messages

### Detection Checklist
- [ ] Search for `throw new \DomainException` and `throw new \InvalidArgumentException` in model methods
- [ ] Check test assertions for `expectExceptionMessage` vs `expectException`
- [ ] Review exception classes in the project — are they specific to domain failures?
- [ ] Check API error responses — do they distinguish between failure types?
- [ ] Verify callers can handle different failures independently

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Throw Domain-Specific Exception Classes |
| Skill | `06-skills.md` — Add a Domain Method With Invariant Enforcement |

---

## 6. Boolean Flags Changing Method Behavior

### Category
Design

### Description
Domain methods that accept boolean parameters to change their behavior (`markAsPaid(true)` to send notification, `cancel(false)` to skip audit). The method does two different things based on the flag, violating single responsibility.

### Why It Happens
Two related behaviors seem like they should be in the same method. A boolean flag appears simpler than creating a separate method or dispatching an event. The developer may not recognize the flag as a second responsibility.

### Warning Signs
- Method parameters with `bool $sendNotification = false`, `bool $skipAudit = false`
- Internal `if ($sendNotification)` blocks inside the method
- Default parameter values that hide the extra behavior
- Callers unsure which value to pass (true/false meaning unclear at call site)
- Tests parameterizing every combination of boolean flags
- Method names that don't mention the optional behavior

### Why Harmful
- The method does two things based on the flag (violates SRP)
- Caller intent is unclear: `markAsPaid(true)` doesn't communicate what `true` means
- Each flag doubles the number of test scenarios
- Adding a new flag increases method complexity non-linearly
- The method's contract is unclear — callers must read the implementation to understand flag effects

### Consequences
- Confusing call sites: `$order->cancel(false)` — what does `false` disable?
- Tests that must cover every flag combination (exponential growth)
- Hidden side effects: callers unaware that `markAsPaid(true)` sends email
- Difficulty adding new optional behavior (adds another flag)
- Refactoring flags to separate methods requires updating all callers

### Preferred Alternative
```php
// Single responsibility — no flags
public function cancel(): void
{
    $this->status = 'cancelled';
    $this->cancelled_at = now();
    $this->save();
}

// Notification is a separate concern:
$order->cancel();
Event::dispatch(new OrderCancelled($order->id));
```

### Refactoring Strategy
1. Identify boolean flag parameters on domain methods
2. Determine the behavior associated with each flag value
3. Remove flags: make the primary behavior the method itself, and the optional behavior a separate method or event
4. Update callers to explicitly perform both steps if needed
5. Add domain events for optional side effects

### Detection Checklist
- [ ] Search for `bool ` parameters in model method signatures
- [ ] Check for `if ($flag)` blocks inside domain methods
- [ ] Review call sites for unclear parameter values (`true`, `false` as arguments)
- [ ] Count test scenarios related to flag combinations
- [ ] Verify that flags don't hide side effects from callers

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Pass External Parameters That Change Behavior Semantics |
| Skill | `06-skills.md` — Add a Domain Method With Invariant Enforcement |
