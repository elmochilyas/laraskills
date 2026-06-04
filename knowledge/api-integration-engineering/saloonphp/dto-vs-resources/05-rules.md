## Always Use DTOs for Incoming API Data
---
## Category
Maintainability
---
## Rule
Parse all external API responses into typed, immutable DTOs; never pass raw arrays through the application.
---
## Reason
Raw arrays lose type information, prevent autocompletion, and cause runtime errors from key typos; DTOs provide contracts and safety.
---
## Bad Example
```php
$data = $response->json();
return $data['items'][0]['name']; // no autocompletion, runtime error if key missing
```
---
## Good Example
```php
return OrderCollection::fromResponse($response->json());
// $orders[0]->name — typed, autocompleted, fails fast at construction
```
---
## Exceptions
Prototypes or one-off scripts where speed trumps safety.
---
## Consequences Of Violation
Array key typos cause runtime errors, no IDE support, brittle refactoring, contract violations discovered late.
## Use readonly Properties for DTOs
---
## Category
Architecture
---
## Rule
Declare all DTO properties as `readonly` (PHP 8.1+) and initialize via constructor only.
---
## Reason
Immutability prevents accidental mutation after creation, making data flow predictable and eliminating subtle bugs from unintended changes.
---
## Bad Example
```php
class UserDto {
    public string $name; // mutable — can be changed after creation
}
```
---
## Good Example
```php
readonly class UserDto {
    public function __construct(public string $name) {}
}
```
---
## Exceptions
DTOs that need lazy-loaded or computed properties (use private setter with caution).
---
## Consequences Of Violation
Accidental mutation of DTO state after creation, hard-to-find bugs from shared mutable references.
## Centralize DTO Construction in Factory Methods
---
## Category
Code Organization
---
## Rule
Implement static `fromResponse()` factory methods on DTOs; never construct DTOs manually from raw data across the codebase.
---
## Reason
Centralized factories ensure consistent mapping, validation, and error handling; scattered construction leads to inconsistencies.
---
## Bad Example
```php
// Scattered across controllers
$charge = new ChargeDto($data['id'], $data['amount'], new Carbon($data['created']));
```
---
## Good Example
```php
// Centralized in DTO class
readonly class ChargeDto {
    public static function fromResponse(array $data): self {
        return new self(
            id: (string) $data['id'],
            amount: (int) $data['amount'],
            createdAt: new Carbon($data['created']),
        );
    }
}
```
---
## Exceptions
Simple DTOs with one-to-one constructor mapping where a factory adds no value.
---
## Consequences Of Violation
Inconsistent null handling, different date formats across the codebase, repeated validation logic.
## Use Resources for Outgoing, DTOs for Incoming
---
## Category
Architecture
---
## Rule
Use `JsonResource` for transforming application data into API responses (outgoing); use DTOs for parsing external API responses (incoming). Never mix the two.
---
## Reason
Resources handle presentation logic for responses; DTOs handle consumption logic for external data. Mixing them couples presentation to consumption.
---
## Bad Example
```php
class UserResource extends JsonResource {
    public function toArray($request): array {
        // Used for both incoming parsing and outgoing response — mixed concerns
    }
}
```
---
## Good Example
```php
// Incoming: DTO
readonly class ExternalUserDto { public static function fromResponse(array $data): self {} }
// Outgoing: Resource
class UserResource extends JsonResource { public function toArray($request): array {} }
```
---
## Exceptions
None — always separate concerns.
---
## Consequences Of Violation
Coupling between API consumption and presentation, versioning conflicts, difficulty testing each direction independently.
## Never Extend Eloquent Model for DTOs
---
## Category
Architecture
---
## Rule
DTOs must be plain PHP classes; never extend Eloquent Model or use database relationships in DTOs.
---
## Reason
DTOs represent external API data, not database records; extending Model introduces database coupling and violates separation of concerns.
---
## Bad Example
```php
class StripeCharge extends Model { // DTO extending Model — database coupling
    public $timestamps = false;
}
```
---
## Good Example
```php
readonly class StripeCharge { // Plain DTO — no database coupling
    public function __construct(public string $id, public int $amount) {}
}
```
---
## Exceptions
When the DTO is also an Eloquent model for persistence (use separate persistence DTO).
---
## Consequences Of Violation
Unnecessary database schema requirements for external data, migration coupling, ORM overhead for simple data transfer.
