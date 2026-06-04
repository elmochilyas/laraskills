# Rule: Each Eloquent model belongs to exactly one bounded context
---
## Category
Architecture
---
## Rule
Assign every Eloquent model to exactly one bounded context. The owning context runs the migrations and has exclusive write access.
---
## Reason
Shared models create schema coupling — adding a field affects all contexts. Exclusive ownership enables independent schema evolution per context.
---
## Bad Example
```php
// Shared model used by all contexts
namespace App\Models;
class User extends Authenticatable { /* ... */ }

// Identity, Billing, and Forum all import App\Models\User
// Changing User schema requires all contexts to coordinate
```
---
## Good Example
```php
// Each context owns its model
namespace App\Domains\Identity\Models;
class User extends Authenticatable { /* Identity-specific */ }

namespace App\Domains\Billing\Models;
class Customer extends Authenticatable { /* Billing-specific fields */ }

namespace App\Domains\Forum\Models;
class Author extends Authenticatable { /* Forum-specific fields */ }
```
---
## Exceptions
Single-context applications — no cross-context model ownership concerns.
---
## Consequences Of Violation
Schema coupling across contexts; adding a field requires coordinated migration across all contexts.

# Rule: Reference cross-context data by ID, not by model
---
## Category
Architecture
---
## Rule
When a context needs data from another context's model, store only the foreign ID — never import or reference the other context's model class.
---
## Reason
Importing another context's model creates direct class dependency. Schema changes in the owning context break all consuming contexts.
---
## Bad Example
```php
// Billing imports Identity's User model
use App\Domains\Identity\Models\User;

class Invoice extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class); // cross-context relationship
    }
}
```
---
## Good Example
```php
// Billing stores only the user_id as a plain integer
class Invoice extends Model
{
    public $guarded = [];

    public function getUserId(): int
    {
        return $this->identity_user_id; // plain int, no FK constraint
    }
}
```
---
## Exceptions
When contexts share the same database and the cost of duplication exceeds the coupling risk (rare).
---
## Consequences Of Violation
Schema coupling; owning context cannot evolve its model without breaking consumers.

# Rule: Never use cross-context Eloquent relationships
---
## Category
Code Organization
---
## Rule
Do not define Eloquent relationships that span across bounded context boundaries.
---
## Reason
Eloquent relationships create implicit schema-level coupling. A belongsTo across contexts creates a foreign key dependency that prevents independent schema evolution.
---
## Bad Example
```php
class Invoice extends Model
{
    // Cross-context relationship
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'identity_user_id');
        // Schema coupling: cannot change User's table without affecting Invoice
    }
}
```
---
## Good Example
```php
class Invoice extends Model
{
    // No cross-context relationships
    // User reference is a plain integer column
}

// Cross-context data retrieval via service contract
class InvoiceService
{
    public function __construct(
        private IdentityServiceInterface $identity
    ) {}

    public function getInvoiceWithUser(int $invoiceId): array
    {
        $invoice = Invoice::findOrFail($invoiceId);
        $user = $this->identity->getUser($invoice->getUserId());

        return ['invoice' => $invoice, 'user' => $user];
    }
}
```
---
## Exceptions
When contexts are guaranteed to remain in the same database forever and extraction is not planned.
---
## Consequences Of Violation
Schema coupling prevents independent schema evolution; splitting context later requires breaking all cross-context relationships.

# Rule: Use event-based synchronization for cross-context data
---
## Category
Architecture
---
## Rule
When a context needs a local copy of data owned by another context, synchronize via domain events rather than direct database access.
---
## Reason
Event-based synchronization decouples the source context's schema from the consumer. The source context emits events when data changes; consumers listen and update their local copy with only the fields they need.
---
## Bad Example
```php
// Billing reads Identity's user table directly
class InvoiceService
{
    public function getInvoicesForUser(int $userId): Collection
    {
        $user = DB::table('identity_users')->find($userId); // direct table access
        return Invoice::where('identity_user_id', $userId)->get();
    }
}
```
---
## Good Example
```php
// Identity emits event when user data changes
class UserCreated
{
    public function __construct(
        public int $userId,
        public string $email,
        public string $name
    ) {}
}

// Billing listens and maintains a local projection
class SyncBillingCustomer
{
    public function handle(UserCreated $event): void
    {
        BillingCustomer::updateOrCreate(
            ['identity_user_id' => $event->userId],
            ['email' => $event->email, 'name' => $event->name]
        );
    }
}
```
---
## Exceptions
When real-time consistency is required and eventual consistency is unacceptable (use synchronous contract calls instead).
---
## Consequences Of Violation
Direct schema coupling; source context cannot change its schema without affecting all direct consumers.

