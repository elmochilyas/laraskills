# Livewire Actions and Events — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Actions and Events |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Non-Public Action Methods Called from Frontend
2. No Validation Before Data Mutation
3. No Authorization Check in Sensitive Actions
4. 500-Line Action Methods — Mixing All Logic in One Method
5. No Error Handling — Uncaught Exceptions

---

## Repository-Wide Anti-Patterns

- **Child component modifying parent property directly**: Attempting to set parent properties from child — silently fails.
- **Using $emit/$on instead of $dispatch**: Deprecated Livewire 3 patterns.
- **Events with too many listeners**: One event triggering 10+ listeners — performance and debugging issues.
- **Actions that don't update state**: Calling an action that does nothing visible.

---

## Anti-Pattern 1: Non-Public Action Methods Called from Frontend

### Category

Framework Usage

### Description

Declaring methods that are triggered from the frontend via `wire:click`, `wire:submit`, etc. as protected or private instead of public.

### Why It Happens

Developers may use protected/private by habit from traditional OOP where encapsulation is preferred. In Livewire, the frontend needs access to call methods — the PHP visibility model does not apply to AJAX-triggered actions.

### Warning Signs

- `wire:click="save"` does nothing — no error, no response
- Browser network tab shows a 404 or error on the Livewire endpoint
- Developer adds `wire:click` but the method is marked `protected function` or `private function`

### Why Harmful

Livewire's JavaScript only calls public methods. A non-public method results in a silent 404 error on the Livewire endpoint — the action appears to do nothing, with no error message in the UI or logs. Developers waste significant time debugging why `wire:click` does not work.

### Consequences

- `wire:click` silently fails — no user feedback
- Wasted debugging time on a visibility issue
- Feature appears broken with no error messages
- Network tab shows 404 on Livewire POST requests

### Alternative

Make every method that is referenced in a Blade `wire:click`, `wire:submit`, `wire:keydown`, or event listener a public method. Keep internal helper methods as protected or private.

### Refactoring Strategy

1. Search for `protected function` and `private function` in Livewire component classes
2. For each method referenced in Blade templates, change visibility to `public`
3. Rename internal helper methods to make the distinction clear if needed
4. Test all `wire:click` directives work after visibility changes

### Detection Checklist

- [ ] All Blade-referenced methods are `public`
- [ ] No `protected` or `private` methods used in `wire:click`, `wire:submit`, `getListeners()`
- [ ] Internal helper methods are `protected` or `private` (not exposed to frontend)
- [ ] No silent failures from invisible action methods

### Related Rules

- Actions Must Be Public Methods (05-rules.md)

### Related Skills

- Implement and Test Livewire Actions with Events (06-skills.md)

### Related Decision Trees

- Livewire Action Method vs API Controller for Server-Side Logic (07-decision-trees.md)

---

## Anti-Pattern 2: No Validation Before Data Mutation

### Category

Security

### Description

Performing data mutations (creating, updating, or deleting records) in Livewire actions without calling `$this->validate()` first.

### Why It Happens

Developers may assume that frontend validation (HTML5 `required`, Alpine.js) is sufficient, or they may forget to call `validate()` before business logic.

### Warning Signs

- Action methods that create/update records without calling `$this->validate()`
- Validation rules defined via `#[Rule]` but never explicitly validated
- Invalid data reaching the database from Livewire submissions

### Why Harmful

If validation is called after data mutation, partial changes (DB writes, file uploads, sent emails) may have already occurred when validation fails. The component cannot fully roll back these side effects, leaving the application state inconsistent with orphaned records or partial updates.

### Consequences

- Invalid data saved to database
- Partial writes on validation failure — orphaned records
- Data integrity corruption
- Side effects (emails, webhooks) triggered with invalid data

### Alternative

Place `$this->validate()` as the first executable statement in every action that creates, updates, or deletes data. Validate before any mutations.

### Refactoring Strategy

1. Identify all actions that mutate data (create, update, delete)
2. Add `$this->validate()` as the first line after any guards
3. Ensure validation rules are defined via `#[Rule]` attributes or the `rules()` method
4. Move any pre-validation logic (auth checks, guards) before validation, but post-validation logic after

### Detection Checklist

- [ ] Every mutating action calls `$this->validate()` first
- [ ] No database writes occur before validation
- [ ] No side effects (emails, API calls) before validation
- [ ] Validation rules cover all mutable fields

### Related Rules

- Validate Before Mutating (05-rules.md)

### Related Skills

- Implement and Test Livewire Actions with Events (06-skills.md)

### Related Decision Trees

- Livewire Action Method vs API Controller for Server-Side Logic (07-decision-trees.md)

---

## Anti-Pattern 3: No Authorization Check in Sensitive Actions

### Category

Security

### Description

Executing sensitive actions (deleting users, modifying admin data, accessing restricted resources) without checking authorization via `$this->authorize()` or Gate checks.

### Why It Happens

Developers may rely on hiding the action button in the UI as sufficient protection, not realizing that Livewire actions can be called from the browser console or via crafted HTTP requests.

### Warning Signs

- Action methods that access models by ID without checking ownership
- Delete/update actions without `$this->authorize()` calls
- UI buttons are hidden for unauthorized users, but the action method has no server-side check
- Security incidents where users accessed data they shouldn't have

### Why Harmful

Livewire actions can be called from the browser console or via crafted HTTP requests even if the button is hidden in the UI. Without server-side authorization, a malicious user can invoke any action by knowing its name. The frontend UI hiding is cosmetic — it does not prevent action execution.

