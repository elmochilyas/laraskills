# Anti-Patterns: Typed Properties Performance

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Typed Properties Performance |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Omitting Type Declarations on Frequently Accessed Properties | Performance | High |
| 2 | Using Mixed Type as Default | Design | Critical |
| 3 | Wrapping Typed Properties with Getters That Un-Type | Performance | High |
| 4 | Late Type Annotations via PHPDoc Instead of Declared Types | Implementation | High |
| 5 | Over-Using Nullable Typed Properties | Design | Medium |

## Repository-Wide Anti-Patterns

- **Strict types inconsistency**: Files with declared typed properties but missing `declare(strict_types=1)` allow implicit type coercion that bypasses type declarations, negating both safety and optimization benefits.
- **Dynamic property usage on typed classes**: Mixing declared typed properties with dynamic property assignment causes runtime errors (deprecated in 8.2, removed in later versions) and prevents JIT guard elimination.
- **Readonly omission**: Not marking immutable properties as `readonly` (PHP 8.1+) misses an additional 3-8% gain beyond typed-only, and increases cognitive overhead of tracking mutability.

---

## Anti-Pattern 1: Omitting Type Declarations on Frequently Accessed Properties

### Category
Performance

### Description
Leaving properties untyped (`public $foo`) especially on frequently accessed DTOs, models, and value objects, missing the 5-15% execution time reduction from typed property specialization and JIT guard elimination.

### Why It Happens
- Legacy code habits from PHP <7.4 where typed properties didn't exist
- Migration from older codebases where properties were traditionally untyped
- Convenience during prototyping, never refactored to typed
- Unawareness of the performance difference between typed and untyped property access
- Belief that PHPDoc annotations are equivalent to declared types

### Warning Signs
- Frequently accessed DTOs and models with untyped properties
- Property access in tight loops without type declarations
- JIT enabled but property access still shows guard checks in profiling
- Mix of typed and untyped properties in the same class
- PHPDoc `@var` annotations used instead of `public type $property` syntax
- `__get`/`__set` magic methods used instead of declared properties

### Why Harmful
Untyped properties prevent engine specialization:
- The Zend Engine generates distinct opcodes for typed vs untyped access
- Untyped `$obj->prop = $val` compiles to general `ASSIGN_OBJ` with zval type conversion
- Typed `$obj->prop = $val` compiles to `ASSIGN_OBJ_OP_DATA` with type-specific variants
- Typed properties skip zval type conversion and refcount adjustment
- JIT guard elimination requires typed properties — without them, JIT emits runtime type guards

### Consequences
- 5-15% execution time overhead on property-heavy code
- JIT guard elimination prevented, reducing JIT's effectiveness by 20-40%
- Type safety lost: untyped properties can receive any value without error
- Object hydration ~30% slower than typed equivalents
- Dynamic property deprecation (8.2) makes migration more urgent

### Alternative
Always declare property types, especially on:
- DTOs and value objects (most property access occurs here)
- Models with heavy property access patterns
- Configuration objects loaded at bootstrap
- Cache objects accessed in hot paths
- Constructor property promotion combined with type declarations (PHP 8.0+)

### Refactoring Strategy
1. Run static analysis (PHPStan level 6+) to identify untyped properties
2. Prioritize DTOs and value objects with the highest access frequency
3. Add type declarations: `public int $id`, `public string $name`
4. Add `readonly` where properties are immutable after construction
5. Enable `declare(strict_types=1)` in files with typed properties
6. Benchmark before/after to measure the 5-15% improvement

### Detection Checklist
- [ ] All class properties have explicit type declarations
- [ ] Frequently accessed properties prioritized for typing
- [ ] DTOs and value objects fully typed
- [ ] No dynamic property usage on typed classes
- [ ] `declare(strict_types=1)` enabled where typed properties are used
- [ ] Benchmark confirms improvement from typing

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Typed Properties Performance
- 05-rules.md: Always Type Frequently Accessed Properties
- 07-decision-trees.md: Typed vs Untyped Decision Tree

---

## Anti-Pattern 2: Using Mixed Type as Default

### Category
Design

### Description
Using `mixed` as the default property type throughout a codebase, which provides no type specialization, prevents JIT guard elimination, and defeats the purpose of PHP's type system for performance optimization.

### Why It Happens
- Convenience during development — "I'll type it properly later"
- Working with legacy code where the true type is uncertain
- Misunderstanding that `mixed` is more flexible without understanding the trade-off
- API response mapping where data comes from external sources
- Pattern of typing everything as `mixed` "to be safe"

### Warning Signs
- `mixed` appears as the most common property type in the codebase
- Properties storing primitive values (int, string, bool) are typed as `mixed`
- No discussion of specific types in code review for new properties
- Mixed type used in DTOs and value objects (should always be specific)
- Type assertions or instanceof checks required before using mixed properties

