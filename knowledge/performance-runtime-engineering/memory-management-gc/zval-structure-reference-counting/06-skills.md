# Skill: Leverage Zval Structure Knowledge for Memory Debugging

## Purpose

Use understanding of PHP's zval (Zend Value) structure — type_info, refcount, and value union — to debug memory issues and write optimized code.

## When To Use

- Debugging unexpected memory behavior (variables not freed when expected)
- Understanding why certain operations are faster/slower
- Writing PHP extensions or working with PHP internals
- Optimizing hot-path code with deep memory understanding

## When NOT To Use

- For routine PHP development where zval internals are not needed
- Without first having profiling data that confirms memory optimization is needed
- For application-level code that does not manipulate raw memory

## Prerequisites

- PHP 7.4+ runtime (zval structure is stable)
- Understanding of C struct concepts (union, bitfield)
- Debugging tools: xdebug_debug_zval(), debug_zval_refcounts() (PHP 8.4+)

## Inputs

- PHP code with suspected reference counting issues
- debug_zval_refcounts() output
- Code that modifies variables after assignment

## Workflow (numbered steps)

1. For a suspicious variable, inspect its zval structure using `debug_zval_refcounts($var)` (PHP 8.4+) or `xdebug_debug_zval('varName')`
2. Understand the output: refcount shows how many symbols/containers reference the same zval
3. If refcount > 1 and the code modifies the variable, copy-on-write will trigger a full copy — verify by measuring memory before and after modification
4. For arrays: if refcount > 1 before modification, the entire array is duplicated on write — consider using reference assignment
5. For objects: refcount applies to the object handle, not the object data — modification does not copy the object
6. For strings: refcount > 1 before modification triggers string duplication — use caution with large strings
7. Use this knowledge to refactor code that triggers unexpected copy-on-write duplication
8. Document the zval representation patterns for the team

## Validation Checklist

- [ ] debug_zval_refcounts() or xdebug_debug_zval() used to inspect refcounts
- [ ] Unexpected copy-on-write duplications identified
- [ ] Code refactored to avoid unnecessary copies
- [ ] Memory usage verified after refactoring
- [ ] Zval structure characteristics documented

## Common Failures

- **Misreading debug_zval_refcounts output**: The refcount in debug functions may include the temporary reference from the debug function itself — compare with and without the debug call
- **Over-optimizing based on refcount**: A refcount of 2 with a 10-element array is not worth optimizing — focus on multi-MB structures
- **Forgetting about interned strings**: Interned strings have special refcount semantics (refcount=0 or special flag) — they are never freed
- **Not considering the GC flag**: The zval type_info includes a GC flag that marks collectable cycles — relevant for circular reference debugging

## Decision Points

- refcount = 1: no copy-on-write concerns — modification is done in-place
- refcount > 1, small data (<1KB): copy-on-write cost is negligible — not worth optimizing
- refcount > 1, large data (>100KB): avoid modification — or use reference assignment to share
- refcount > 1 for objects: objects are handle-based — modification does not copy the object
- refcount with GC flag set: cycle detection is active — relevant for long-running processes

## Performance Considerations

- zval size: 16 bytes for scalars (inline), 16 bytes for pointers to compounds
- refcount increment/decrement: ~5ns atomic operation
- Copy-on-write full copy: O(n) for arrays, O(len) for strings
- Object handle copy: 8 bytes (pointer) — always cheap
- Interned strings: refcount check is skipped — they are effectively immortal

## Security Considerations

- zval internals are an implementation detail — no direct security implications
- debug functions should never be used in production (memory and performance overhead)
- Understanding zval helps prevent type confusion bugs in extension code

## Related Rules (from 05-rules.md)

- Prefer Scalar Types for Frequently-Accessed Data
- Never Modify Arrays in Foreach by Reference
- Use unset() to Release Memory Early

## Related Skills

- PHP Memory Model
- Reference Counting Mechanics
- Copy-on-Write Mechanics
- Zval Type/Value Representation

## Success Criteria

- Zval structure (type_info, refcount, value union) understood
- debug functions used correctly to diagnose memory issues
- Unnecessary copy-on-write duplications identified and resolved
- Knowledge applied to write memory-efficient code
