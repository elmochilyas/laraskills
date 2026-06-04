## Rule 1: Use Observer when a state change in one object needs to notify others
---
## Category
Architecture
---
## Rule
When a change to one object (subject) should trigger updates in other objects (observers) without the subject knowing the observers' details.
---
## Reason
Observer decouples the subject from observers, allowing new observers to be added without modifying the subject.
---
## Bad Example
```php
class Order
{
    public function complete(): void
    {
        $this->status = 'completed';
        Mail::send(...); // direct coupling
        Log::info(...); // direct coupling
    }
}
```
---
## Good Example
```php
class Order
{
    public function complete(): void
    {
        $this->status = 'completed';
        Event::dispatch(new OrderCompleted($this->id)); // subject doesn't know observers
    }
}
```
---
## Exceptions
When the notification is a core part of the domain invariant (must happen for correctness).
---
## Consequences Of Violation
Tight coupling, SRP violation, hard to add new observers.
---
## Rule 2: Observers should not depend on the order of notification
---
## Category
Architecture
---
## Rule
Design observers to be independent of each other. If ordering matters, use a single observer that coordinates the ordered operations.
---
## Reason
Observer order dependency creates implicit coupling between observers and fragile notification chains.
---
## Bad Example
```
Observers for OrderCompleted: [SendEmail, UpdateInventory, GenerateInvoice]
SendEmail depends on GenerateInvoice having run first — fragile.
```
---
## Good Example
```
Observers are independent: [SendEmail, UpdateInventory, GenerateInvoice]
If ordering matters: introduce a SagaOrchestrator that handles the sequence.
```
---
## Exceptions
When the observers are part of the same transactional workflow (use an explicit saga).
---
## Consequences Of Violation
Fragile notification chains, hard-to-debug ordering bugs.
---
## Rule 3: Use domain events for Observer in DDD, not raw Observer pattern
---
## Category
Architecture
---
## Rule
In DDD applications, use Domain Events (recorded by aggregates, dispatched by a service) rather than implementing the Observer pattern directly.
---
## Reason
Domain Events are explicit, storable, and replayable; raw Observer pattern is harder to trace and test.
---
## Bad Example
```php
class Order
{
    private array $observers = [];

    public function attach(Observer $obs): void { $this->observers[] = $obs; }
    public function complete(): void
    {
        $this->status = 'completed';
        foreach ($this->observers as $obs) { $obs->update($this); }
    }
}
```
---
## Good Example
```php
class Order
{
    public function complete(): void
    {
        $this->status = 'completed';
        $this->record(new OrderCompleted($this->id, $this->data()));
    }
}
// Event dispatcher notifies subscribers
```
---
## Exceptions
Simple in-process notification where Domain Events would be over-engineering.
---
## Consequences Of Violation
Tight coupling, untestable observers, no event replay.
---
## Rule 4: Push notifications, don't pull—observers should not query subject state
---
## Category
Architecture
---
## Rule
The subject should push the relevant data to observers; observers should not have to query the subject's state after notification.
---
## Reason
Pull-based observers require the subject to expose its state, breaking encapsulation and creating coupling.
---
## Bad Example
```php
interface Observer
{
    public function update(Subject $subject): void; // observer must query subject
}

class EmailObserver implements Observer
{
    public function update(Subject $subject): void
    {
        $status = $subject->getStatus(); // pull — needs Subject interface knowledge
    }
}
```
---
## Good Example
```php
interface Observer
{
    public function handle(Event $event): void; // push — event has all data
}

class EmailObserver
{
    public function handle(OrderCompleted $event): void
    {
        Mail::send($event->customerEmail, ...); // all data in event
    }
}
```
---
## Exceptions
When the event data is prohibitively large and querying is more efficient.
---
## Consequences Of Violation
Encapsulation violation, coupling to subject interface.
