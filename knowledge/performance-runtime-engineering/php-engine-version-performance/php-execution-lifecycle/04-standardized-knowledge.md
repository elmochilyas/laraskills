# Standardized Knowledge: PHP Execution Lifecycle

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | PHP Execution Lifecycle |
| Difficulty | Foundation |
| Lifecycle | Understand |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Every PHP request follows a three-phase pipeline: **lexing/parsing** (source code to AST), **compilation** (AST to opcodes), and **execution** (Zend VM runs opcodes). OpCache eliminates re-compilation by caching opcodes in shared memory. JIT compilation adds a fourth phase where hot opcodes are translated to native machine code.

## Core Concepts

- **Lexing**: PHP source is tokenized into meaningful symbols (T_STRING, T_VARIABLE, etc.).
- **Parsing**: Tokens are assembled into an Abstract Syntax Tree (AST) representing program structure.
- **Compilation**: AST is walked to produce Zend opcodes — the bytecode instruction set of the Zend Virtual Machine.
- **Execution**: Zend VM dispatches opcodes via a while(1) loop calling handler functions.
- **OpCache interception**: On subsequent requests, OpCache serves pre-compiled opcodes from shared memory, skipping lex/parse/compile phases entirely.

## When To Use

- Understanding where PHP spends time during request processing
- Debugging performance issues related to compilation or execution
- Optimizing OpCache and JIT configuration
- Learning how PHP works internally for advanced performance tuning

## When NOT To Use

- When tuning application-level performance (focus on profiling hotspots instead)
- For understanding framework-level behavior (middleware, controllers, services)
- As a prerequisite for basic PHP-FPM or OpCache configuration

## Best Practices (WHY)

- **Enable OpCache**: Without OpCache, 100% of requests recompile all source files. With OpCache, only ~1-3ms overhead per request for autoloading + execution.
- **Understand the compilation cost**: First request after deployment is slow (cold cache). Preloading reduces cold-start latency.
- **Leverage typed properties**: Reduce opcode count — `public int $x` uses fewer ops than `public $x` with docblock. This reduces execution time in property-heavy code.

## Architecture Guidelines

- **Zend Engine executor**: Uses `zend_execute_data` as its call frame structure. Each opcode is a `zend_op` struct containing opcode number, operands (op1, op2, result), and handler function pointer.
- **PHP 8.4 computed goto**: Faster opcode handler dispatch using `goto` for ~5-8% execution speedup. The executor loop is a while(1) that fetches, dispatches, and chains opcodes.
- **JIT interception**: `opcache.jit` intercepts at the opcode dispatch level, redirecting hot traces to compiled native code paths.

## Performance

- Without OpCache: 100% of requests recompile all source files
- With OpCache warm: ~1-3ms overhead per request for autoloading + execution only
- JIT adds compilation latency during warm-up but amortizes it over repeated execution
- Typed properties reduce opcode count, reducing execution time
- Computed goto dispatch (8.4+): ~5-8% synthetic improvement

## Security

- OpCache operates at the opcode level — stale opcodes can serve outdated code if not properly invalidated
- validate_timestamps=0 trades automatic cache invalidation for performance — requires explicit opcache_reset() on deploy
- Never disable OpCache in production; the performance impact is severe

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Disabling OpCache in production | Dev habit, troubleshooting | 2-4x throughput loss | Always enable; use opcache_reset() for fresh cache |
| Not understanding cold vs warm | Confusing first-request and steady-state | Misattributing latency to code | Account for OpCache warm-up in benchmarks |
| Ignoring compilation cost | Only measuring execution time | Underestimating cold-start impact | Use preloading to reduce cold-start latency |
| Not using typed properties | Legacy patterns | More opcodes per property access, slower execution | Type all new properties |

## Anti-Patterns

- **Forgetting the pipeline exists**: All performance tuning operates on one of these phases. OpCache on compilation, JIT on execution, preloading on bootstrap.
- **Tuning execution without optimizing compilation**: OpCache provides 2-4x gain with zero code changes. Always start with OpCache before optimizing code.
- **Measuring only execution time**: Cold requests (post-deployment) include compilation time. Design benchmarks to measure both cold and warm states.

## Examples

```php
<?php
// The execution lifecycle phases:
// 1. Lexing: source code -> tokens
// 2. Parsing: tokens -> AST
// 3. Compilation: AST -> opcodes
// 4. Execution: Zend VM runs opcodes

// With OpCache enabled:
// Steps 1-3 happen only on first request (or after opcache_reset())
// Subsequent requests skip directly to step 4

// With JIT enabled:
// Hot paths in step 4 are compiled to native code after threshold
```

## Related Topics

- Bytecode vs Native Code
- OpCache Purpose and Mechanics
- JIT Concepts and Terminology
- PHP Preloading
- Zend Engine Opcode Pipeline

## AI Agent Notes

- The PHP execution lifecycle is: Lexing -> Parsing -> Compilation -> Execution (-> JIT compilation for hot paths).
- OpCache caches opcodes (skips lex/parse/compile). JIT compiles hot opcodes to native code (skips VM dispatch).
- Without OpCache, every request recompiles all source files — 2-4x throughput loss.
- PHP 8.4 computed goto dispatch improves opcode handling by ~5-8%.
- Always think about which lifecycle phase your optimization targets.

## Verification

- [ ] OpCache enabled in production
- [ ] Understanding of the four-phase pipeline (lex, parse, compile, execute)
- [ ] Awareness of cold vs warm request behavior
- [ ] Preloading evaluated for cold-start optimization
- [ ] Typed properties used to reduce opcode count
- [ ] JIT configuration understood in relation to execution phase
