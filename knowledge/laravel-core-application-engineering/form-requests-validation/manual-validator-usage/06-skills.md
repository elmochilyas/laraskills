# Skill: Validate Input in Non-HTTP Contexts Using Manual Validator

## Purpose
Use `Validator::make()` to validate input in CLI commands, queued jobs, scheduled tasks, and domain actions where FormRequest auto-validation is not available.

## When To Use
- CLI commands that accept arguments or options
- Queued jobs that process external data
- Scheduled tasks that handle file imports or API responses
- Domain actions that receive data from non-HTTP sources
- Batch processing requiring independent validation per record

## When NOT To Use
- HTTP controller actions (use FormRequests)
- Simple validation in existing FormRequest contexts
- When the validation is trivially simple (1-2 rules)

## Prerequisites
- Laravel validation rules and custom rules available
- Understanding of `Validator::make()` and the `Validator` class API

## Inputs
- Data array to validate
- Validation rules array
- Optionally: custom messages and attribute names

## Workflow
1. Import `Illuminate\Support\Facades\Validator`
2. Call `Validator::make($data, $rules, $messages, $attributes)` with the input data
3. Check the result: `$validator->fails()` gates business logic
4. If validation fails, throw `ValidationException` for consistent error handling
5. If validation passes, use `$validator->validated()` to get safe data
6. For batch operations, construct the Validator once and use `setData()` per item
7. Handle authorization separately via Gates/Policies (manual Validator has no `authorize()`)
8. Keep rules co-located with the action/command that uses them

## Validation Checklist
- [ ] `Validator::make()` used for non-HTTP input validation
- [ ] `$validator->fails()` always checked before proceeding with data
- [ ] `ValidationException` thrown on failure (not generic exceptions)
- [ ] Authorization handled separately via Gates/Policies
- [ ] Batch validation uses `setData()` to reuse Validator instance
- [ ] Rules co-located with the action (not in separate rule files for single use)
- [ ] Tests cover both pass and fail paths

## Common Failures
- Skipping validation entirely in CLI commands or jobs — invalid data enters system
- Not checking `$validator->fails()` — assumes validation always passes
- Forgetting to handle authorization — manual Validator has no `authorize()` method
- Creating new Validator per item in batch operations — performance overhead
- Throwing generic exceptions instead of `ValidationException` — inconsistent error handling

## Decision Points
- Use `$validator->fails()` + manual handling vs `$validator->validate()` (auto-throws)
- Create new Validator per item vs reuse with `setData()` based on batch size
- Inline rules vs extracted rule classes based on reuse across contexts

## Performance Considerations
- Validator construction is lightweight (~0.1ms)
- For batch validation (1000+ items), use `setData()` to reuse the Validator
- Database rules (`unique`, `exists`) add per-item query overhead
- Consider caching results of DB-querying rules for batch operations

## Security Considerations
- Manual validation runs the same rule engine as FormRequests — same security guarantees
- Authorization must be added separately — Gate/Policy checks are not automatic
- Ensure CLI command input is validated even when input is from "internal" sources
- `ValidationException` is handled by Laravel's exception handler — safe for API/CLI

## Related Rules
- Rule 1: Always Validate Input in Non-HTTP Contexts
- Rule 2: Always Check $validator->fails() Before Proceeding
- Rule 3: Handle Authorization Separately for Manual Validators
- Rule 4: Throw ValidationException for Consistent Error Handling
- Rule 5: Use setData() for Batch Validation
- Rule 6: Keep Validation Rules Co-Located with the Action or Command

## Related Skills
- Apply Declarative Conditional Validation Rules
- Test Validation Boundaries via HTTP Integration Tests

## Success Criteria
- Non-HTTP input is validated before processing
- Invalid data produces appropriate validation errors through `ValidationException`
- Authorization is explicitly checked for sensitive operations
- Batch validation efficiently processes large datasets
- Error handling is consistent with HTTP validation errors
- Tests cover both valid and invalid input scenarios

---

# Skill: Perform Batch Validation with Repeated Validator Use

## Purpose
Validate multiple data records (CSV rows, API batch payloads, file imports) efficiently by reusing a single Validator instance with `setData()`.

## When To Use
- CSV or spreadsheet file imports with many rows
- API batch endpoints accepting arrays of records
- Processing queued job batches with independent validation per item
- Any scenario validating 10+ similar data items

## When NOT To Use
- Single-record validation (use standard Validator::make)
- When each record has different validation rules
- When validation rules change between records

## Prerequisites
- Understanding of `Validator::make()` and `setData()`
- Batch data source (CSV, JSON array, collection)

## Inputs
- Array of data items (each item is an associative array)
- Validation rules (same for all items)
- Callback for success and failure handling per item

## Workflow
1. Define the validation rules for a single item
2. Construct the Validator once with empty data and the rules: `Validator::make([], $rules)`
3. Iterate over the batch data
4. For each item, call `$validator->setData($item)` to update the data
5. Check `$validator->fails()` for the current item
6. On failure: log error, collect failed items, or report per-item
7. On success: process `$validator->validated()` for the item
8. Handle authorization separately per item if needed

## Validation Checklist
- [ ] Validator constructed once, reused via `setData()`
- [ ] `$validator->fails()` checked for each item
- [ ] Success and failure handled per item (not abort on first failure)
- [ ] Authorization (if needed) checked per item
- [ ] Error reporting provides item-level context (row number, identifier)
- [ ] Tests cover both pass and fail paths for batch validation

## Common Failures
- Creating new Validator per item in large batches — unnecessary overhead
- Not checking `fails()` per item — assumes all items are valid
- Aborting the entire batch on the first validation failure
- Not resetting validator state between items (values carry over)
- Forgetting authorization when processing per-item

## Decision Points
- Continue on failure (collect errors) vs abort on first failure
- Process items sequentially vs in batches with error accumulation
- Use `setData()` vs construct new Validator — based on batch size

## Performance Considerations
- Reusing Validator saves rule parsing overhead for each item
- For 1000+ items, `setData()` is significantly faster than new Validator per item
- Database rules execute per-item — consider caching or pre-loading reference data
- Memory: failed items list may grow large — stream or batch if needed

## Security Considerations
- Each item is independently validated — malicious data in one item cannot affect others
- Authorization checks must be per-item if access varies
- Failed items should not leak information about valid items
- Ensure error reporting doesn't expose sensitive item data

## Related Rules
- Rule 5: Use setData() for Batch Validation

## Related Skills
- Validate Input in Non-HTTP Contexts Using Manual Validator
- Test Validation Boundaries via HTTP Integration Tests

## Success Criteria
- All items in the batch are validated independently
- Validator is constructed once and reused for all items
- Per-item errors are collected and reported without aborting the batch
- Performance is acceptable for the expected batch size
- Authorization (if needed) is checked for each item
