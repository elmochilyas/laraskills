# Generators and Yield — Memory-Efficient Iteration, IteratorAggregate, Async Patterns

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Generators and Yield — Memory-Efficient Iteration, IteratorAggregate, Async Patterns |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

PHP generators provide memory-efficient iteration by yielding values one at a time without building an array in memory. Instead of allocating a collection and returning it, a generator function `yield`s each value as it's produced, then suspends execution until the next value is requested. Memory usage is O(1) regardless of the number of values yielded. Generators implement the `Iterator` interface internally, making them compatible with `foreach` loops and array functions. PHP 8.1 introduced `yield from` improvements and fibers, expanding generators' role in async and concurrent programming patterns.

## Core Concepts

- **Generator function**: Any function containing `yield`. Returns a `Generator` object instead of a value. The function body executes lazily — code runs only when the generator is iterated.
- **yield**: Pauses execution and returns a value. The generator resumes from the same point when the next value is requested.
- **yield from**: Delegates to another generator, traversable, or array. Syntactic sugar for nested iteration without manual looping.
- **Generator object**: Implements `Iterator` — `current()`, `next()`, `key()`, `valid()`, `rewind()`. Can also be used as a coroutine: `send()` sends a value back to the generator, `throw()` throws an exception into the generator.
- **Generator return**: A generator can `return` a final value (accessible via `getReturn()`), separate from yielded values. Useful for aggregation results.
- **Memory O(1)**: A generator yielding 10 values or 10 million values uses approximately the same memory (~200 bytes for the Generator object).
- **Fibers (PHP 8.1+)**: Built on generator-like suspension mechanics. Fibers provide full coroutines with the ability to suspend from nested function calls.
- **yield as coroutine**: `$generator->send($value)` passes a value back into the generator, updating `$value` at the yield expression.

## When To Use

- You are processing large files (CSV, JSON, log) line by line without loading the entire file into memory.
- You are generating large datasets for export (CSV generation, API pagination).
- You need to iterate over a data source that doesn't fit in memory (database cursor, API stream).
- You want to implement lazy evaluation of expensive operations.
- You are building queue worker iterations, progress reporting, or streaming responses.
- You need simple coroutine behavior (send values back into a running function).

## When NOT To Use

- Your dataset is small (<1000 items) — the overhead of generator suspension exceeds the memory benefit.
- You need random access to data — generators are forward-only, one-pass iterators.
- You need to iterate the same data multiple times — generators are single-use (call the function again for another pass).
- You need array functions that require a count or index (`count()`, `array_map()`, `array_filter()` on the result).
- The overhead of function calls between yields outweighs the memory savings (typically <10µs per yield).

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use generators for large data processing pipelines | Memory usage stays flat at ~200 bytes regardless of data volume. Prevents memory_limit fatal errors. |
| Combine generators with `yield from` for modular pipelines | Each processing step is a generator that can be composed. Readable, testable, and memory-efficient. |
| Use `return` for final aggregation values | The return value (accessible via `getReturn()`) communicates completion state without polluting the iteration stream. |
| Use `$generator->send()` for bidirectional communication | Enables "push" patterns — send new data into a running generator for incremental processing. |
| Use `iterator_to_array()` only for small datasets | Converts the entire generator to an array, negating the memory benefit. Only use when you need random access. |
| Wrap generators in `IteratorIterator` for additional functionality | Adds `count()`, array conversion, and rewind capability while preserving lazy evaluation. |
| Consider Fibers for complex state machines or async flows (PHP 8.1+) | Fibers provide full coroutine suspension with the ability to suspend from nested calls — generators only suspend at the `yield` expression. |

## Architecture Guidelines

- **Pipeline pattern**: Generator → Filter Generator → Transform Generator → Consumer. Each step yields modified values without intermediate storage. Memory scales with the pipeline depth, not the data size.
- **Generator for streams**: When reading a CSV file, the generator reads one line at a time, yields it, and the consumer processes it. The file handle is held open but only one line is in memory.
- **Generator for database cursors**: Yield rows from a Dbal `fetchOne()` or Eloquent `chunk()` cursor. Each row is yielded one at a time without buffering all results.
- **Generator for API pagination**: Yield items from a paginated API, fetching the next page only when all items from the current page have been yielded and consumed.
- **Coroutine pattern**: Use `$gen->send()` to push data into a generator that maintains state across iterations. Useful for streaming parsers, rate limiters, or running totals.
- **Generator rewind**: A Generator cannot be rewound. Calling `rewind()` after iteration starts throws an exception. Create a new generator by calling the generator function again.

## Performance Considerations

- Generator overhead: ~200ns per `yield` (function call + state save/restore). Array iteration: ~100ns per element (no function call).
- Memory savings: For 1M items, a generator uses ~200 bytes vs ~32MB for an array. The memory savings (32MB) far outweigh the CPU overhead (200ns × 1M = 200ms).
- Generator function compilation: The generator function is compiled once, not per-call. Repeated calls reuse the compiled opcode array.
- Generator object GC: When a generator is no longer referenced, it's GC'd along with its internal state. If the generator holds large resources (file handles), closing early is important.
- Nesting with `yield from`: Each level adds ~100ns overhead per yield. For deep pipelines (3+ levels), consider flattening.

