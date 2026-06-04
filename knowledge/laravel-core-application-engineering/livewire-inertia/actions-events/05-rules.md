## Rule: Actions Must Be Public Methods

Every component method callable from the frontend must be declared public. Private and protected methods cannot be triggered by wire:click or similar directives.

---

## Category

Framework Usage

---

## Rule

Make every method that is referenced in a Blade wire:click, wire:submit, wire:keydown, or event listener a public method. Keep internal helper methods as protected or private if they are not called from the frontend.

---

## Reason

Livewire's JavaScript only calls public methods. A non-public method results in a silent 404 error on the Livewire endpoint — the action appears to do nothing, with no error message in the UI or logs. Developers often waste time debugging why a wire:click does not work.

---

## Bad Example

`php
class Counter extends Component
{
    protected function increment(): void // Not callable from frontend
    {
        ->count++;
    }
}
`

---

## Good Example

`php
class Counter extends Component
{
    public function increment(): void // Callable from frontend
    {
        ->count++;
    }
}
`

---

## Exceptions

$refresh is a built-in Livewire method that re-renders without state changes. It does not need to be defined in the component class.

---

## Consequences Of Violation

Reliability risks: wire:click silently fails. Developer experience: wasted debugging time on a visibility issue.

---

## Rule: Validate Before Mutating

Call $this->validate() before any data mutation in every action method.

---

## Category

Security

---

## Rule

Place $this->validate() as the first executable statement (after any guards or early returns) in every action that creates, updates, or deletes data. Never perform queries or mutations before validation.

---

## Reason

If validation is called after data mutation, partial changes (DB writes, file uploads, sent emails) may have already occurred when validation fails. The component cannot fully roll back these side effects, leaving the application state inconsistent.

---

## Bad Example

`php
public function save(): void
{
     = Post::create(->only(['title', 'body'])); // Created before validation
    ->validate(); // May fail — post already persisted
}
`

---

## Good Example

`php
public function save(): void
{
    ->validate(); // Fail fast
    Post::create(->only(['title', 'body']));
}
`

---

## Exceptions

Actions that only read or display data (search, filter) do not need validation. Validation order applies only to mutating actions.

---

## Consequences Of Violation

Data integrity risks: partial writes on validation failure. Reliability risks: orphaned records and inconsistent state.

---

## Rule: Authorize Before Executing Sensitive Actions

Check authorization (Gates, policies, $this->authorize()) before executing any action that accesses or modifies restricted data.

---

## Category

Security

---

## Rule

In every action that accesses models owned by other users, deletes records, or performs administrative operations, call $this->authorize() or use Gate checks before the mutation logic. Never rely on the frontend hiding the action button as the only protection.

---

## Reason

Livewire actions can be called from the browser console or via crafted HTTP requests even if the button is hidden in the UI. Without server-side authorization, a malicious user can invoke any action by knowing its name. Authorization must be enforced server-side, not just UI-hidden.

---

## Bad Example

`php
public function deleteUser(int ): void
{
    User::findOrFail()->delete(); // No authorization check
}
`

---

## Good Example

`php
public function deleteUser(int ): void
{
    ->authorize('delete', User::class);
    User::findOrFail()->delete();
}
`

---

## Exceptions

Public actions (searching, viewing public data) that require no authorization may omit authorization checks. Document the public nature explicitly.

---

## Consequences Of Violation

Security risks: unauthorized action execution. Data loss: records can be deleted or modified by any user.

---

## Rule: Use dispatch for Child-to-Parent Communication

Communicate from child components to parent components using $dispatch events. Pass props from parent to child.

---

## Category

Architecture

---

## Rule

Pass data from parent components to child components as props (<livewire:child :user="" />). Send data from child components back to parents using $dispatch('event-name', data: [...]). Never have child components directly modify parent properties.

---

## Reason

Livewire components have isolated state. A child component cannot directly modify a parent component's public properties. Attempting to do so silently fails. $dispatch provides a clean, unidirectional communication pattern: parents pass data down via props, children notify parents of events via dispatch.

---

## Bad Example

`php
// Child component trying to modify parent state
public function notifyParent(): void
{
    ->parentProperty = 'new value'; // Does nothing
}
`

---

## Good Example

`php
// Child dispatches event
public function notifyParent(): void
{
    ->dispatch('item-updated', itemId: ->itemId);
}

// Parent listens in getListeners()
protected function getListeners(): array
{
    return ['item-updated' => 'refreshList'];
}
`

---

## Exceptions

Deeply nested component hierarchies (parent > child > grandchild) may use $dispatch with .to('parent-component') to target a specific parent level, avoiding event propagation through all ancestors.

---

## Consequences Of Violation

Reliability risks: cross-component mutations silently fail. Architecture: tight coupling between components.

---

## Rule: Keep Actions Focused

Each action method should perform exactly one operation. Split complex logic into service classes.

---

## Category

Maintainability

---

## Rule

Limit action methods to a single responsibility: create, update, delete, or process. If an action exceeds 20 lines or performs multiple sequential operations (validate, authorize, create, notify, log), extract the logic into a dedicated service or action class.

---

## Reason

Long action methods mixing validation, authorization, business logic, event dispatching, and error handling are hard to read, test, and maintain. A 100-line action is effectively a legacy controller method in a Livewire component — it violates the single-responsibility principle.

---

## Bad Example

`php
public function checkout(): void
{
    ->validate();
     = Order::create([...]);
     = Stripe::charge([...]);
    Mail::to(->user)->send(new OrderConfirmation());
    Log::info('Order placed', ['order' => ->id]);
    ->dispatch('cart-cleared');
    session()->flash('success', 'Order placed!');
}
`

---

## Good Example

`php
public function checkout(): void
{
    ->validate();
     = app(CheckoutService::class)->process(->cartItems);
    ->dispatch('cart-cleared');
    session()->flash('success', 'Order placed!');
}
`

---

## Exceptions

Trivial actions that merely toggle a boolean or call a single model method (e.g., public function toggle(): void { ->active = !->active; }) do not need extraction.

---

## Consequences Of Violation

Maintenance risks: difficult to understand, test, and refactor monolithic actions. Code duplication: similar logic repeated across actions.

---

## Rule: Handle Errors Gracefully

Wrap database and external service operations in try/catch blocks and display user-friendly error messages.

---

## Category

Reliability

---

## Rule

In every action that interacts with external services, databases, or any fallible operation, use try/catch. On failure, display a meaningful error to the user via $this->addError() or session()->flash('error'). Do not let exceptions bubble up.

---

## Reason

Unhandled exceptions in Livewire actions result in a 500 error response. The user sees a generic "Something went wrong" message with no context. The component may be left in an inconsistent state. User-friendly error handling provides clear feedback and allows the user to retry or adjust their input.

---

## Bad Example

`php
public function submitOrder(): void
{
    ->validate();
    PaymentGateway::charge(->amount); // May throw — unhandled
}
`

---

## Good Example

`php
public function submitOrder(): void
{
    ->validate();
    try {
        PaymentGateway::charge(->amount);
        session()->flash('success', 'Payment successful!');
    } catch (PaymentException ) {
        ->addError('payment', ->getMessage());
    }
}
`

---

## Exceptions

Validation exceptions from $this->validate() are handled by Livewire automatically. Only catch explicit exceptions from your business logic, not validation exceptions.

---

## Consequences Of Violation

UX: user sees generic 500 error with no actionable feedback. Reliability: component may be left in inconsistent state after error.
