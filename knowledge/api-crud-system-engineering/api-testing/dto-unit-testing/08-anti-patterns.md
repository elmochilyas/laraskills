# Anti-Patterns — DTO Unit Testing

## Anti-Pattern 1: Testing DTOs Through Feature Tests

**Category**: Testing methodology

**Description**: Covering DTO behavior exclusively through HTTP feature tests instead of direct instantiation and plain assertions.

**Warning Signs**:
- DTO bugs are only caught by slow HTTP feature tests
- No test directly calls `new PostDTO(...)` or `PostDTO::fromArray(...)`
- DTO tests boot the framework or use `RefreshDatabase`

**Why It's Harmful**: DTOs are the purest unit test subject — no framework, no database, no mocking. Testing them through feature tests adds 100-200ms overhead per test for zero benefit. It also couples DTO coverage to route coverage, leaving some DTO paths untested.

**Real-World Consequence**: A DTO used internally (not exposed via any API endpoint) has a constructor bug. No feature test covers that path because no endpoint uses it directly. The bug is caught only when a developer runs the code manually.

**Preferred Alternative**: Instantiate DTOs directly with `new PostDTO(...)` or `PostDTO::fromArray(...)` and use plain PHP assertions.

**Refactoring Strategy**:
1. Identify all DTO classes in the codebase
2. Write direct instantiation tests for each DTO
3. Remove any DTO-specific assertions from feature tests (keep them for route wiring)

**Detection Checklist**:
- [ ] Every DTO has direct instantiation tests
- [ ] No DTO test boots the framework or uses the database
- [ ] Feature tests don't contain DTO-specific assertions

**Related Rules**: Test Construction From Each Input Type
**Related Skills**: Test DTOs Unit

---

## Anti-Pattern 2: Missing Serialization Tests

**Category**: Testing completeness

**Description**: Testing DTO construction thoroughly but never verifying that `toArray()`, `toJson()`, or `json_encode()` produces the correct output.

**Warning Signs**:
- Tests assert `$dto->title === 'Hello'` but never call `$dto->toArray()`
- A key is present in DTO construction but absent in serialization output
- JSON serialization silently drops null fields or adds unexpected keys

**Why It's Harmful**: A DTO that constructs correctly but serializes incorrectly produces broken API responses. The most common serialization bugs — missing keys, wrong key names, extra null fields — are invisible to construction-only tests.

**Real-World Consequence**: A DTO adds a new `tags` array field. Construction works correctly. But `toArray()` omits `tags` because the developer forgot to add it to the serialization method. The API response never includes tags. The bug is caught only in production.

**Preferred Alternative**: Always test `toArray()` output matches expected keys and values exactly. Test `toJson()` and `json_encode()` separately if used.

**Refactoring Strategy**:
1. Add a `toArray()` assertion for every DTO: construct with known values, assert exact array match
2. If the DTO uses custom `toJson()`, add a JSON assertion as well
3. Use `assertExactJson` or `toBe` for precise matching

**Detection Checklist**:
- [ ] Every DTO has a serialization test (`toArray()` or equivalent)
- [ ] Serialization output is compared with expected keys and values
- [ ] JSON serialization is tested if `toJson()` is custom

**Related Rules**: Test Serialization
**Related Skills**: Test DTOs Unit
**Related Decision Trees**: Tree 2 — Serialization and Immutability Testing

---

## Anti-Pattern 3: No Type Enforcement Tests

**Category**: Testing correctness

**Description**: Never testing that the DTO rejects values of the wrong type.

**Warning Signs**:
- All DTO tests pass valid typed input
- No test wraps construction in `expect(fn() => ...)->toThrow(TypeError::class)`
- PHP 8 typed properties are assumed correct without verification

**Why It's Harmful**: PHP 8 typed properties are the primary defense against data corruption at the API boundary. Without explicit type enforcement tests, a DTO that accepts `int` for a `string` field (or vice versa) silently coerces the value. This masks upstream validation failures and corrupts downstream logic.

**Real-World Consequence**: A DTO's `views` property is typed `int`. A service passes a string `"100"`. PHP coerces it to `int(100)` silently. The bug is masked by PHP's type coercion. A `string` field like `email` receives an array — PHP throws `TypeError`, but only if the array can't be coerced.

**Preferred Alternative**: For each typed property, add a test that passes the wrong type and asserts `TypeError`.

**Refactoring Strategy**:
1. For each DTO property, identify its PHP type
2. Add a test: `expect(fn() => PostDTO::fromArray(['views' => 'not-a-number']))->toThrow(TypeError::class)`
3. Cover string/int, int/string, and array/string mismatches

**Detection Checklist**:
- [ ] Each typed DTO property has a wrong-type test
- [ ] Tests assert `TypeError` is thrown for type mismatches
- [ ] Mixed-type properties are exempted