## Security Considerations

- Generator resource leaks: If a generator holds file handles or database cursors and is not fully consumed, the resources remain open until the Generator object is destroyed. Always `unset()` generators or ensure they complete.
- Generator sandboxing: A generator's yield can throw exceptions from the consumer via `$gen->throw()`. Handle exceptions inside generators.
- Generator state persistence: A stored Generator object preserves its execution state. Used intentionally for coroutines, but if stored accidentally, it holds references to all variables in its scope.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Using `iterator_to_array()` on large generators | Converts the generator's values back into an array. | Needing array features (count, random access). | Memory is back to array-level usage, negating the generator benefit. | Restructure to process sequentially without storing all values. |
| Creating infinite generators without a break condition | `while (true) { yield ... }` without a consuming break. | Not considering generator termination. | Infinite loop, CPU spinning forever. | Always have a termination condition in generator functions. |
| Assuming generators can be rewound | Calling `rewind()` on an already-iterated generator. | Generators implement Iterator but have limited rewind semantics. | RuntimeException on rewind. | Call the generator function again for a fresh iteration. |
| Not `unset()`-ing generators holding resources | File handles or DB cursors held open until generator is GC'd. | Forgetting that generator state includes open resources. | Resource leaks until GC runs. | `unset($generator)` explicitly when done. |
| Using yield for small datasets | Generator overhead exceeds the memory benefit. | Applying the "always use generators" pattern blindly. | Slower than simple array return for small datasets. | Measure. For <1000 items, arrays are simpler and faster. |

## Anti-Patterns

- **Generator inside hot loops**: If a generator function is called 1M times (creating 1M Generator objects), the overhead of object creation dominates. Use generators for the values, not for the calling structure.
- **Deeply nested `yield from` chains**: Each delegation adds overhead and complexity. 1–2 levels of delegation is ideal. 5+ levels is hard to debug.
- **Generator for data that must be sorted**: Generators yield in order. If the consumer needs sorted data, the entire dataset must be in memory. Generators are not suitable for sort-based operations.
- **Generator as a replacement for all arrays**: Arrays are simpler, faster for small datasets, and support random access. Generators are a tool for specific memory-constrained scenarios.

## Examples

```php
// Generator for large CSV processing
function readCsv(string $path): Generator {
    $handle = fopen($path, 'r');
    while (($row = fgetcsv($handle)) !== false) {
        yield $row;
    }
    fclose($handle);
}

foreach (readCsv('/path/to/1m-rows.csv') as $row) {
    processRow($row);
}
// Memory: ~200 bytes for the Generator object + 1 row buffer
```

```php
// Pipeline with yield from
function readLargeJson(string $path): Generator {
    $handle = fopen($path, 'r');
    while ($line = fgets($handle)) {
        yield json_decode($line, true);
    }
    fclose($handle);
}

function filterActive(iterable $items): Generator {
    foreach ($items as $item) {
        if ($item['active']) {
            yield $item;
        }
    }
}

// Composition — no intermediate arrays
foreach (filterActive(readLargeJson('data.jsonl')) as $activeItem) {
    processItem($activeItem);
}
```

```php
// Coroutine pattern with send()
function runningAverage(): Generator {
    $total = 0;
    $count = 0;
    while (true) {
        $value = yield $count > 0 ? $total / $count : 0;
        $total += $value;
        $count++;
    }
}

$avg = runningAverage();
foreach ($measurements as $value) {
    echo $avg->send($value) . PHP_EOL;
}
```

## Related Topics

- Efficient Data Structures for Memory
- Array Memory Usage
- Copy-on-Write Mechanics
- Fibers and Coroutine Patterns
- Iterator and Traversable Interfaces

## AI Agent Notes

- Generators are PHP's answer to "how do I process data too large for memory?" — the answer is: process one item at a time. This is a fundamental shift from array-collection thinking.
- The most practical generator use case is CSV/JSONL file processing. A 1GB CSV file would require 1GB+ memory as an array; a generator processes it with ~few KB.
- Generator pipelines (chain of `yield from`) are PHP's version of functional programming stream operations. Each stage transforms the data without intermediate storage.
- For Laravel developers: Eloquent's `chunk()`, `cursor()`, and `lazy()` are all generator-based. They prevent loading all results into memory.

## Verification

- [ ] Write a generator that reads a large file and verify memory stays flat regardless of file size.
- [ ] Compare memory: array version vs generator version for returning 100K items.
- [ ] Test `yield from` delegation: chain 3 generators and verify memory remains O(1).
- [ ] Verify generator cannot be rewound: test calling `rewind()`.
- [ ] Test `getReturn()`: verify return values are accessible after iteration completes.
- [ ] Test `send()` pattern: implement a simple coroutine and verify bidirectional communication.
- [ ] Document generator usage patterns in your application.