### Why Harmful
`mixed` is the worst possible type for performance:
- The Zend Engine cannot specialize opcodes for mixed — no type-specific variant
- JIT must emit full type guards for every access, reducing optimization
- `mixed` prevents property slot optimization in zend_object_store
- PHPStan/Psalm cannot verify code paths using mixed properties
- Runtime TypeErrors are caught at use point, not assignment point (harder to debug)

### Consequences
- Zero type specialization, same performance as untyped properties
- JIT guard elimination prevented
- Static analysis cannot verify correctness of mixed property usage
- TypeErrors surface at unexpected locations (usage, not assignment)
- Code becomes harder to refactor as mixed propagates
- Developer understanding of data contracts degrades

### Alternative
Use the most specific type possible:
- `int` over `string|int` over `mixed`
- If truly variable, use union types: `string|int` not `mixed`
- If null is valid, use `?type` not `mixed`
- For collections, use typed arrays (PHPStan/Psalm) or collections
- For truly unknown types (JSON decode), validate and cast at the boundary
- Never use `mixed` as a default — require justification in code review

### Refactoring Strategy
1. Find all properties typed as `mixed`
2. For each, determine the actual type based on usage patterns
3. Replace `mixed` with the specific type or the narrowest union type
4. Add runtime validation at type boundaries (API responses, JSON decode)
5. Run static analysis to verify type correctness after changes
6. Benchmark to confirm the performance improvement

### Detection Checklist
- [ ] `mixed` usage audited and replaced where possible
- [ ] DTOs and value objects have zero mixed properties
- [ ] Union types preferred over mixed for variable types
- [ ] Type boundaries validated explicitly
- [ ] Static analysis enforces no-mixed policy
- [ ] Falsifiable: test must contain at least one typed property

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Typed Properties Performance
- 05-rules.md: Use Most Specific Type Possible
- 07-decision-trees.md: Type Selection Decision Tree

---

## Anti-Pattern 3: Wrapping Typed Properties with Getters That Un-Type

### Category
Performance

### Description
Declaring a typed property but wrapping access in a getter method that returns `mixed` or a wider type than the property, which negates the performance benefit of typed properties by losing type information at call sites.

### Why It Happens
- Legacy getter patterns that predate typed properties
- Framework conventions that require getters returning mixed
- Serialization or API response formatting that needs mixed types
- Caching or proxy layers that erase type information
- Habit of writing `@return mixed` instead of matching the property type

### Warning Signs
- Getter declared as `@return mixed` or `function getFoo(): mixed`
- Getter return type does not match the property type it wraps
- Callers of the getter must cast or assert the type before use
- Property is typed `string` but getter returns `string|null` or `mixed`
- Serialization methods return mixed regardless of property types
- `__get` magic method used for property access returning mixed

### Why Harmful
Untyped getters erase the optimization:
- The type information is available at the property but lost at the getter boundary
- Callers receive a value without type guarantees, preventing static analysis
- JIT at the call site cannot optimize because the type is unknown
- Additional runtime checks needed at call sites to verify type
- Code becomes harder to understand and refactor

### Consequences
- Zero performance benefit from typed property at call sites
- Static analysis cannot verify type correctness across method boundaries
- Additional type guards needed at getter call sites
- Inconsistent: typed property but untyped access pattern
- Code assumes getters "protect" but actually erases type information
- Refactoring to inline property access loses the getter's semantic value

### Alternative
Match getter return types to their property types:
- `public function getName(): string { return $this->name; }`
- If a wider return type is necessary, document why and consider a different design
- Prefer direct typed property access (public type $name) over getters for DTOs
- Use readonly typed properties for immutable data — getter becomes unnecessary
- For lazy loading or proxying, use typed properties with typed closure backers

### Refactoring Strategy
1. Find all getters where return type doesn't match the property type
2. For each, determine the correct return type and update the signature
3. If the wider type is necessary, consider whether the property should be wider
4. Remove the getter entirely if the property can be public readonly
5. Verify callers don't need type assertions after the change
6. Run static analysis to confirm type safety

### Detection Checklist
- [ ] Getter return types match their corresponding property types
- [ ] No `mixed` return type on getters wrapping typed properties
- [ ] Public readonly properties preferred over getter-masked typed properties
- [ ] Direct property access used where getters add no value
- [ ] Static analysis enforces return type / property type consistency

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Typed Properties Performance
- 05-rules.md: Match Getter Types to Property Types
- 07-decision-trees.md: Getter vs Direct Access Decision Tree

---

## Anti-Pattern 4: Late Type Annotations via PHPDoc Instead of Declared Types

### Category
Implementation

### Description
Using `@var int` PHPDoc annotations to document types instead of declaring `public int $property` in code, providing documentation benefits but zero runtime type enforcement and zero engine specialization.

### Why It Happens
- Pre-PHP 7.4 codebases where PHPDoc was the only option
- IDEs and static analysis tools support PHPDoc types, creating a false sense of equivalence
- Framework conventions that historically used annotations (Symfony, Doctrine)
- Teams that prefer documentation over runtime enforcement
- Migration codebases where PHPDoc exists and declared types haven't been added

