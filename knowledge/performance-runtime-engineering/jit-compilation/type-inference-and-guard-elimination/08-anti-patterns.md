# Anti-Patterns: Type Inference and Guard Elimination

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | Type Inference and Guard Elimination |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Using Docblock Types Instead of Typed Properties | Implementation | Critical |
| 2 | Omitting Return Types on Methods | Implementation | High |
| 3 | Using mixed Type Unnecessarily | Implementation | Medium |
| 4 | Ignoring Guard Failure Rate in Monitoring | Operations | Medium |
| 5 | Expecting strict_types Alone to Fix Type Inference | Implementation | Medium |

---

## Anti-Pattern 1: Using Docblock Types Instead of Typed Properties

### Category
Implementation

### Description
Using /** @var int */ public $prop instead of public int $prop, which is invisible to the JIT compiler and prevents guard elimination.

### Why It Happens
Legacy habits from before PHP 7.4. Unawareness that docblock types are invisible to JIT. Migration codebases with unconverted docblocks.

### Warning Signs
Properties with /** @var int */ but not typed. JIT shows guard checks for property access. No TypeError on wrong type assignment.

### Why Harmful
Docblock types are documentation-only. JIT reads declared types from engine type metadata. Docblock-only properties force JIT to emit runtime type guards.

### Consequences
40-60% of JIT speedup lost for those code paths. Runtime type safety also lost.

### Alternative
Always use PHP 8.0+ typed properties (public int $prop). Static analysis finds docblock-only properties for conversion.

### Refactoring Strategy
1. Find all /** @var */ without declared types 2. Add declared types matching docblock 3. Run test suite 4. Remove docblock after conversion

### Detection Checklist
- [ ] Properties use declared types, not docblock-only
- [ ] JIT guard checks eliminated for typed properties
- [ ] Static analysis enforces declared types
- [ ] No /** @var */ without corresponding declared type

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Type Inference and Guard Elimination
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 2: Omitting Return Types on Methods

### Category
Implementation

### Description
Not adding return types to methods, forcing JIT to insert guards at every call site.

### Why It Happens
Not understanding JIT impact. Legacy code. 'It's optional' mindset. Missing return type in interfaces.

### Warning Signs
Methods without return types. JIT shows type guards at call sites. Type inference limited for return values.

### Why Harmful
Without return types, JIT must insert runtime guards at every call site. This prevents guard elimination and limits type inference propagation.

### Consequences
JIT guards at every method call. 40-60% of speedup lost for method-heavy code.

### Alternative
Add return types to all methods. Use void for nothing. Use self/static for fluent interfaces.

### Refactoring Strategy
1. Enable PHPStan level 6+ to find missing return types 2. Add them 3. Run tests 4. Monitor JIT guard reduction

### Detection Checklist
- [ ] All methods have return types
- [ ] void used for no-return methods
- [ ] JIT guard count reduced after adding return types
- [ ] Static analysis enforces return types

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Type Inference and Guard Elimination
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 3: Using mixed Type Unnecessarily

### Category
Implementation

### Description
Using mixed instead of Union types or specific types, forcing JIT to emit full guards when the runtime type is predictable.

### Why It Happens
Convenience. Misunderstanding mixed is more flexible. Not considering JIT impact. Union types not used.

### Warning Signs
mixed appears as common type. Type guards visible for mixed-typed code. Runtime always uses same type despite mixed declaration.

### Why Harmful
mixed forces JIT to assume any type is possible. Full guards required. No type inference possible. Guard check always executed.

### Consequences
JIT cannot optimize mixed-typed paths. Full guard overhead on every access. No static analysis verification.

### Alternative
Use most specific type: int, string, bool, or Union types (string|int). Only mixed when truly unknown.

### Refactoring Strategy
1. Find all mixed typed properties and params 2. Determine actual runtime type 3. Replace with specific or Union type 4. Validate with static analysis

### Detection Checklist
- [ ] mixed usage minimized
- [ ] Union types used instead of mixed
- [ ] Specific types preferred over unions
- [ ] JIT guard reduction confirmed

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Type Inference and Guard Elimination
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 4: Ignoring Guard Failure Rate in Monitoring

### Category
Operations

### Description
Not checking guard failure counts, missing type instability that negates JIT optimization for entire code paths.

### Why It Happens
Guard failures not a standard metric. No understanding of impact. Not connecting type instability to JIT performance.

### Warning Signs
opcache_get_status() shows non-zero guard failures. No one monitors it. JIT benefit below expectations.

### Why Harmful
Guard failures cause JIT to bail out to the interpreter. Subsequent calls do NOT re-compile. A few failures can permanently disable JIT for large code regions.

### Consequences
Permanent loss of JIT optimization for failure-prone paths. Hidden performance issue.

### Alternative
Monitor guard failure counts. Investigate type instability when non-zero. Fix type declarations or stabilize runtime types.

### Refactoring Strategy
1. Add guard failure count to dashboard 2. Alert on any failures 3. Profile to find type instability 4. Fix the declaration

### Detection Checklist
- [ ] Guard failure count monitored
- [ ] Alert on non-zero failures
- [ ] Type instability investigated
- [ ] JIT benefit restored after fix

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Type Inference and Guard Elimination
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 5: Expecting strict_types Alone to Fix Type Inference

### Category
Implementation

### Description
Enabling declare(strict_types=1) without typed properties and return types, expecting it alone to enable JIT guard elimination.

### Why It Happens
Overestimating strict_types impact. Not understanding it affects function boundaries, not property types.

### Warning Signs
strict_types=1 enabled but properties docblock-only. Methods lack return types. JIT still shows guards for property access.

### Why Harmful
strict_types=1 affects type coercion at call boundaries. It does NOT provide type metadata for properties or return types.

### Consequences
False sense of type safety and JIT readiness. JIT still cannot optimize.

### Alternative
All three are needed: strict_types=1 + typed properties + return types = maximum JIT quality.

### Refactoring Strategy
1. Enable strict_types=1 on all files 2. Add typed properties 3. Add return types 4. Verify JIT guard reduction

### Detection Checklist
- [ ] strict_types=1 enabled
- [ ] Typed properties added (not docblock-only)
- [ ] Return types added
- [ ] JIT guard elimination verified
- [ ] All three layers in place

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Type Inference and Guard Elimination
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees
