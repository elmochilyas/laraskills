## Add Behavior To Models First
---
## Architecture
---
## Rule
When implementing a new feature, add the behavior method to the model first. Let the service call the model method. Only extract to domain services if behavior spans multiple models.
---
## Reason
Putting behavior on models first prevents the anemic domain model anti-pattern. The model protects its own invariants and the service orchestrates without duplicating logic.
---
## Bad Example
```php
class OrderService
{
    public function cancelOrder(Order $order): void
    {
        if ($order->status !== 'pending') { // Business logic in service
            throw new \Exception('Only pending orders can be cancelled');
        }
        if ($order->created_at->diffInHours(now()) > 24) { // Business logic in service
            throw new \Exception('Order cannot be cancelled after 24 hours');
        }
        $order->update(['status' => 'cancelled', 'cancelled_at' => now()]); // Direct state mutation
    }
}
// All business rules in service — model is anemic
```
---
## Good Example
```php
class Order extends Model
{
    public function cancel(): void
    {
        if ($this->status !== 'pending') {
            throw new \RuntimeException('Only pending orders can be cancelled');
        }
        if ($this->created_at->diffInHours(now()) > 24) {
            throw new \RuntimeException('Order cannot be cancelled after 24 hours');
        }
        $this->status = 'cancelled';
        $this->cancelled_at = now();
        $this->save();
    }
}

class OrderService
{
    public function cancelOrder(Order $order, User $user): void
    {
        $order->cancel(); // Model enforces invariants
        $this->logger->info('Order cancelled', ['order_id' => $order->id, 'by' => $user->id]);
        event(new OrderCancelled($order));
    }
}
```
---
## Exceptions
Pure CRUD applications with no business rules. But even these benefit from rich models.
---
## Consequences Of Violation
Anemic domain model, business rules scattered in services, logic duplication, models don't protect their own state.

## Keep Service Methods Thin
---
## Architecture
---
## Rule
Keep service methods thin. A service method should orchestrate: call model methods, dispatch events, log — not contain complex business logic with many `if` statements checking model state.
---
## Reason
A service method with 30 lines of `if` statements checking model state signals an anemic domain model. That logic belongs on the model itself.
---
## Bad Example
```php
class UserService
{
    public function changeEmail(User $user, string $newEmail): void
    {
        if ($user->email === $newEmail) { // State check in service
            throw new \Exception('New email is same as current');
        }
        if (User::where('email', $newEmail)->exists()) { // Business rule in service
            throw new \Exception('Email already taken');
        }
        if ($user->email_verified_at === null) { // State check in service
            throw new \Exception('Must verify current email first');
        }
        $user->update(['email' => $newEmail, 'email_verified_at' => null]);
        $user->sendEmailVerificationNotification();
    }
}
```
---
## Good Example
```php
class User extends Model
{
    public function changeEmail(string $newEmail): void
    {
        if ($this->email === $newEmail) {
            throw new \RuntimeException('New email is same as current');
        }
        if (User::where('email', $newEmail)->where('id', '!=', $this->id)->exists()) {
            throw new \RuntimeException('Email already taken');
        }
        $this->email = $newEmail;
        $this->email_verified_at = null;
        $this->save();
    }
}

class UserService
{
    public function changeEmail(User $user, string $newEmail): void
    {
        $user->changeEmail($newEmail); // Thin orchestration
        $this->mailer->sendEmailChanged($user);
        event(new EmailChanged($user));
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Fat services, anemic models, duplicated business rules, hard-to-test service logic.

## Models Must Protect Their Own Invariants
---
## Architecture
---
## Rule
Models must protect their own invariants. A model method should throw if the operation is invalid. The service should not check conditions before calling the model method.
---
## Reason
If the service checks conditions before calling the model method, the logic is duplicated and the model can be put into an invalid state by any caller that forgets to check.
---
## Bad Example
```php
class OrderService
{
    public function ship(Order $order): void
    {
        if ($order->status !== 'paid') { // Service checks precondition
            throw new \Exception('Only paid orders can be shipped');
        }
        $order->update(['status' => 'shipped', 'shipped_at' => now()]);
    }
    // What if another service forgets to check? Order can be shipped without payment.
}
```
---
## Good Example
```php
class Order extends Model
{
    public function ship(): void
    {
        if ($this->status !== 'paid') {
            throw new \RuntimeException('Only paid orders can be shipped');
        }
        $this->status = 'shipped';
        $this->shipped_at = now();
        $this->save();
    }
}