### Warning Signs
- `@var` annotations without corresponding declared types
- Static analysis passes but runtime type violations are not caught
- IDE shows type information but PHP itself has no type enforcement
- Doctrine entity mappings use `@Column(type="integer")` but properties are untyped
- Property access shows ASSIGN_OBJ opcode instead of ASSIGN_OBJ_OP_DATA in profiling

### Why Harmful
PHPDoc provides ZERO runtime benefit:
- The Zend Engine reads declared types (PHP syntax), not PHPDoc annotations
- `@var int` does not generate typed property opcodes
- JIT cannot perform guard elimination on PHPDoc-typed properties
- Runtime type violations are not caught (can't assign string to "int" via PHPDoc)
- PHPDoc and declared types can be out of sync (docs lie)

### Consequences
- Zero performance benefit from "types" written in PHPDoc
- Runtime type safety not enforced (TypeError never thrown)
- JIT guard elimination prevented
- Opcode count same as untyped properties
- Object hydration slower than properly typed equivalents
- PHPDoc and actual usage may diverge, misleading developers

### Alternative
Always use declared types (`public int $prop`) over PHPDoc `@var` annotations:
- Declared types provide both runtime enforcement and engine specialization
- Add `declare(strict_types=1)` at file level
- Use PHPDoc only when declared types are not possible (e.g., `@template T`)
- For Doctrine entities, use typed properties with `Column(type: "integer")`
- Run static analysis to verify declared types cover all properties

### Refactoring Strategy
1. Find all PHPDoc `@var` annotations without declared types in PHP 8.0+
2. Add declared type to each property matching the PHPDoc type
3. Run the test suite to catch any mismatches (TypeError reveals wrong types)
4. Remove the PHPDoc annotation once the declared type is in place
5. Configure PHPStan/Psalm to warn about PHPDoc-only types

### Detection Checklist
- [ ] All properties have declared types, not just PHPDoc annotations
- [ ] Doctrine entities use typed properties with attribute mappings
- [ ] Static analysis enforces declared types over PHPDoc
- [ ] No PHPDoc `@var` annotations without corresponding declared types
- [ ] Falsifiable: at least one property type declaration exists per class

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Typed Properties Performance
- 05-rules.md: Prefer Declared Types Over PHPDoc
- 07-decision-trees.md: Type Declaration vs PHPDoc Decision Tree

---

## Anti-Pattern 5: Over-Using Nullable Typed Properties

### Category
Design

### Description
Using nullable types (`?int`, `?string`) as the default for properties where null is not semantically distinct from a default value, forcing null guards at every access point and preventing the engine from optimizing with non-nullable types.

### Why It Happens
- Defensive programming: "it might be null, so I'll allow it"
- ORM entities where some fields are nullable in the database
- API responses where fields may be absent
- Not distinguishing between "not set" (null) and "has a default value"
- Copy-paste from existing nullable patterns

### Warning Signs
- Most properties in a class are nullable
- Callers always check for null before accessing a nullable property
- The null value and a default value (0, "", false) would be treated identically
- Properties initialized in constructor but still declared nullable
- ?? (null coalescing) used on every property access
- Static properties or singletons declared nullable without clear null semantics

### Why Harmful
Nullable types have costs:
- The Zend Engine must emit null checks for every access — additional opcodes
- JIT guard checks for null even if null never occurs at runtime
- Callers must always handle null, adding cognitive load and code volume
- Null propagates: functions accepting `?int` pass it to other `?int` parameters
- PHP 8.1+ readonly properties assigned once don't need nullability

### Consequences
- Additional opcodes for null guards on every property access
- JIT cannot eliminate null checks if null is theoretically possible
- Increased code volume from null checks and coalescing operators
- Type ambiguities: is null a valid value or just "not set"?
- Harder-to-diagnose bugs: null gets passed to multiple layers before being detected

### Alternative
Prefer non-nullable with default values where semantically equivalent:
- `int $count = 0` over `?int $count = null`
- `string $name = ''` over `?string $name = null`
- `bool $active = false` over `?bool $active = null`
- Use nullable only when null has a distinct semantic meaning from defaults
- For uninitialized states, consider a separate "not set" sentinel value
- Use PHP 8.1 readonly constructor promotion with defaults, not nullables

### Refactoring Strategy
1. Review each nullable property: does null have a distinct meaning from defaults?
2. If null == default, replace nullable with typed + default value
3. If null is truly distinct, keep nullable but document the semantics
4. Update callers to remove unnecessary null checks
5. Run static analysis to verify null safety with less permissive settings
6. Benchmark to measure the improvement from fewer null guards

### Detection Checklist
- [ ] Nullable types used only where null has distinct semantic meaning
- [ ] Default values preferred over null for "not set" states
- [ ] readony constructor promotion uses non-nullable defaults where appropriate
- [ ] Null propagation limited to API boundaries
- [ ] Static analysis enforces null safety at strictest level
- [ ] <= 25% of properties are nullable in any given class

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Typed Properties Performance
- 05-rules.md: Prefer Non-Nullable With Defaults
- 07-decision-trees.md: Nullable vs Default Value Decision Tree
