# Skill: Understand DynASM's Role in PHP JIT Native Code Generation

## Purpose

Comprehend how PHP's JIT uses the DynASM dynamic assembler framework to translate SSA-form intermediate representation into native machine code at runtime.

## When To Use

- Debugging JIT compilation issues (guard failures, incorrect code generation)
- Understanding the JIT pipeline: opcodes -> SSA -> IR -> native code via DynASM
- Contributing to PHP internals or writing JIT-related extensions
- Analyzing why certain code patterns do not benefit from JIT compilation

## When NOT To Use

- For routine JIT configuration and tuning (CRTO bitmask is sufficient)
- For application-level performance optimization without JIT internals expertise
- Without first understanding JIT concepts (tracing, function, guard elimination)

## Prerequisites

- Familiarity with PHP's Zend Engine opcode structure
- Understanding of SSA (Static Single Assignment) form
- Knowledge of CPU architecture basics (registers, instructions, calling conventions)

## Inputs

- PHP source code of the function/trace being compiled
- JIT compilation logs (if JIT debugging enabled)
- Architecture target (x86_64, ARM64, etc.)

## Workflow (numbered steps)

1. Identify the PHP function or trace that is being JIT-compiled
2. Enable JIT debug logging to observe the compilation pipeline: `opcache.jit_debug=1`
3. Trace the pipeline: PHP opcodes -> SSA conversion -> type inference and guard insertion -> IR generation -> DynASM code emission
4. Identify guard conditions: type checks that JIT inserts at compile time and assumes at runtime
5. When a guard fails, JIT bails out to the interpreter — analyze which types are unpredictable
6. For type-stable code (predictable types), guards never fail and native code executes continuously
7. Use this analysis to refactor PHP code for type stability, enabling better JIT optimization

## Validation Checklist

- [ ] JIT pipeline understood (opcodes -> SSA -> IR -> DynASM -> native code)
- [ ] Guard conditions identified for the target function
- [ ] Type stability of the function assessed
- [ ] If guard failures frequent, refactoring opportunities identified
- [ ] DynASM's role in code generation understood

## Common Failures

- **Assuming all code benefits equally**: Type-unstable code causes frequent guard failures, negating JIT benefit
- **Enabling debug in production**: jit_debug produces extensive logging — use only in staging
- **Focusing on DynASM implementation details**: Application developers should focus on type stability, not assembler internals

## Decision Points

- If guard failures >10% of executions: refactor for type stability (union types, mixed types cause guards)
- If guard failures <1%: JIT provides full benefit — focus optimization elsewhere
- If compilation time exceeds execution time saved: the function is called too infrequently for JIT to help

## Performance Considerations

- DynASM generates code at ~50-500µs per hot function, amortized over thousands of executions
- The generated native code runs 2-10x faster than interpreted opcodes when guards do not fail
- Each guard failure forces a bailout to the interpreter for that code path — subsequent calls still use compiled code for different code paths
- DynASM emits code specific to the CPU architecture — x86_64 and ARM64 have different code quality characteristics

## Security Considerations

- DynASM generates and executes native code at runtime — this is safe within PHP's JIT sandbox
- JIT debugging features should never be enabled in production
- Native code generation is isolated per-worker and cannot affect other processes

## Related Rules (from 05-rules.md)

- Enable JIT Universally, Then Benchmark
- Use Tracing JIT (1254) as Default
- Pre-warm JIT in Long-Running Processes

## Related Skills

- Type Inference and Guard Elimination
- JIT Concepts and Terminology
- Bytecode vs Native Code Assessment

## Success Criteria

- Understanding of how DynASM fits into the JIT compilation pipeline
- Ability to identify guard conditions and type stability requirements
- Refactoring recommendations for type-unstable code documented
- JIT debug analysis completed in staging environment
