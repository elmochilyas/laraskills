## Rule 1: Builder separates the construction of a complex object from its representation
---
## Category
Architecture
---
## Rule
Use a Builder to construct complex objects step by step, allowing the same construction process to create different representations.
---
## Reason
Complex constructors with many parameters are hard to read and use; Builder makes construction readable and flexible.
---
## Bad Example
```php
$report = new Report(
    'Monthly Sales',       // title
    'pdf',                 // format
    'landscape',           // orientation
    true,                  // includeCharts
    false,                 // includeSummary
    true,                  // includeRawData
    'A4',                  // pageSize
    '2026-01',             // dateRange
    '#fff',                // backgroundColor
    '#000'                 // textColor
);
```
---
## Good Example
```php
$report = Report::builder()
    ->withTitle('Monthly Sales')
    ->asPdf()
    ->landscape()
    ->includeCharts()
    ->withPageSize('A4')
    ->withDateRange('2026-01')
    ->build();
```
---
## Exceptions
Simple objects with few parameters (use named constructor arguments).
---
## Consequences Of Violation
Unreadable constructors, telescoping constructors, inflexible construction.
---
## Rule 2: The Builder's `build()` method returns the constructed object
---
## Category
Architecture
---
## Rule
The Builder accumulates configuration via fluent methods and terminates with a `build()` method that creates and returns the final object.
---
## Reason
Calling `build()` makes the construction step explicit and allows the builder to validate the configuration before creating the object.
---
## Bad Example
```php
class ReportBuilder
{
    public function withTitle(string $title): self { /* ... */ }
    public function asPdf(): self { /* ... */ }
    // No build() method — getReport() called implicitly
    public function getTitle(): string { /* ... */ }
}
```
---
## Good Example
```php
class ReportBuilder
{
    private string $title = '';
    private string $format = 'pdf';

    public function withTitle(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function build(): Report
    {
        if (empty($this->title)) {
            throw new \InvalidArgumentException('Title is required');
        }
        return new Report($this->title, $this->format);
    }
}
```
---
## Exceptions
When the Builder is used for immutable object configuration without validation.
---
## Consequences Of Violation
Unclear construction boundaries, missing validation.
---
## Rule 3: Use fluent interface for readability
---
## Category
Architecture
---
## Rule
Builder methods should return `self` (or the builder) to allow method chaining (fluent interface).
---
## Reason
Fluent interface makes builder usage readable and concise.
---
## Bad Example
```php
$builder = new ReportBuilder();
$builder->withTitle('Monthly Sales');
$builder->asPdf();
$builder->landscape();
// No chaining — verbose
```
---
## Good Example
```php
$report = Report::builder()
    ->withTitle('Monthly Sales')
    ->asPdf()
    ->landscape()
    ->build();
```
---
## Exceptions
When the builder has very few methods (< 3) where chaining adds minimal value.
---
## Consequences Of Violation
Verbose builder usage, unreadable construction.
