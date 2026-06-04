# Anti-Patterns: Pest Test Structure

## Describe Sprawl
**Description:** Nesting describe blocks more than 3-4 levels deep. Test hierarchy becomes incomprehensible.
**Why it happens:** Developers map every possible subcategory as a nested describe block.
**Consequences:** Tests are hard to navigate; test output is verbose; execution overhead increases.
**Better approach:** Limit to 3 levels (Resource > Action > Scenario). Split into separate files when more depth is needed.

## Monolithic Test File
**Description:** All resource tests in a single file. File grows to thousands of lines.
**Why it happens:** Convenience — one file seems simpler than many.
**Consequences:** Hard to navigate, merge conflicts on every test change, parallel execution limited.
**Better approach:** One file per resource or per action.

## Architecture Test Proliferation
**Description:** Placing architecture tests inside describe blocks, causing them to run on every test iteration.
**Why it happens:** Developers don't realize arch() tests run on file load, not per-test.
**Consequences:** Test suite runs dramatically slower; architecture tests report the same results repeatedly.
**Better approach:** Place arch() expectations at file level only.

## Inconsistent Naming
**Description:** Mixing `it()` and `test()` conventions, inconsistent describe naming, mixing tense and voice.
**Why it happens:** Multiple developers with different preferences contribute to the same test suite.
**Consequences:** Test output is confusing; finding related tests is difficult.
**Better approach:** Establish convention (prefer `it()`) and enforce via code review.
