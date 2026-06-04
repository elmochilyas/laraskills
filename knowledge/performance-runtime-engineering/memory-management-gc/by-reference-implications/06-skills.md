# Skill: Manage By-Reference Implications in PHP

## Purpose

Understand when pass-by-reference is beneficial (large mutable data) and when it introduces risks (unexpected side effects, copy-on-write complications) and apply accordingly.

## When To Use

- Passing large arrays or data structures to functions that modify them
- Debugging unexpected variable changes caused by references
- Optimizing code that currently copies large structures unnecessarily
- Auditing code for reference-related bugs

## When NOT To Use

- For small data (<1KB) where pass-by-value is simpler and fast enough
- When the function does not modify the parameter (pass-by-value is semantically clearer)
- For beginners who may not understand reference semantics
- In APIs where callers expect pass-by-value semantics

## Prerequisites

- Understanding of PHP's pass-by-value default and copy-on-write
- Profiling showing large data structure copies
- Knowledge of reference vs value semantics

## Inputs

- Function signatures that take large parameters
- Code that modifies function arguments
- Performance data showing time spent in array/object copying

## Workflow (numbered steps)

1. Identify functions that accept large arrays (>1MB) as parameters and modify them
2. For arrays modified in-place: add `&` to the parameter to pass by reference — avoids copy-on-write duplication
3. For objects: no change needed — objects are always passed by handle (reference-like without `&`)
4. For strings that are modified in-place: add `&` for the parameter if the string is large (>100KB)
5. Never use references for parameters that are only read — it introduces unnecessary side-effect risks
6. Never return references from functions — it exposes internal state to callers
7. Document reference usage in function docblocks: `@param array &$data The data to modify in-place`
8. Test extensively after adding references — unintended side effects are the primary risk

## Validation Checklist

- [ ] Functions modifying large arrays updated to use pass-by-reference
- [ ] Object parameters confirmed as pass-by-handle (no change needed)
- [ ] Read-only parameters remain pass-by-value
- [ ] No function returns by reference
- [ ] Reference usage documented in docblocks
- [ ] Tests confirm no side effects from reference changes

## Common Failures

- **Passing by reference for read-only parameters**: Creates unnecessary coupling — the function could modify the caller's variable
- **Returning by reference**: Exposes internal state, breaks encapsulation, makes debugging difficult
- **Forgetting that functions can modify references**: A function that takes a reference can change the caller's variable unexpectedly
- **Over-optimizing with references**: For parameters <1KB, pass-by-value is fast enough (copy-on-write means no copy until modification)

## Decision Points

- Array >1MB, modified in function: use pass-by-reference
- Array >1MB, read-only: pass-by-value (copy-on-write means no copy)
- Array <1KB: pass-by-value (simpler, no performance concern)
- Object of any size: always pass-by-value (it's actually pass-by-handle)
- Function returns array that caller modifies: return by reference is rarely needed — return a new array

## Performance Considerations

- Pass-by-value for large arrays: refcount increment only (~5ns), no copy until modification
- Pass-by-reference: eliminates the refcount increment but introduces side-effect risk
- Copy-on-write penalty: paid only when the function actually modifies the array
- Reference assignment: zero-cost (just changes the symbol table entry)
- Returning arrays from functions: refcount increment on return, no copy

## Security Considerations

- References can cause data leakage if a function modifies a shared data structure unexpectedly
- Pass-by-reference in Octane workers can cause cross-request data contamination
- Document all reference usage clearly — hidden references are a common source of security-relevant bugs

## Related Rules (from 05-rules.md)

- Prefer Pass-by-Value for Read-Only Parameters
- Use Pass-by-Reference for Large Mutable Arrays
- Never Return References from Functions

## Related Skills

- Copy-on-Write Mechanics
- Zval Structure and Reference Counting
- Reference Counting and Refcount Lifecycle

## Success Criteria

- Reference usage justified by data size and modification pattern
- Read-only parameters remain pass-by-value
- No functions return by reference
- Reference usage documented
- Side-effect risk managed through testing and audit
