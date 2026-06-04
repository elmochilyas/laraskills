# Skill: Refactor PHP Code for Type Stability to Maximize JIT Guard Elimination

## Purpose

Restructure PHP code with predictable types to enable JIT's guard elimination optimization — removing runtime type checks and producing faster native code.

## When To Use

- JIT is enabled but profiling shows frequent guard failures (bailouts to interpreter)
- Hot-path functions use union types, mixed types, or dynamic type changes
- Optimizing CPU-bound code that executes thousands of times per request

## When NOT To Use

- For I/O-bound code where guard elimination savings are negligible
- For infrequently-called functions where micro-optimization is not justified
- Without first profiling to confirm guard failures are occurring

## Prerequisites

- JIT enabled and running
- Profiling data showing guard failure frequency
- Understanding of PHP type system and type declarations
- Access to the code being optimized

## Inputs

- JIT guard failure metrics (via opcache_get_status or debug logging)
- Profiling call graphs showing type instability
- Hot-path function signatures and internal type usage
- PHP version (8.0+ for union types, 8.2+ for standalone types)

## Workflow (numbered steps)

1. Enable JIT debug logging in staging to capture guard failure data
2. Profile the target function: measure how often each parameter and return value changes type
3. Identify type-unstable parameters: parameters that receive different types across calls
4. Add explicit type declarations to function parameters and return types
5. Replace mixed/union types with specific types where possible — split functions if needed
6. Eliminate type coercion in the function body: avoid `(int)`, `(string)` casts that mask type instability
7. Ensure arrays contain consistent element types — use generics/strategies for typed collections
8. Re-profile after refactoring: verify guard failures decreased and native compilation increased
9. Benchmark before/after: measure throughput improvement from reduced bailouts
10. Document the refactoring patterns that improved type stability

## Validation Checklist

- [ ] Guard failure frequency measured before refactoring
- [ ] Type-unstable parameters identified
- [ ] Explicit type declarations added to function signatures
- [ ] Mixed/union types narrowed where possible
- [ ] Array element types made consistent
- [ ] Guard failure frequency measured after refactoring (should decrease)
- [ ] Before/after benchmark shows improvement
- [ ] Refactoring patterns documented

## Common Failures

- **Refactoring infrequently-called code**: Guard elimination matters only for hot paths executed 1000+ times
- **Over-specifying types**: Using `int` for a parameter that legitimately receives both int and null — use `?int` instead
- **Breaking encapsulation**: Changing public API types for internal optimization may break consumers
- **Not verifying with profiling**: Assuming types are stable without profiling data may waste effort on code that already has stable types

## Decision Points

- If guard failure rate >10% on hot paths: high priority for refactoring
- If guard failure rate 2-10%: moderate benefit from type stabilization
- If guard failure rate <2%: types are already stable — focus optimization elsewhere
- If function receives genuinely variable types: use union types (PHP 8.0+) rather than omitting types

## Performance Considerations

- Guard elimination is JIT's primary optimization — removing one type check can save 5-20 native instructions per call site
- A function called 100,000 times per request with 3 guard eliminations saves ~3 million instructions
- Type-stable code can show 20-100% improvement in CPU-bound benchmarks over type-unstable code
- Each guard failure forces a bailout to the interpreter for that path — cost is ~1-5µs per failure

## Security Considerations

- Type declarations improve security by enforcing type contracts
- Strict types (declare(strict_types=1)) combined with typed declarations provides the strongest type guarantees
- No security regressions from type stabilization

## Related Rules (from 05-rules.md)

- Use Typed Properties for Hot-Path DTOs
- Prefer Scalar Types for Frequently-Accessed Data
- Enable JIT Universally, Then Benchmark

## Related Skills

- JIT Concepts and Terminology
- DynASM Framework Internals
- Bytecode vs Native Code Assessment
- JIT Workload Benefit Assessment

## Success Criteria

- Type-unstable hot paths identified through profiling
- Refactoring completed: type declarations added, union types narrowed
- Guard failure rate decreased measurably
- Before/after benchmark shows throughput improvement
- Patterns documented for ongoing type-stable code practices
