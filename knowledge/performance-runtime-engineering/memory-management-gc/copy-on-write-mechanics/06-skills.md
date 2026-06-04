# Skill: Apply Copy-on-Write Understanding to Avoid Unnecessary Data Duplication

## Purpose

Leverage PHP's copy-on-write (COW) mechanism to share data between variables efficiently and avoid triggering full copies when modifications are made.

## When To Use

- Passing large arrays/strings between functions
- Assigning variables to other variables (creating aliases)
- Looping over large arrays that may be modified
- Debugging unexpected memory spikes from array duplication

## When NOT To Use

- For small data (<1KB) where COW cost is negligible
- When readability would suffer from the optimization
- Without profiling to confirm COW is causing memory issues

## Prerequisites

- Understanding that PHP uses COW for non-reference variables
- Knowledge that refcount > 1 triggers full copy on modification
- Profiling showing unexpected memory from data duplication

## Inputs

- Code that assigns large arrays/strings to multiple variables
- Functions that receive large arrays and may modify them
- Foreach loops that modify array values

## Workflow (numbered steps)

1. Identify places where large arrays/strings (>100KB) are assigned to multiple variables or passed to functions
2. Check if any of the variables are modified after assignment — COW only triggers on modification
3. If modification occurs after multiple references exist, the data is fully duplicated at that point
4. To avoid the copy: use references (`&`) for variables that will be modified, or refactor to avoid modifying shared data
5. For foreach loops that modify array values: use index-based modification instead of `foreach ($array as &$value)`
6. For function parameters that are modified: use pass-by-reference (`&$param`)
7. For read-only sharing: no action needed — COW means zero cost until modification
8. After restructuring, measure memory before/after to confirm COW avoidance
9. Document the COW patterns applied

## Validation Checklist

- [ ] Large shared data structures identified (arrays, strings)
- [ ] Modification points after sharing identified
- [ ] Pass-by-reference used where modification is necessary
- [ ] foreach-by-reference anti-pattern removed
- [ ] Read-only sharing left as-is (no copy cost)
- [ ] Memory reduction measured
- [ ] COW patterns documented

## Common Failures

- **Applying references where not needed**: References prevent COW optimization — use them only when modification is necessary
- **Not understanding foreach-by-reference danger**: `foreach ($array as &$value)` leaves the reference active after the loop — unset it after
- **Forgetting objects are not COW**: Object handles are always shared — modification through any handle modifies the same instance
- **Assuming COW applies to all types**: Scalars are inline (no heap allocation) — COW does not apply to them in the same way

## Decision Points

- Array shared as read-only: no action needed — zero copy cost
- Array shared then modified by one writer: use reference for the writer, or restructure to avoid sharing before modification
- String shared then modified: COW triggers full string copy — consider using string builders or array+implode
- Object shared: COW does not apply to object data (only to the handle) — objects are always shared
- Function receives array and modifies it: use pass-by-reference (`&$array`)

## Performance Considerations

- COW refcount increment: ~5ns — negligible
- COW full copy of 1MB array: ~1-5ms — significant for hot paths
- COW full copy of 100KB string: ~100-500µs
- Object modification through any handle: zero copy cost (handles are always shared)
- Reference assignment: zero cost (just changes the symbol table entry)

## Security Considerations

- References can cause unintended data sharing between scopes
- Modifying a reference in a function affects the caller's variable — unexpected side effects
- In Octane, shared data via references can cause cross-request data contamination
- Always use references intentionally and document their usage

## Related Rules (from 05-rules.md)

- Never Modify Arrays in Foreach by Reference
- Prefer Pass-by-Value for Read-Only Parameters
- Use Pass-by-Reference for Large Mutable Arrays

## Related Skills

- Zval Structure and Reference Counting
- By-Reference Implications
- Reference Counting and Refcount Lifecycle
- Array Memory Usage

## Success Criteria

- Copy-on-write mechanism understood and applied
- Unnecessary full copies identified and eliminated
- References used only where modification is necessary
- Memory usage reduced on targeted code paths
- COW patterns documented for team
