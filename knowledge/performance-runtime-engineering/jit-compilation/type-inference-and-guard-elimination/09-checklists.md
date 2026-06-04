# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** Type Inference and Guard Elimination â€” Typed Property Optimization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use typed properties everywhere**: public int $count vs /** @var int */ public $count â€” typed properties enable guard elimination. Docblock-only types do not.
- [ ] **Add return types to all methods**: Return types enable JIT to avoid guards at call sites. Without them, JIT must handle mixed return values.
- [ ] **Use strict_types=1**: Strict types mode improves type inference by preventing implicit type coercion that confuses the JIT analyzer.
- [ ] **Avoid mixed type hints**: mixed forces JIT to insert full guards because the type could be anything. Use Union types where possible.
- [ ] **Profile guard failure frequency**: High guard failure rates indicate type instability. Fix the underlying type issues to restore JIT optimization.
- [ ] PHP 8.0+ typed properties used (not docblock-only)
- [ ] Return types added to all methods
- [ ] strict_types=1 enabled in application code
- [ ] Guard failure rate monitored (opcache_get_status)
- [ ] mixed type usage minimized (Union types preferred)
- [ ] Type-unstable hot paths identified through profiling
- [ ] Refactoring completed: type declarations added, union types narrowed
- [ ] Guard failure rate decreased measurably
- [ ] Before/after benchmark shows throughput improvement
- [ ] Patterns documented for ongoing type-stable code practices
- [ ] Guard failure frequency measured before refactoring
- [ ] Type-unstable parameters identified
- [ ] Explicit type declarations added to function signatures
- [ ] Mixed/union types narrowed where possible
- [ ] Array element types made consistent

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **SSA-Based Analysis**: JIT uses Static Single Assignment form to track variable types across the code graph. Each SSA variable has a type lattice â€” JIT propagates known types through the graph.
- [ ] **Profile Feedback**: In tracing mode (T=5), JIT collects profiling data on actual types encountered at runtime before compiling. This enables type inference where static analysis is insufficient.
- [ ] **Guard Types**: Integer (is_long), Float (is_double), String (is_string), Array (is_array), Object (is_object), Resource (is_resource). Each guard eliminated saves one type check per execution.
- [ ] **Bailout Cascade**: A guard failure at an early point in a function may cascade, causing the entire compiled trace or function to bail out to the interpreter. Fixing one type issue can restore optimization for an entire code path.
- [ ] Document and follow through on architectural decision: Whether to invest in type declarations for JIT
- [ ] Document and follow through on architectural decision: How to fix guard failures in JIT-compiled code
- [ ] Ensure architecture aligns with core concept: **Type Inference Sources**: Declared types (PHP 8.0+ property types, parameter types, return types), inferred types (deduced from assignments and operations), profile feedback (observed types during execution).
- [ ] Ensure architecture aligns with core concept: **Guard Elimination**: If JIT can prove a variable is always int, it eliminates the is_long() guard. The native code uses integer addition without type checking.
- [ ] Ensure architecture aligns with core concept: **Typed Property Advantage**: public int $count â†’ JIT knows the type at compile time. /** @var int */ public $count â†’ JIT must insert a guard because docblocks are not enforceable.
- [ ] Ensure architecture aligns with core concept: **Guard Failure Bailout**: When a runtime value doesn't match the inferred type, JIT bails out to the interpreter. This is expensive (~1-5Âµs) and prevents future JIT compilation of that code path.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use typed properties everywhere**: public int $count vs /** @var int */ public $count â€” typed properties enable guard elimination. Docblock-only types do not.
- [ ] **Add return types to all methods**: Return types enable JIT to avoid guards at call sites. Without them, JIT must handle mixed return values.
- [ ] **Use strict_types=1**: Strict types mode improves type inference by preventing implicit type coercion that confuses the JIT analyzer.
- [ ] **Avoid mixed type hints**: mixed forces JIT to insert full guards because the type could be anything. Use Union types where possible.
- [ ] **Profile guard failure frequency**: High guard failure rates indicate type instability. Fix the underlying type issues to restore JIT optimization.
- [ ] Enable JIT debug logging in staging to capture guard failure data
- [ ] Profile the target function: measure how often each parameter and return value changes type
- [ ] Identify type-unstable parameters: parameters that receive different types across calls
- [ ] Add explicit type declarations to function parameters and return types
- [ ] Replace mixed/union types with specific types where possible â€” split functions if needed
- [ ] Eliminate type coercion in the function body: avoid `(int)`, `(string)` casts that mask type instability
- [ ] Ensure arrays contain consistent element types â€” use generics/strategies for typed collections
- [ ] Re-profile after refactoring: verify guard failures decreased and native compilation increased
- [ ] Benchmark before/after: measure throughput improvement from reduced bailouts
- [ ] Document the refactoring patterns that improved type stability

# Performance Checklist (from 04/06)
- [ ] Typed properties reduce opcode count by 15-25% for property-heavy code
- [ ] Guard elimination accounts for ~40-60% of JIT's total speedup in CPU-bound benchmarks
- [ ] Guard failure cost: 1-5Âµs per failure, plus lost optimization for that code path
- [ ] PHP 8.4 lazy objects required JIT guard updates to handle lazily-initialized typed properties
- [ ] JIT enabled
- [ ] Tracing mode
- [ ] Function mode
- [ ] Large buffer (256MB)

