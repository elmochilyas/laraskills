## Rule 1: Abstract Factory provides an interface for creating families of related products
---
## Category
Architecture
---
## Rule
Define an interface with creation methods for each product in a family; concrete factories implement the interface to create products for a specific variant.
---
## Reason
Abstract Factory ensures that products from the same family are used together, preventing incompatible combinations.
---
## Bad Example
```php
// UI widgets created inconsistently
$button = new WindowsButton();
$menu = new MacMenu(); // mismatch — Windows button with Mac menu
```
---
## Good Example
```php
interface UIFactory
{
    public function createButton(): Button;
    public function createMenu(): Menu;
    public function createDialog(): Dialog;
}

class WindowsUIFactory implements UIFactory
{
    public function createButton(): Button { return new WindowsButton(); }
    public function createMenu(): Menu { return new WindowsMenu(); }
    public function createDialog(): Dialog { return new WindowsDialog(); }
}

class MacUIFactory implements UIFactory
{
    public function createButton(): Button { return new MacButton(); }
    public function createMenu(): Menu { return new MacMenu(); }
    public function createDialog(): Dialog { return new MacDialog(); }
}
```
---
## Exceptions
When only one product family exists (use Simple Factory or Factory Method).
---
## Consequences Of Violation
Inconsistent product families, incompatible product combinations.
---
## Rule 2: Abstract Factory is often implemented as a singleton
---
## Category
Architecture
---
## Rule
Typically, only one concrete factory instance is needed per application context; the factory itself is often a singleton or registered in DI as a shared instance.
---
## Reason
The factory selection (which family to use) is usually a configuration decision made once.
---
## Bad Example
```php
// Creating new factory instances unnecessarily
$factory = new WindowsUIFactory(); // created every time
```
---
## Good Example
```php
// Registered as singleton in DI container
$this->app->singleton(UIFactory::class, WindowsUIFactory::class);
// Or:
class UIFactoryProvider
{
    public static function getFactory(): UIFactory
    {
        return match (PHP_OS_FAMILY) {
            'Windows' => new WindowsUIFactory(),
            'Darwin' => new MacUIFactory(),
            default => new LinuxUIFactory(),
        };
    }
}
```
---
## Exceptions
When different parts of the application need different factories simultaneously.
---
## Consequences Of Violation
Unnecessary factory instance creation, inconsistent family selection.
---
## Rule 3: Adding a new product type requires extending all factories (violates OCP)
---
## Category
Architecture
---
## Rule
Abstract Factory is OCP-violating by nature—adding a new product to the family requires adding a creation method to the interface and all concrete factories.
---
## Reason
This tradeoff is acceptable when the product family is stable (rarely changes). If product types change frequently, consider other patterns.
---
## Bad Example
```php
// Adding Checkbox product requires modifying:
// - UIFactory interface (add createCheckbox)
// - WindowsUIFactory (implement)
// - MacUIFactory (implement)
// - LinuxUIFactory (implement)
```
---
## Good Example
```php
// Accept the tradeoff when product family is stable
// OR use Abstract Factory variant with registry/configuration
```
---
## Exceptions
When the product family changes frequently (use Builder or Prototype instead).
---
## Consequences Of Violation
OCP violation when adding new product types, changes cascade to all factories.