### Consequences

- Unauthorized deletion or modification of records
- Data leakage — users access data belonging to other users
- Privilege escalation — regular users invoke admin-only actions
- Security incidents requiring incident response

### Alternative

In every action that accesses models owned by other users, deletes records, or performs administrative operations, call `$this->authorize()` or use Gate checks before the mutation logic.

### Refactoring Strategy

1. Identify all actions that access models by ID or perform sensitive operations
2. Add `$this->authorize()` calls based on the model's policy
3. For actions without dedicated policies, use `Gate::allows()` or `$this->authorize()` with the action name
4. Test that the authorization check prevents unauthorized access and allows authorized access

### Detection Checklist

- [ ] Every delete action checks authorization
- [ ] Every action accessing models by user ID checks ownership
- [ ] Every admin-only action checks admin role
- [ ] Authorized users can perform the action
- [ ] Unauthorized users receive 403 or error feedback

### Related Rules

- Authorize Before Executing Sensitive Actions (05-rules.md)

### Related Skills

- Implement and Test Livewire Actions with Events (06-skills.md)

### Related Decision Trees

- wire:click vs Alpine.js @click for Button Interactions (07-decision-trees.md)

---

## Anti-Pattern 4: 500-Line Action Methods — Mixing All Logic in One Method

### Category

Maintainability

### Description

Creating action methods that exceed 50-100 lines, mixing validation, authorization, business logic, event dispatching, error handling, and logging in a single method.

### Why It Happens

It's convenient to write everything in one place. The action "works" when written sequentially, so there is no immediate incentive to extract logic. Over time, small additions compound into a monolithic method.

### Warning Signs

- Action method exceeds 50 lines
- Single method contains validation, DB writes, email sending, event dispatching, logging, and flash messages
- Multiple sequential operations that could fail independently
- Hard to test — the method does too many things

### Why Harmful

Long action methods mixing validation, authorization, business logic, event dispatching, and error handling are hard to read, test, and maintain. A 100-line action is effectively a legacy controller method in a Livewire component — it violates the single-responsibility principle.

### Consequences

- Difficult to understand — reader must parse 100+ lines to understand the action
- Difficult to test — must set up many dependencies for a single test
- Code duplication — similar logic repeated across actions
- Refactoring risk — changing one part of the method may break another
- Hard to reuse — business logic embedded in the action cannot be called from elsewhere

### Alternative

Limit action methods to a single responsibility. If an action exceeds 20 lines or performs multiple sequential operations, extract the logic into a dedicated service or action class.

### Refactoring Strategy

1. Identify actions that exceed 30 lines or perform 3+ distinct operations
2. Extract business logic into service classes (e.g., `CheckoutService`, `UserRegistrationService`)
3. The action method should validate, authorize, call the service, dispatch events, and flash messages
4. Test the service in isolation and the action as an integration

### Detection Checklist

- [ ] Action methods are under 30 lines
- [ ] Complex operations are delegated to service classes
- [ ] No business logic duplication across actions
- [ ] Services are independently testable
- [ ] Actions follow clear pattern: validate -> authorize -> execute -> dispatch -> respond

### Related Rules

- Keep Actions Focused (05-rules.md)

### Related Skills

- Implement and Test Livewire Actions with Events (06-skills.md)

### Related Decision Trees

- $dispatch Event vs Direct Component Method Call for Cross-Component Communication (07-decision-trees.md)

---

## Anti-Pattern 5: No Error Handling — Uncaught Exceptions

### Category

Reliability

### Description

Failing to wrap database operations, external API calls, or other fallible operations in try/catch blocks, allowing exceptions to bubble up as generic 500 errors.

### Why It Happens

Developers may not anticipate failure scenarios or may assume that operations always succeed. Error handling is added reactively after an incident rather than proactively during development.

### Warning Signs

- Action methods without any try/catch blocks
- Generic "Something went wrong" messages shown to users
- Server error logs filled with unhandled exceptions from Livewire actions
- Users see error pages or blank responses during partial failures

### Why Harmful

Unhandled exceptions in Livewire actions result in a 500 error response. The user sees a generic "Something went wrong" message with no context. The component may be left in an inconsistent state (some operations completed, others failed). User-friendly error handling provides clear feedback and allows the user to retry or adjust their input.

### Consequences

- Users see generic 500 error with no actionable feedback
- Component may be in inconsistent state after partial failure
- Server errors require log inspection to diagnose
- Users cannot retry because they don't know what went wrong
- Poor user experience and trust erosion

### Alternative

Wrap database and external service operations in try/catch blocks. On failure, display a meaningful error to the user via `$this->addError()` or `session()->flash('error')`. Do not let exceptions bubble up.

### Refactoring Strategy

1. Identify all action methods that interact with databases, external services, or files
2. Wrap fallible operations in try/catch blocks
3. In the catch block, log the error and display a user-friendly message
4. For transient failures, consider allowing retry

### Detection Checklist

- [ ] Every action method has appropriate try/catch coverage
- [ ] Database operations are wrapped in try/catch
- [ ] External API calls are wrapped in try/catch
- [ ] File operations are wrapped in try/catch
- [ ] Error messages are user-friendly and specific
- [ ] Component state is consistent after error handling

### Related Rules

- Handle Errors Gracefully (05-rules.md)

### Related Skills

- Implement and Test Livewire Actions with Events (06-skills.md)

### Related Decision Trees

- wire:click vs Alpine.js @click for Button Interactions (07-decision-trees.md)
