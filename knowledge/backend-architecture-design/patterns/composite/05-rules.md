## Rule 1: Composite allows treating individual objects and compositions uniformly
---
## Category
Architecture
---
## Rule
Define a component interface that both leaf (individual) and composite (container) objects implement, allowing clients to treat them identically.
---
## Reason
Without Composite, clients must check whether an object is a leaf or a composite, creating conditionals and coupling.
---
## Bad Example
```php
class OrderItem { /* leaf */ }
class OrderItemGroup { /* container */ }

// Client must check type:
if ($item instanceof OrderItemGroup) {
    foreach ($item->getItems() as $subItem) { /* ... */ }
}
```
---
## Good Example
```php
interface Calculable
{
    public function calculateTotal(): Money;
}

class Product implements Calculable // leaf
{
    public function __construct(private Money $price) {}
    public function calculateTotal(): Money { return $this->price; }
}

class ProductBundle implements Calculable // composite
{
    /** @param Calculable[] $items */
    public function __construct(private array $items) {}

    public function calculateTotal(): Money
    {
        return array_reduce(
            $this->items,
            fn(Money $carry, Calculable $item) => $carry->add($item->calculateTotal()),
            new Money(0)
        );
    }
}

// Client: no conditionals
foreach ($items as $item) {
    $total = $item->calculateTotal(); // works for both leaf and composite
}
```
---
## Exceptions
When leaf and composite are never used interchangeably (no uniform treatment needed).
---
## Consequences Of Violation
Conditionals scattered, client knowledge of object structure.
---
## Rule 2: Composite operations delegate to children recursively
---
## Category
Architecture
---
## Rule
Composite's operations are implemented by iterating over children, calling the same operation on each child (which may itself be a composite).
---
## Reason
The recursive nature of Composite is what enables uniform treatment; each composite delegates to its children.
---
## Bad Example
```php
class OrderComposite
{
    public function calculateTotal(): Money
    {
        $total = new Money(0);
        foreach ($this->items as $item) {
            if ($item instanceof OrderComposite) {
                $total = $total->add($item->calculateTotal()); // recursive
            } else {
                $total = $total->add($item->price);
            }
        }
    }
}
```
---
## Good Example
```php
class OrderComposite implements Calculable
{
    /** @param Calculable[] $items */
    public function __construct(private array $items) {}

    public function calculateTotal(): Money
    {
        return array_reduce(
            $this->items,
            fn(Money $carry, Calculable $item) => $carry->add($item->calculateTotal()),
            new Money(0)
        );
    }
}
```
---
## Exceptions
When the operation cannot be decomposed into child operations (rare).
---
## Consequences Of Violation
Duplicated iteration logic, not leveraging recursive nature.
---
## Rule 3: Composite work best for tree structures, not graphs
---
## Category
Architecture
---
## Rule
Use Composite when the structure is a tree (no cycles). For graph structures (cycles), use Visitor or other patterns.
---
## Reason
Cycles in Composite cause infinite recursion; Composite relies on acyclic tree traversal.
---
## Bad Example
```php
// Cyclic reference — infinite recursion
$bundleA->add($bundleB);
$bundleB->add($bundleA);
```
---
## Good Example
```php
// Tree structure — no cycles
Category
├── Product (leaf)
├── Category (composite)
│   ├── Product (leaf)
│   └── Product (leaf)
└── Product (leaf)
```
---
## Exceptions
When the graph has no operations that traverse all nodes (cycle-safe operations).
---
## Consequences Of Violation
Infinite recursion, stack overflow.
