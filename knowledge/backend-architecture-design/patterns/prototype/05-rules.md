## Rule 1: Use Prototype when creating a new instance is expensive and you have an existing instance
---
## Category
Architecture
---
## Rule
Clone an existing object (prototype) instead of creating a new instance from scratch when the object's creation is costly (database load, network call, complex setup).
---
## Reason
Cloning bypasses expensive initialization; the prototype serves as a pre-configured template.
---
## Bad Example
```php
$defaultProfile = UserProfile::loadDefaults(); // expensive DB call
$user1 = UserProfile::loadDefaults(); // another DB call
$user2 = UserProfile::loadDefaults(); // another DB call
```
---
## Good Example
```php
$defaultProfile = UserProfile::loadDefaults(); // one DB call
$user1 = clone $defaultProfile; // fast
$user2 = clone $defaultProfile; // fast
```
---
## Exceptions
When the prototype's state is mutable and clones may share unintended references.
---
## Consequences Of Violation
Unnecessary expensive creation, performance degradation.
---
## Rule 2: Implement deep cloning to avoid shared references
---
## Category
Architecture
---
## Rule
Override `__clone()` to ensure deep copying of mutable objects within the prototype.
---
## Reason
Shallow cloning copies references; mutations in a clone could unintendedly affect the prototype or other clones.
---
## Bad Example
```php
class Order
{
    private array $items = [];
    // __clone not implemented — $items array is shared by reference between clones
}
```
---
## Good Example
```php
class Order
{
    private array $items = [];

    public function __clone()
    {
        $this->items = array_map(fn(OrderItem $item) => clone $item, $this->items);
    }
}
```
---
## Exceptions
When the object only contains immutable value objects (no shared references possible).
---
## Consequences Of Violation
Shared mutable state between clones, unintentional mutations.
---
## Rule 3: Prefer cloning over `new` + setters when the object has many default values
---
## Category
Architecture
---
## Rule
If an object requires setting many properties after construction (via setters), consider cloning a pre-configured prototype instead.
---
## Reason
`new` + 10 setters is verbose and error-prone; cloning a pre-configured prototype gives sensible defaults with only the necessary overrides.
---
## Bad Example
```php
$report = new Report();
$report->setTitle('Monthly Sales');
$report->setFormat('pdf');
$report->setOrientation('landscape');
$report->setIncludeCharts(true);
// ... 10 more setters
```
---
## Good Example
```php
$defaultReport = new Report('Monthly Report', 'pdf', 'portrait', false);
$salesReport = clone $defaultReport;
$salesReport->setTitle('Monthly Sales'); // override only what's different
$salesReport->setIncludeCharts(true);
```
---
## Exceptions
When the Builder pattern is more appropriate (many optional parameters with complex combinations).
---
## Consequences Of Violation
Verbose object construction, error-prone defaults.