# Security Checklist (from 04/06 - only if relevant)
- [ ] Review for security implications of implementation choices
- [ ] Validate input boundaries and type safety

# Reliability Checklist (from 04/05/06)
- [ ] **JIT buffer exhaustion**: Buffer utilization reaches 100%. Symptom: JIT compilation stalls, hot paths revert to interpreter. Mitigation: Increase jit_buffer_size, monitor jit_buffer_free.
- [ ] **Segfault on native code execution**: JIT produces incorrect native code (rare, fixed in updates). Symptom: PHP-FPM worker crashes with SIGSEGV. Mitigation: Disable JIT, upgrade PHP, file bug report.
- [ ] **Compilation pause spikes**: JIT compilation during request causes latency spikes. Symptom: Occasional p99 latency spikes (10-100ms). Mitigation: Use less aggressive JIT mode (1254 vs 1235), increase trigger thresholds.
- [ ] **Type guard failures**: Incorrect type guard elimination causes wrong computation results. Symptom: Silent data corruption in JIT-compiled code. Mitigation: Keep PHP updated, report as PHP bug.
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory Ã¢â‚¬â€ ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Testing Checklist (from 04/06)
- [ ] PHP 8.0+ typed properties used (not docblock-only)
- [ ] Return types added to all methods
- [ ] strict_types=1 enabled in application code
- [ ] Guard failure rate monitored (opcache_get_status)
- [ ] mixed type usage minimized (Union types preferred)
- [ ] Type improvements focused on CPU-bound code paths
- [ ] Type-unstable hot paths identified through profiling
- [ ] Refactoring completed: type declarations added, union types narrowed
- [ ] Guard failure rate decreased measurably
- [ ] Before/after benchmark shows throughput improvement
- [ ] Patterns documented for ongoing type-stable code practices
- [ ] Guard failure frequency measured before refactoring
- [ ] Type-unstable parameters identified
- [ ] Explicit type declarations added to function signatures
- [ ] Mixed/union types narrowed where possible
- [ ] Array element types made consistent
- [ ] Guard failure frequency measured after refactoring (should decrease)
- [ ] Before/after benchmark shows improvement
- [ ] Refactoring patterns documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use typed properties everywhere**: public int $count vs /** @var int */ public $count â€” typed properties enable guard elimination. Docblock-only types do not.
- [ ] **Add return types to all methods**: Return types enable JIT to avoid guards at call sites. Without them, JIT must handle mixed return values.
- [ ] **Use strict_types=1**: Strict types mode improves type inference by preventing implicit type coercion that confuses the JIT analyzer.
- [ ] **Avoid mixed type hints**: mixed forces JIT to insert full guards because the type could be anything. Use Union types where possible.
- [ ] **Profile guard failure frequency**: High guard failure rates indicate type instability. Fix the underlying type issues to restore JIT optimization.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using docblock types instead of typed properties
- [ ] Avoid: Omitting return types
- [ ] Avoid: Using mixed type unnecessarily
- [ ] Avoid: Ignoring guard failure monitoring
- [ ] Avoid anti-pattern: **Adding types everywhere without benefit**: I/O-bound code where JIT provides minimal gain doesn't need stringent typing for JIT purposes. Focus type improvement on CPU-bound paths.
- [ ] Avoid anti-pattern: **Expecting strict_types alone to fix type inference**: strict_types=1 helps but doesn't replace typed properties and return types.
- [ ] Avoid anti-pattern: **Relying on PHPDoc for JIT optimization**: PHPDoc types are invisible to the JIT compiler. Only runtime-declared types are used for guard elimination.
- [ ] Guard against anti-pattern: Using Docblock Types Instead of Typed Properties
- [ ] Guard against anti-pattern: Omitting Return Types on Methods
- [ ] Guard against anti-pattern: Using mixed Type Unnecessarily
- [ ] Guard against anti-pattern: Ignoring Guard Failure Rate in Monitoring
- [ ] Guard against anti-pattern: Expecting strict_types Alone to Fix Type Inference
- [ ] Properties use declared types, not docblock-only
- [ ] JIT guard checks eliminated for typed properties

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory Ã¢â‚¬â€ ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Type Inference Sources**: Declared types (PHP 8.0+ property types, parameter types, return types), inferred types (deduced from assignments and operations), profile feedback (observed types during execution)., **Guard Elimination**: If JIT can prove a variable is always int, it eliminates the is_long() guard. The native code uses integer addition without type checking., **Typed Property Advantage**: public int $count â†’ JIT knows the type at compile time. /** @var int */ public $count â†’ JIT must insert a guard because docblocks are not enforceable., **Guard Failure Bailout**: When a runtime value doesn't match the inferred type, JIT bails out to the interpreter. This is expensive (~1-5Âµs) and prevents future JIT compilation of that code path.
**Skills:** JIT Concepts and Terminology, DynASM Framework Internals, Bytecode vs Native Code Assessment, JIT Workload Benefit Assessment
**Decision Trees:** Whether to invest in type declarations for JIT, How to fix guard failures in JIT-compiled code
**Anti-Patterns:** Using Docblock Types Instead of Typed Properties, Omitting Return Types on Methods, Using mixed Type Unnecessarily, Ignoring Guard Failure Rate in Monitoring, Expecting strict_types Alone to Fix Type Inference
**Related Topics:** DynASM Framework Internals, JIT Concepts and Terminology, JIT Configuration for Production, JIT Workload Benefit Assessment