# Rule: Each database table has exactly one owning context
---
## Category
Architecture
---
## Rule
Ensure every database table is owned by exactly one bounded context. No table has multiple contexts performing writes.
---
## Reason
Multiple writers to the same table cause write conflicts, undefined behavior during schema migrations, and loss of data ownership accountability.
---
## Bad Example
```php
// Two contexts writing to the same table
// Identity updates users.name
// Billing updates users.billing_address
// Both write to the same users table
```
---
## Good Example
```php
// Separate tables per context
// Identity owns: identity_users (name, email, password)
// Billing owns: billing_customers (identity_user_id, billing_address)
// Each table has one owner
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Write conflicts, undefined migration ordering, no single owner accountable for data integrity.

# Rule: Generate local reference models with only needed fields
---
## Category
Code Organization
---
## Rule
When a context needs a local copy of cross-context data, define a minimal reference model containing only the fields that context requires.
---
## Reason
A local model with only necessary fields prevents coupling to the source context's full schema. Extra fields are not imported, so source schema changes to non-relevant fields don't affect the consumer.
---
## Bad Example
```php
// Billing stores the entire User record
class BillingCustomer extends Model
{
    protected $fillable = [
        'identity_user_id', 'email', 'name', 'phone',
        'address', 'preferences', 'avatar_url', 'role',
        'last_login_at', 'created_at', 'updated_at'
    ];
}
```
---
## Good Example
```php
// Billing stores only the fields it needs
class BillingCustomer extends Model
{
    protected $fillable = [
        'identity_user_id',
        'email',        // needed for invoice communication
        'name',         // needed for invoice display
    ];
}

// Identity can add/remove other fields without affecting Billing
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer context breaks when source context changes unrelated fields; unnecessary data storage.

# Rule: Use foreign keys only within a context, never across contexts
---
## Category
Architecture
---
## Rule
Define database foreign key constraints only between tables owned by the same context. Store cross-context references as plain integers without FK constraints.
---
## Reason
Foreign keys across contexts create database-level coupling. The owning context cannot drop or alter a table without affecting all contexts with FK references.
---
## Bad Example
```php
// Migration with cross-context foreign key
Schema::create('billing_invoices', function (Blueprint $table) {
    $table->foreignId('user_id')
        ->constrained('identity_users'); // FK to another context's table
});
```
---
## Good Example
```php
// Cross-context reference as plain integer — no FK
Schema::create('billing_invoices', function (Blueprint $table) {
    $table->integer('identity_user_id')->unsigned();
    // No foreign key constraint — reference by convention only
});

// Within-context FK is fine
Schema::create('billing_payments', function (Blueprint $table) {
    $table->foreignId('invoice_id')
        ->constrained('billing_invoices'); // same-context FK
});
```
---
## Exceptions
When contexts are guaranteed to remain together in the same database forever.
---
## Consequences Of Violation
Owning context cannot drop or alter its tables without DB constraint errors from consuming contexts.

# Rule: Access cross-context data only through service contracts
---
## Category
Architecture
---
## Rule
When a context needs data owned by another context, use a service contract (interface) provided by the owning context — never query the owning context's tables directly.
---
## Reason
Direct table access bypasses business logic and authorization. The owning context cannot add caching, validation, or permission checks if consumers bypass its layer.
---
## Bad Example
```php
// Direct table access — bypasses Identity's layer
class InvoiceService
{
    public function getUserEmail(int $identityUserId): string
    {
        return DB::table('identity_users')
            ->where('id', $identityUserId)
            ->value('email');
    }
}
```
---
## Good Example
```php
// Via service contract
interface IdentityServiceInterface
{
    public function getUserEmail(int $userId): string;
}

class InvoiceService
{
    public function __construct(
        private IdentityServiceInterface $identity
    ) {}

    public function sendInvoice(int $invoiceId): void
    {
        $invoice = Invoice::findOrFail($invoiceId);
        $email = $this->identity->getUserEmail($invoice->getUserId());
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Business logic and authorization are bypassed; owning context cannot evolve its data access layer.
