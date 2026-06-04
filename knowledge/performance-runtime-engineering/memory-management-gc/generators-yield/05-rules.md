---
## Rule Name

Use Generators for Large Data Processing Pipelines

## Category

Performance

## Rule

Use generators for processing large datasets that do not fit in memory. Never load the entire dataset into an array.

## Reason

A generator uses O(1) memory (~200 bytes) regardless of how many items it yields. Loading the same dataset into an array would consume memory proportional to the data size — 1M items would take ~32MB for the array alone.

## Bad Example

```php
$rows = [];
$handle = fopen('large.csv', 'r');
while (($row = fgetcsv($handle)) !== false) {
    $rows[] = $row;  // 1M rows = 100MB+ of array memory
}
```

## Good Example

```php
function readCsv(string $path): Generator {
    $handle = fopen($path, 'r');
    while (($row = fgetcsv($handle)) !== false) {
        yield $row;  // O(1) memory
    }
    fclose($handle);
}
foreach (readCsv('large.csv') as $row) {
    process($row);  // One row in memory at a time
}
```

## Exceptions

Data that must be accessed randomly or counted (`count()`) before processing.

## Consequences Of Violation

OOM errors processing large files, excessive memory allocation, server swap usage.

---

## Rule Name

Do Not Use iterator_to_array on Large Generators

## Category

Performance

## Rule

Never call `iterator_to_array()` on a generator that yields a large number of items.

## Reason

`iterator_to_array()` converts the entire generator into an array, negating the memory benefit that motivated using a generator in the first place. The entire dataset is now in memory.

## Bad Example

```php
$allItems = iterator_to_array(readCsv('large.csv'));  // 1M rows = 100MB+
```

## Good Example

```php
foreach (readCsv('large.csv') as $row) {  // One row at a time
    process($row);
}
```

## Exceptions

Small generators where the resulting array is guaranteed to fit in memory (<1000 items).

## Consequences Of Violation

OOM errors, same memory consumption as not using a generator, wasted generator complexity.

---

## Rule Name

Use yield from for Modular Pipeline Composition

## Category

Architecture

## Rule

Use `yield from` to compose processing pipelines from generator functions, with each generator handling one transformation.

## Reason

`yield from` delegates iteration to nested generators, enabling modular pipeline architecture. Each stage yields transformed values without intermediate storage, keeping memory O(1) while maintaining readable, testable code.

## Bad Example

```php
// Monolithic loop — hard to test, hard to modify
foreach (readJson('data.jsonl') as $item) {
    $processed = transform($item);
    if ($processed['active']) {
        save(extractFields($processed));
    }
}
```

## Good Example

```php
function filterActive(iterable $items): Generator {
    foreach ($items as $item) {
        if ($item['active']) yield $item;
    }
}
function extractFields(iterable $items): Generator {
    foreach ($items as $item) {
        yield ['id' => $item['id'], 'name' => $item['name']];
    }
}
foreach (extractFields(filterActive(readJson('data.jsonl'))) as $record) {
    save($record);
}
```

## Exceptions

Simple pipelines where modularity adds more complexity than benefit.

## Consequences Of Violation

Monolithic code that mixes concerns, hard-to-test processing logic, difficult to modify individual stages.

---

## Rule Name

Use yield from send for Coroutine Patterns

## Category

Architecture

## Rule

Use `$generator->send($value)` for bidirectional generator communication (coroutine patterns).

## Reason

`send()` allows pushing data into a running generator, enabling stateful processing patterns (running averages, stream parsing, rate limiters) while maintaining O(1) memory. The generator maintains state across yields.

## Bad Example

```php
// Accumulating state manually — error-prone
$runningTotal = 0;
$count = 0;
foreach ($measurements as $value) {
    $runningTotal += $value;
    echo $runningTotal / ++$count;  // Manual tracking
}
```

## Good Example

```php
function runningAverage(): Generator {
    $total = 0; $count = 0;
    while (true) {
        $value = yield $count > 0 ? $total / $count : 0;
        $total += $value;
        $count++;
    }
}
$avg = runningAverage();
foreach ($measurements as $value) {
    echo $avg->send($value);  // Generator maintains state
}
```

## Exceptions

Simple iteration patterns that do not require producer-consumer state management.

## Consequences Of Violation

Error-prone manual state tracking, duplicated accumulation logic across multiple code paths.

---

## Rule Name

Unset Large Generators Explicitly After Use

## Category

Reliability

## Rule

Call `unset($generator)` explicitly when a generator holds open file handles or database cursors and is not fully consumed.

## Reason

A generator's internal state includes all local variables, including open file handles and database connections. If the generator is abandoned mid-iteration, these resources remain open until the Generator object is garbage collected.

## Bad Example

```php
function readCsv(string $path): Generator {
    $handle = fopen($path, 'r');
    while (($row = fgetcsv($handle)) !== false) {
        yield $row;
    }
    fclose($handle);  // Never reached if iteration is interrupted
}
```

## Good Example

```php
$gen = readCsv('large.csv');
foreach ($gen as $row) {
    if (shouldStop($row)) {
        break;  // Generator not fully consumed
    }
}
unset($gen);  // Immediately closes the file handle
```

## Exceptions

Fully consumed generators that naturally reach completion and fclose().

## Consequences Of Violation

Resource leaks (open file handles, database cursors) persisting until GC runs, connection pool exhaustion.

---

## Rule Name

Use Generators for Large Datasets, Arrays for Small

## Category

Performance

## Rule

Use generators for datasets larger than 1000 items. Use arrays for smaller datasets where random access or multiple iterations are needed.

## Reason

Generator overhead per yield (~200ns) plus the function call cost may exceed the memory benefit for small datasets. Arrays are simpler, support random access, and can be iterated multiple times without re-creating.

## Bad Example

```php
// Generator for 50 items — overhead outweighs benefit
function getItems(): Generator {
    foreach (range(1, 50) as $i) { yield $i; }
}
```

## Good Example

```php
// Array for small datasets
function getItems(): array {
    return range(1, 50);
}
```

## Exceptions

API responses where streaming (one item at a time) is required regardless of dataset size.

## Consequences Of Violation

Unnecessary complexity and per-iteration overhead for trivially-sized datasets.
