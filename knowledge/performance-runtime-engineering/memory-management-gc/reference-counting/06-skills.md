# Skill: Manage PHP Reference Counting for Optimal Performance

## Purpose

Understand and work with PHP's reference counting system (zval refcount) to avoid unnecessary memory duplication and detect reference-related issues.

## When To Use

- Debugging unexpected memory growth from array/object copies
- Optimizing code that passes large data structures by value
- Understanding when copy-on-write triggers full duplication
- Working with references in foreach loops or function parameters

## When NOT To Use

- For code paths where data sizes are small (<1KB) — duplication cost is negligible
- When the application has no reference-related memory issues
- Without first confirming that reference counting is the bottleneck

## Prerequisites

- Understanding of PHP's zval structure and refcount field
- PHP 7.4+ runtime (refcount behavior is well-defined)
- Profiling or debugging capabilities

## Inputs

- Large data structures passed between functions
- Arrays modified after being passed by value
- Code that uses references in loops or function signatures
- refcount debugging data (debug_zval_refcounts or xdebug_debug_zval)

## Workflow (numbered steps)

1. Identify large data structures (>1MB) that are passed between functions or modified in place
2. Use `xdebug_debug_zval()` or `debug_zval_refcounts()`(PHP 8.4+) to inspect refcounts at key points
3. If refcount > 1 before modification, copy-on-write will duplicate the entire structure — refactor to avoid modification after sharing
4. For arrays passed to functions: use pass-by-reference (`&$array`) if the function modifies the array in place
5. For foreach loops: never use `foreach ($array as &$value)` if the array is used after the loop — use index-based modification instead
6. For objects: they are always passed by handle (refcount on the handle, not the object data) — modification does not copy the object
7. After refactoring, measure memory usage before and after to confirm the optimization
8. Document the reference counting patterns applied

## Validation Checklist

- [ ] Large data structures identified
- [ ] Refcounts inspected at key modification points
- [ ] Unnecessary copy-on-write duplications eliminated
- [ ] foreach-by-reference anti-pattern removed
- [ ] Function signatures use pass-by-reference where appropriate
- [ ] Memory usage measured before/after
- [ ] Patterns documented

## Common Failures

- **Using debug_zval_refcounts in production**: This function has overhead — use only in development
- **Over-optimizing small data**: Copy-on-write for a 1KB array is negligible — focus on multi-MB structures
- **Confusing object handles with object data**: Objects are not copied on assignment — only the handle refcount increments
- **Forgetting that refcount includes the variable itself**: A variable with a single reference has refcount=1 (variable) + potential interned = different semantics

## Decision Points

- Array passed to function and modified: use pass-by-reference (`&$array`)
- Array passed to function and read-only: pass by value is fine (refcount increments, no copy)
- Array modified after foreach: never use `&$value` in foreach — use index-based modification
- Object modification: no copy-on-write issue — objects are handle-based

## Performance Considerations

- Copy-on-write only copies when refcount > 1 AND the value is modified
- Array copy on write: O(n) where n is the number of elements — multi-MB arrays cost milliseconds to duplicate
- String copy on write: O(len) — long strings (100KB+) cost microseconds to duplicate
- Object modification: no copy overhead — handles are always passed by reference

## Security Considerations

- Pass-by-reference in functions can lead to unexpected side effects — use with care
- Objects passed by handle mean any code with a reference can modify the object — encapsulation matters
- References in long-running workers (Octane) can cause data leakage between requests

## Related Rules (from 05-rules.md)

- Never Modify Arrays in Foreach by Reference
- Prefer Pass-by-Value for Read-Only Parameters
- Use Pass-by-Reference for Large Mutable Arrays

## Related Skills

- Zval Structure and Reference Counting
- Copy-on-Write Mechanics
- By-Reference Implications
- PHP Memory Model

## Success Criteria

- Reference counting understood and applied to code optimization
- Unnecessary copy-on-write duplications identified and eliminated
- Memory usage reduced on targeted code paths
- Reference patterns documented for team standards
