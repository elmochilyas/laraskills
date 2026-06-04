## Rule 1: Shield stable core from volatile external dependencies via interfaces
---
## Category
Architecture
---
## Rule
Identify points of variation (external APIs, databases, file systems, third-party libraries) and protect the core domain from their instability by introducing interfaces at the boundary.
---
## Reason
Volatile dependencies change unpredictably; protecting the core ensures those changes don't cascade into domain logic.
---
## Bad Example
```php
class OrderService
{
    public function calculateTax(Money $amount): Money
    {
        // Direct call to external tax API
        $response = Http::post('https://tax-api.com/calculate', [...]);
        return Money::fromResponse($response);
    }
}
```
---
## Good Example
```php
interface TaxProvider
{
    public function calculate(Money $amount): Money;
}

class OrderService
{
    public function __construct(
        private TaxProvider $tax // protected variation
    ) {}
}
```
---
## Exceptions
When the volatile dependency is guaranteed stable (e.g., a core PHP function).
---
## Consequences Of Violation
Domain logic breaks when external dependencies change.
---
## Rule 2: Encapsulate variation behind stable interfaces—interfaces change less than implementations
---
## Category
Architecture
---
## Rule
Keep the interface contract stable even as implementations change. The interface represents the "protected" side; implementations handle the "variation."
---
## Reason
If the interface also changes with each implementation variation, the protection is ineffective.
---
## Bad Example
```php
// Interface changes every time a new storage is added
interface Storage
{
    public function store(string $key, $value): void;
    public function storeWithExpiry(string $key, $value, int $ttl): void;
    public function storeMany(array $items): void;
    public function atomicIncrement(string $key): int;
}
```
---
## Good Example
```php
// Stable interface
interface Storage
{
    public function get(string $key): ?string;
    public function set(string $key, string $value, ?int $ttl = null): void;
    public function delete(string $key): void;
}
// Varied implementations: RedisStorage, FileStorage, DatabaseStorage
```
---
## Exceptions
When the variation fundamentally changes the operation semantics (rare).
---
## Consequences Of Violation
Interface churn, broken clients, unprotected variation.
---
## Rule 3: Use configuration/adapter pattern for hardware or infrastructure dependencies
---
## Category
Architecture
---
## Rule
When the system depends on hardware or infrastructure (payment terminals, SMS gateways, email providers), wrap them with an Adapter that translates the vendor-specific interface to a domain interface.
---
## Reason
Hardware and infrastructure providers change frequently; adapters isolate the domain from vendor lock-in and API changes.
---
## Bad Example
```php
class SmsService
{
    public function send(string $phone, string $message): void
    {
        Twilio::sendMessage($phone, $message); // vendor-specific
    }
}
```
---
## Good Example
```php
interface SmsProvider
{
    public function send(PhoneNumber $to, Message $message): SmsResult;
}

class TwilioAdapter implements SmsProvider
{
    public function send(PhoneNumber $to, Message $message): SmsResult
    {
        try {
            Twilio::sendMessage((string) $to, (string) $message);
            return SmsResult::success();
        } catch (TwilioException $e) {
            return SmsResult::failure($e->getMessage());
        }
    }
}
```
---
## Exceptions
When the vendor dependency is a commodity that the team is confident will not change.
---
## Consequences Of Violation
Vendor lock-in, difficult migration, untestable infrastructure code.
---
## Rule 4: Use data mappers to protect the domain from schema changes
---
## Category
Architecture
---
## Rule
Map between domain objects and persistence schema using a Data Mapper (repository implementation); never let database schema changes propagate to domain entities.
---
## Reason
Database schema varies (migrations, vendor changes) independently of the domain; direct coupling makes domain entities fragile to schema refactoring.
---
## Bad Example
```php
class Order extends Model
{
    // Eloquent model — domain coupled to DB schema
    protected $fillable = ['order_total', 'customer_id', 'status'];
}
```
---
## Good Example
```php
class Order // pure domain object
{
    public function __construct(
        private OrderId $id,
        private Money $total,
        private CustomerId $customerId,
        private OrderStatus $status
    ) {}
}

class EloquentOrderMapper implements OrderRepository
{
    public function save(Order $order): void
    {
        OrderModel::updateOrCreate(
            ['id' => $order->id()],
            [
                'order_total' => $order->total()->amount(),
                'customer_id' => $order->customerId(),
                'status' => $order->status()->value,
            ]
        );
    }
}
```
---
## Exceptions
Simple CRUD applications where domain objects and DB schema are identical and stable.
---
## Consequences Of Violation
Domain entities coupled to persistence, schema changes break domain logic.
---
## Rule 5: Identify and document all protected variation points in an ADR
---
## Category
Architecture
---
## Rule
Document each Protected Variation point in the system: what varies, how it's protected, and the rationale. Update when variation points change.
---
## Reason
Undocumented variation points are forgotten; when the variation changes, developers may not realize the protection exists and bypass it.
---
## Bad Example
```
"Wait, why is there a TaxProvider interface? We only have one tax service."
No documentation. Developer considers removing the interface.
```
---
## Good Example
```
ADR-015: Tax Calculation Protected Variation
- Variation: external tax API (vendor: TaxJar)
- Protection: TaxProvider interface
- Rationale: TaxJar acquired, may switch to Avalara
- Last verified: 2026-03
```
---
## Exceptions
Obvious variation points (e.g., database abstraction) where the pattern is so standard that documentation is redundant.
---
## Consequences Of Violation
Forgotten variation points, unnecessary removal of protection, later rework.
