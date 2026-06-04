## Rule 1: Define the algorithm skeleton in a base class; subclasses implement varying steps
---
## Category
Architecture
---
## Rule
The template method (in the base class) defines the algorithm structure as a sequence of method calls; subclasses override specific steps without changing the structure.
---
## Reason
Template Method avoids code duplication in the algorithm structure while allowing subclasses to customize behavior at specific points.
---
## Bad Example
```php
class CsvReport
{
    public function generate(): string
    {
        $data = DB::table('orders')->get();
        $csv = $this->toCsv($data);
        Storage::put('report.csv', $csv);
        return $csv;
    }
}
class PdfReport
{
    public function generate(): string
    {
        $data = DB::table('orders')->get();
        $pdf = $this->toPdf($data);
        Storage::put('report.pdf', $pdf);
        return $pdf;
    }
}
```
---
## Good Example
```php
abstract class ReportGenerator
{
    final public function generate(): string
    {
        $data = $this->fetchData();
        $formatted = $this->format($data);
        $this->export($formatted);
        return $formatted;
    }

    abstract protected function fetchData(): array;
    abstract protected function format(array $data): string;
    protected function export(string $content): void
    {
        // default: do nothing
    }
}
```
---
## Exceptions
When the varying steps outnumber the fixed algorithm steps (consider Strategy pattern instead).
---
## Consequences Of Violation
Duplicated algorithm structure, scattered variations.
---
## Rule 2: Make the template method final to prevent subclasses from changing the algorithm
---
## Category
Architecture
---
## Rule
The template method should be `final` (or non-overridable) to ensure the algorithm structure is preserved.
---
## Reason
If subclasses can override the template method, the algorithm skeleton is not fixed, defeating the pattern's purpose.
---
## Bad Example
```php
abstract class DataImporter
{
    public function import(string $file): void // not final
    {
        $data = $this->parse($file);
        $this->validate($data);
        $this->save($data);
    }
}

class LazyImporter extends DataImporter
{
    public function import(string $file): void // overrides entire algorithm
    {
        // Skips validation step — breaks contract
    }
}
```
---
## Good Example
```php
abstract class DataImporter
{
    final public function import(string $file): void // final
    {
        $data = $this->parse($file);
        $this->validate($data);
        $this->save($data);
    }

    abstract protected function parse(string $file): array;
    protected function validate(array $data): void { /* default */ }
    abstract protected function save(array $data): void;
}
```
---
## Exceptions
When the template method design intentionally allows complete algorithm replacement (rare; use Strategy instead).
---
## Consequences Of Violation
Algorithm structure overridden, invariants bypassed.
---
## Rule 3: Provide default implementations for optional steps; keep required steps abstract
---
## Category
Architecture
---
## Rule
Required steps (must be customized) should be `abstract`. Optional steps (hooks) should have a default no-op or sensible default implementation.
---
## Reason
Abstract steps force subclasses to implement them; optional steps with defaults allow subclasses to only override what they need.
---
## Bad Example
```php
abstract class Report
{
    abstract protected function fetchData(): array;
    abstract protected function format(array $data): string;
    abstract protected function beforeFormat(): void; // should be optional
    abstract protected function afterFormat(): void; // should be optional
}
```
---
## Good Example
```php
abstract class Report
{
    abstract protected function fetchData(): array;
    abstract protected function format(array $data): string;

    protected function beforeFormat(): void { /* optional hook */ }
    protected function afterFormat(): void { /* optional hook */ }
}
```
---
## Exceptions
When the hook is structurally required by the algorithm (not really optional).
---
## Consequences Of Violation
Extra implementation burden for optional steps, unnecessary subclass code.
---
## Rule 4: Use Template Method for algorithms, not for data structures
---
## Category
Architecture
---
## Rule
Reserve Template Method for behavioral algorithms with varying steps. Do not use it for data structures (that's the Builder pattern).
---
## Reason
Template Method applied to data structures produces rigid hierarchies that are hard to compose.
---
## Bad Example
```php
abstract class OrderBuilder
{
    final public function build(): Order
    {
        $order = new Order();
        $this->addItems($order);
        $this->addPayment($order);
        $this->addShipping($order);
        return $order;
    }
    abstract protected function addItems(Order $order): void;
    abstract protected function addPayment(Order $order): void;
}
```
---
## Good Example
```php
// Builder pattern is more appropriate for object construction
class OrderBuilder
{
    public function withItems(array $items): self { /* ... */ }
    public function withPayment(PaymentData $payment): self { /* ... */ }
    public function build(): Order { /* ... */ }
}
```
---
## Exceptions
When the object construction follows a strict sequence that must be enforced.
---
## Consequences Of Violation
Rigid object construction, hard to compose, builder misuse.
