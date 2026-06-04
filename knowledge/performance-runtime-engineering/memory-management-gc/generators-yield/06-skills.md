# Skill: Use Generators to Reduce Memory Usage in Large Dataset Processing

## Purpose

Replace memory-intensive array collections with generators to process large datasets with constant memory overhead.

## When To Use

- Processing thousands or millions of records from databases, files, or APIs
- Iterating over large datasets that do not fit in available memory
- Building pipelines where each element is processed independently
- Streaming data processing in Octane/long-running workers

## When NOT To Use

- When the dataset is small (<1000 elements) — generator overhead may exceed benefit
- When random access to elements is required (generators are forward-only)
- When the same dataset needs to be iterated multiple times (regenerate or cache)
- For data that needs to be sorted or filtered across all elements

## Prerequisites

- PHP 5.5+ runtime (generators available)
- Understanding of the yield keyword and generator functions
- Profiling showing memory usage from large array collections

## Inputs

- Dataset size (expected element count)
- Data source (database query, file, API response, computation)
- Processing pipeline (transformation, filtering, output)

## Workflow (numbered steps)

1. Identify array collections that accumulate the entire dataset before processing — these are candidates for generators
2. Create a generator function that yields elements one at a time instead of building an array
3. For database queries: use `yield $row` inside a cursor-based iteration, avoiding `->get()->all()` which loads all rows
4. For file processing: use `yield $line` with `fgets()` to stream lines instead of `file()` which loads the entire file
5. For API pagination: yield each page's items and fetch the next page only when the current page is exhausted
6. For computation pipelines: chain generators (filter generator -> transform generator -> output) for zero-copy processing
7. Replace the original foreach over the array with foreach over the generator
8. Measure memory usage before and after — should be O(1) instead of O(n)
9. Document the generator pattern for future dataset processing

## Validation Checklist

- [ ] Large array collections identified (candidates for generator conversion)
- [ ] Generator function(s) created
- [ ] Database cursor iteration used instead of loading all rows
- [ ] File streaming used instead of file() or file_get_contents()
- [ ] API pagination handled with lazy fetching
- [ ] Generator chaining applied for processing pipelines
- [ ] Memory usage measured (should show O(1) memory)
- [ ] Pattern documented

## Common Failures

- **Generator for random access**: Generators are forward-only — use arrays if you need random access
- **Wrapping an array in a generator**: `yield from $array` still holds the array in memory — stream from the source instead
- **Re-iterating a generator**: Generators are single-use — call the generator function again to re-iterate
- **Side effects in generator functions**: Same concerns as regular functions — generators are not inherently safer

## Decision Points

- Dataset <1000 elements: use array — simpler, no significant memory impact
- Dataset 1K-100K elements: generator recommended if memory is constrained
- Dataset >100K elements: generator essential — array would exceed memory_limit
- Multiple iterations over same dataset: regenerate each time or cache to temporary storage

## Performance Considerations

- Generator overhead per iteration: ~50ns — negligible
- Memory savings: O(n) to O(1) — the benefit grows with dataset size
- For 100K database rows (each 1KB): saving = 100MB
- Generator chaining adds minimal overhead vs building intermediate arrays
- Benchmark: 1M element processing with generator = 50-100MB peak vs 500MB+ for array

## Security Considerations

- Generators that yield data from external sources must validate each yielded value
- Generator functions that make API calls may have side effects — handle errors within the generator
- Database cursor-based generators must handle connection timeouts during iteration

## Related Rules (from 05-rules.md)

- Use Generators for Large Dataset Processing
- Never Load Entire Result Sets Into Memory
- Chain Generators for Processing Pipelines

## Related Skills

- Efficient Data Structures
- Array Memory Usage
- Object Memory Usage
- Octane Memory Management

## Success Criteria

- Large datasets processed with O(1) memory using generators
- Database cursors used instead of loading all rows
- File streaming used instead of loading entire files
- Memory usage reduction measured (typically 50-90% for targeted operations)
- Generator patterns documented for team use
