# Rules: Model Factory Relationships

## Rule: Use Factory Relationship Methods
- **Condition:** When creating related models in tests
- **Action:** Use `factory()->for()` for belongs-to and `factory()->has()` for has-many relationships. Avoid manual foreign key assignment.
- **Consequence:** Relationship creation is expressive and handles foreign keys automatically.
- **Enforcement:** Code review flags manual foreign key assignment where factory methods could be used.

## Rule: Recycle Shared Parent Models
- **Condition:** When creating multiple child records that share the same parent
- **Action:** Use `recycle($parentModel)` to reuse the same parent instance across all child records.
- **Consequence:** Reduces database inserts; parent created once instead of per-child.
- **Enforcement:** Test performance review checks for unnecessary duplicated parent creation.

## Rule: Create Minimum Viable Relationships
- **Condition:** When setting up test data
- **Action:** Create only the relationships required by the specific test scenario. Avoid adding unrelated relationships.
- **Consequence:** Tests run faster; test intent is clearer.
- **Enforcement:** Code review questions unrelated relationship creation.

## Rule: Use States For Semantic Relationship Setup
- **Condition:** When creating models with specific relationship conditions
- **Action:** Define factory states like `withComments(int $count)` to semantically describe relationship creation.
- **Consequence:** Test code reads as business scenario descriptions.
- **Enforcement:** Review flags inline relationship creation with >3 chained calls — extract to state.

## Rule: Use sequence() For Varied Data
- **Condition:** When creating multiple related records with varying attributes
- **Action:** Use `sequence()` to define incremental or alternating attribute values. Avoid creating models one-by-one.
- **Consequence:** Reduces setup code; prevents unique constraint violations.
- **Enforcement:** Review flags loop-based creation where sequence() would work.