class OrderService
{
    public function ship(Order $order): void
    {
        $order->ship(); // Model protects itself — always
        event(new OrderShipped($order));
    }
}
```
---
## Exceptions
Cross-entity invariants that cannot be checked within a single model (use a domain service for those).
---
## Consequences Of Violation
Models can be put into invalid state, duplicated precondition checks, inconsistent enforcement across callers.

## Eliminate $fillable With All Attributes
---
## Security
---
## Rule
Avoid `$fillable` or `$guarded` with all model attributes when using rich domain models. Prefer `$guarded = ['*']` or disable mass assignment for models that enforce invariants.
---
## Reason
Mass assignment via `Model::create($request->all())` bypasses model behavior methods. Rich models should require calls to explicit methods that enforce invariants.
---
## Bad Example
```php
class User extends Model
{
    protected $fillable = [
        'name', 'email', 'password', 'role', 'status',
        'email_verified_at', 'is_admin', 'plan', // All attributes fillable
    ];

    // No behavior methods — all logic in services
}
// Service bypasses behavior:
User::create([
    'name' => 'John',
    'email' => 'john@example.com',
    'is_admin' => true, // Mass assignment sets admin without checks
]);
```
---
## Good Example
```php
class User extends Model
{
    protected $guarded = ['*']; // No mass assignment

    public static function register(string $name, string $email, string $password): self
    {
        $user = new self();
        $user->name = $name;
        $user->email = $email;
        $user->password = Hash::make($password);
        $user->role = 'member';
        $user->status = 'pending';
        $user->save();
        return $user;
    }

    public function promoteToAdmin(): void
    {
        $this->is_admin = true;
        $this->save();
    }
}
// Behavior is explicit — no mass assignment bypass
$user = User::register('John', 'john@example.com', 'password123');
```
---
## Exceptions
Simple CRUD models where behavior methods add overhead and mass assignment is acceptable (admin panels, prototypes).
---
## Consequences Of Violation
Model state can be set without invariant enforcement, security bypass via mass assignment, anemic models.

## Service Calls Model Methods, Not Set Attributes Directly
---
## Architecture
---
## Rule
Services must call model behavior methods, not set model attributes directly with `$model->update()` or `$model->attribute = value`.
---
## Reason
Setting attributes directly bypasses the model's invariant enforcement. The model cannot protect itself if the service mutates state directly.
---
## Bad Example
```php
class OrderService
{
    public function approve(Order $order, User $approver): void
    {
        if ($order->status !== 'pending_review') {
            throw new \Exception('Order is not pending review');
        }
        $order->update([ // Direct state mutation — bypasses model behavior
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
        ]);
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function approve(User $approver): void
    {
        if ($this->status !== 'pending_review') {
            throw new \RuntimeException('Order is not pending review');
        }
        $this->status = 'approved';
        $this->approved_by = $approver->id;
        $this->approved_at = now();
        $this->save();
    }
}

class OrderService
{
    public function approve(Order $order, User $approver): void
    {
        $order->approve($approver); // Calls model method
        event(new OrderApproved($order));
    }
}
```
---
## Exceptions
Simple CRUD operations where setting a few fields is the entire operation (e.g., updating a user's phone number with no invariants).
---
## Consequences Of Violation
Model invariants bypassed, logic duplication, anemic domain model, security vulnerabilities from bypassed state checks.

## Avoid Logic Duplication Between Model And Service
---
## Maintainability
---
## Rule
Do not duplicate invariant checks between the model and the service. If the model checks `$this->status !== 'pending'`, the service must not also check it.
---
## Reason
Duplicate logic creates two sources of truth. If one changes without the other, inconsistent enforcement creates bugs — the model may throw while the service passes, or vice versa.
---
## Bad Example
```php
class Order extends Model
{
    public function cancel(): void
    {
        if ($this->status !== 'pending') {
            throw new \RuntimeException('Only pending orders can be cancelled');
        }
        $this->status = 'cancelled';
        $this->save();
    }
}

class OrderService
{
    public function cancelOrder(Order $order): void
    {
        if ($order->status !== 'pending') { // DUPLICATED check — two sources of truth
            throw new \Exception('Only pending orders can be cancelled');
        }
        $order->cancel(); // Model also checks
        event(new OrderCancelled($order));
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function cancel(): void
    {
        if ($this->status !== 'pending') {
            throw new \RuntimeException('Only pending orders can be cancelled');
        }
        $this->status = 'cancelled';
        $this->save();
    }
}

class OrderService
{
    public function cancelOrder(Order $order): void
    {
        $order->cancel(); // Model enforces — service trusts it
        event(new OrderCancelled($order));
    }
}
```
---
## Exceptions
No common exceptions. Duplicate invariant checks are always a design problem.
---
## Consequences Of Violation
Inconsistent enforcement, logic drift between model and service, bugs from mismatched rules.