**Related Rules**: Test Type Enforcement
**Related Skills**: Test DTOs Unit

---

## Anti-Pattern 4: Testing Only Full-Input Construction

**Category**: Testing completeness

**Description**: Testing DTO construction only with all fields provided, never testing with minimal input or partial input where defaults apply.

**Warning Signs**:
- All DTO construction tests provide every possible field
- No test constructs a DTO with only required fields
- Default values for optional fields are never verified

**Why It's Harmful**: The most common DTO bugs surface when fields are omitted: wrong default values, null instead of expected default, or crashes from missing non-nullable fields. If all tests provide every field, these bugs go undetected.

**Real-World Consequence**: A DTO's `status` field defaults to `null` instead of `'draft'`. All tests provide `status: 'published'` explicitly. In production, services create DTOs without `status`, and the null value propagates, causing a `TypeError` deep in the business logic.

**Preferred Alternative**: Test with full input (all fields), partial input (only required), and minimal input (empty where allowed), verifying defaults for each omitted field.

**Refactoring Strategy**:
1. For each DTO, identify required vs optional fields
2. Add a test constructing with only required fields
3. Assert each optional field has the expected default value

**Detection Checklist**:
- [ ] Construction is tested with minimal (required-only) input
- [ ] Default values for all optional fields are verified
- [ ] Full-input construction is tested as a separate case

**Related Rules**: Test Default Values For Optional Fields
**Related Skills**: Test DTOs Unit
**Related Decision Trees**: Tree 1 — Construction Source Testing

---

## Anti-Pattern 5: Mutable DTOs Without Immutability Tests

**Category**: Design

**Description**: Creating DTOs with public setters or mutable properties, without testing that they cannot be modified after construction.

**Warning Signs**:
- DTO properties are `public` (not `readonly`) and have setter methods
- No test verifies the DTO cannot be modified after `toArray()` or other calls
- Services modify DTOs after construction

**Why It's Harmful**: Mutable DTOs defeat their core purpose as predictable data contracts. If a service modifies a DTO after construction, the original data is lost. Side effects propagate unpredictably, and tracing the source of modified data becomes difficult.

**Real-World Consequence**: A service receives a `PostDTO`, modifies `$dto->status = 'published'`, and passes it to another service. The second service sees the modified status and acts on it. The original caller never knows the DTO was mutated. This leads to race conditions and data integrity bugs.

**Preferred Alternative**: Use PHP 8.2 `readonly` classes for DTOs, or at minimum make properties private with getters only. Test that no setter methods exist.

**Refactoring Strategy**:
1. Mark DTO classes as `readonly` (PHP 8.2)
2. Or make all properties `private` with only getter methods
3. Add an immutability test: `expect($dto)->not->toHaveMethods(['setTitle', '__set'])`

**Detection Checklist**:
- [ ] DTO properties are `readonly` or `private` with only getters
- [ ] No setter methods exist on DTOs
- [ ] An immutability test verifies no modification is possible

**Related Rules**: Test Immutability
**Related Skills**: Test DTOs Unit
**Related Decision Trees**: Tree 2 — Serialization and Immutability Testing

---

## Anti-Pattern 6: DTOs with Business Logic

**Category**: Design

**Description**: Adding business logic methods (calculations, transformations, validation) to DTOs, blurring the line between data carrier and service.

**Warning Signs**:
- DTOs have methods beyond constructors, getters, and serialization
- DTOs contain `calculateTotal()`, `isValid()`, or similar business logic
- DTOs depend on services or repositories

**Why It's Harmful**: DTOs with business logic violate the Single Responsibility Principle. They become harder to test (now they need business-logic tests, not just data tests), harder to reason about, and harder to refactor. Business logic scattered across DTOs is invisible to developers expecting pure data containers.

**Real-World Consequence**: An `OrderDTO` has a `calculateTax()` method that depends on a `TaxService`. Testing the DTO now requires mocking the `TaxService`. The simple data contract becomes a complex test subject. A refactoring that changes tax calculation must update the DTO, its consumers, and its tests.

**Preferred Alternative**: Keep DTOs as pure data carriers with only constructor, getters, and serialization. Move business logic to services or action classes.

**Refactoring Strategy**:
1. Identify any business logic methods in DTOs
2. Move them to the appropriate service or action class
3. Update DTO tests to only verify construction, serialization, immutability, and type enforcement

**Detection Checklist**:
- [ ] DTOs have no methods besides constructors, getters, and serialization
- [ ] No business logic depends on DTO state (calculations, validation)
- [ ] DTOs don't import services, repositories, or framework classes

**Related Rules**: DTOs Need Zero Mocking (from Layer Isolation)
**Related Skills**: Test DTOs Unit
