## Rule 1: Bridge decouples an abstraction from its implementation so they can vary independently
---
## Category
Architecture
---
## Rule
Split a class into two separate hierarchies: abstraction (what the class does) and implementation (how it does it). Connect them via composition.
---
## Reason
Without Bridge, adding new variants to either hierarchy requires multiplying classes; Bridge allows each hierarchy to grow independently.
---
## Bad Example
```php
class WindowsPdfRenderer { /* ... */ }
class WindowsHtmlRenderer { /* ... */ }
class MacPdfRenderer { /* ... */ }
class MacHtmlRenderer { /* ... */ }
// 2 OS × 2 formats = 4 classes. Add 1 OS → 3 more classes.
```
---
## Good Example
```php
interface Renderer
{
    public function render(string $content): string;
}

class WindowsRenderer implements Renderer { /* ... */ }
class MacRenderer implements Renderer { /* ... */ }

abstract class Document
{
    public function __construct(protected Renderer $renderer) {}
    abstract public function render(): string;
}

class PdfDocument extends Document
{
    public function render(): string
    {
        return $this->renderer->render($this->content);
    }
}
// 2 OS + 2 formats = 4 classes. Add 1 OS → 1 new class.
```
---
## Exceptions
When only one dimension of variation exists (no independent hierarchies).
---
## Consequences Of Violation
Class explosion, rigid hierarchies, OCP violation.
---
## Rule 2: Bridge uses composition (not inheritance) to connect abstraction and implementation
---
## Category
Architecture
---
## Rule
The abstraction holds a reference to the implementation interface, delegating implementation-specific work to it.
---
## Reason
Composition allows changing the implementation at runtime and avoids the rigidity of inheritance-based coupling.
---
## Bad Example
```php
abstract class Document
{
    // No composition — inheritance-based only
    abstract protected function renderPdf(): string;
    abstract protected function renderHtml(): string;
}
```
---
## Good Example
```php
abstract class Document
{
    public function __construct(
        protected Renderer $renderer // composition
    ) {}
    abstract public function render(): string;
}
```
---
## Exceptions
When the implementation is intrinsic to the abstraction and never varies.
---
## Consequences Of Violation
Rigid inheritance hierarchies, runtime inflexibility.
---
## Rule 3: Bridge is useful for cross-platform or multi-format scenarios
---
## Category
Architecture
---
## Rule
Use Bridge when you need to support multiple platforms (Windows/Mac/Linux), formats (PDF/HTML/CSV), or data sources (SQL/NoSQL/API) for the same abstraction.
---
## Reason
Bridge's separation of abstraction and implementation is ideal for scenarios with orthogonal variation dimensions.
---
## Bad Example
```php
class PaymentProcessor
{
    public function process(Money $amount): void
    {
        // Mixed: Stripe-specific API calls
        $this->stripe->charge($amount);
    }
}
```
---
## Good Example
```php
interface PaymentGateway
{
    public function charge(Money $amount): ChargeResult;
}

class PaymentProcessor
{
    public function __construct(
        private PaymentGateway $gateway
    ) {}
    public function process(Money $amount): ChargeResult
    {
        return $this->gateway->charge($amount);
    }
}
```
---
## Exceptions
When only one dimension of variation exists (Bridge adds unnecessary indirection).
---
## Consequences Of Violation
Class explosion, duplicated implementation logic.
