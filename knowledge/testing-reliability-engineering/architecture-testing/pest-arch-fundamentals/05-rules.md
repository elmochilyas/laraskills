# Rules — Pest Architecture Testing Fundamentals

## Rule 1: Never Use Architecture Tests for Runtime Behavior Validation
| Field | Value |
|-------|-------|
| **Name** | Never Use Architecture Tests for Runtime Behavior Validation |
| **Category** | Scope & Boundaries |
| **Rule** | Never use `arch()` tests to validate runtime behavior (method return values, logic correctness, database state). Use feature or unit tests for behavioral verification. |
| **Reason** | Architecture tests only inspect code structure (class inheritance, trait usage, namespace membership). They cannot execute code or validate runtime behavior. Using them for behavioral expectations creates false confidence — the test passes even if the method has wrong logic. |
| **Bad Example** | `arch()->expect('App\Services\InvoiceService')->toHaveMethod('calculateTotal')` — confirms method exists but not that it calculates correctly. |
| **Good Example** | Feature test: `test('calculateTotal returns correct amount')` — validates actual behavior. |
| **Exceptions** | Debug statement detection (`not->toUse('dd')`) is a valid structural check that contributes to security. |
| **Consequences Of Violation** | False confidence from passing architecture tests that don't verify actual behavior. |

## Rule 2: Write Expectations as Contracts, Not Individual Checks
| Field | Value |
|-------|-------|
| **Name** | Write Expectations as Contracts, Not Individual Checks |
| **Category** | Test Design |
| **Rule** | Write architecture expectations as broad contracts targeting namespaces, not individual classes. Prefer `arch()->expect('App\Services')->toExtend('BaseService')` over listing each service class. |
| **Reason** | Namespace-level contracts are the test serving as source of truth for architectural rules. When new classes are added, they automatically inherit the contract's expectations. Individual class checks require updating every time a class is added. |
| **Bad Example** | `arch()->expect('App\Services\InvoiceService')->toExtend('BaseService'); arch()->expect('App\Services\UserService')->toExtend('BaseService');` — must add new line for each new service. |
| **Good Example** | `arch()->expect('App\Services')->toExtend('Illuminate\Support\ServiceProvider')` — covers all current and future service classes. |
| **Exceptions** | When a specific class must have a unique architectural constraint that doesn't apply to its namespace peers. |
| **Consequences Of Violation** | Architectural tests grow indefinitely; new classes may bypass contract requirements. |

## Rule 3: Start Permissive, Tighten Over Time
| Field | Value |
|-------|-------|
| **Name** | Start Permissive, Tighten Over Time |
| **Category** | Adoption Strategy |
| **Rule** | Begin architecture testing with permissive expectations and generous `ignoring()` lists. Tighten expectations gradually as legacy code is refactored. |
| **Reason** | Immediate strict enforcement on existing codebases creates thousands of violations, making the test noise that developers ignore. Starting permissive allows the team to fix violations at a sustainable pace while preventing new ones. |
| **Bad Example** | `arch()->expect('App')->not->toUse('DB')` on a codebase with 200 direct DB references — 200 failures, test ignored. |
| **Good Example** | `arch()->expect('App')->not->toUse('DB')->ignoring('app/Legacy')` — blocks new DB usage in code directories. |
| **Exceptions** | Greenfield projects where no legacy code exists. Start with full enforcement. |
| **Consequences Of Violation** | Architecture tests create noise; developers stop paying attention to violations. |

## Rule 4: Place Arch Tests in CI Lint Stage
| Field | Value |
|-------|-------|
| **Name** | Place Arch Tests in CI Lint Stage |
| **Category** | CI & Pipeline |
| **Rule** | Run architecture tests in the lint/static analysis stage of CI, before the main test suite. They should not depend on a database or application boot. |
| **Reason** | Architecture tests complete in milliseconds with no external dependencies. Running them first gives the fastest possible feedback — a broken architectural rule is caught in seconds, not minutes. |
| **Bad Example** | `php artisan test` includes arch and feature tests together — arch violation found only after database setup, migrations, and feature test execution. |
| **Good Example** | CI lint job: `run: ./vendor/bin/pest --arch` (1-2s); followed by test job only if lint passes. |
| **Exceptions** | CI pipelines where adding a separate job adds unacceptable complexity. |
| **Consequences Of Violation** | Slow feedback on architectural violations; wasted CI resources on failed runs. |

## Rule 5: Use Namespace Targeting for PSR-4 Code
| Field | Value |
|-------|-------|
| **Name** | Use Namespace Targeting for PSR-4 Code |
| **Category** | Syntax & Accuracy |
| **Rule** | Use namespace strings (`expect('App\Models')`) for PSR-4 code. Use directory paths (`expect('app/Models')`) only for non-PSR-4 or legacy code. |
| **Reason** | Namespace targeting uses PHP's autoloader to resolve classes, which is more reliable and faster than directory scanning. Directory paths may include non-class files and don't respect namespace resolution rules. |
| **Bad Example** | `arch()->expect('app/Models')->toExtend('Model')` — directory path for PSR-4 code; may miss or misidentify classes. |
| **Good Example** | `arch()->expect('App\Models')->toExtend('Illuminate\Database\Eloquent\Model')` — namespace targeting. |
| **Exceptions** | Non-PSR-4 codebases or legacy directories that don't follow namespace conventions. |
| **Consequences Of Violation** | Mock expectations apply to wrong classes; tests may not apply where expected. |

## Rule 6: Document Every `ignoring()` Exception
| Field | Value |
|-------|-------|
| **Name** | Document Every `ignoring()` Exception |
| **Category** | Maintenance & Communication |
| **Rule** | Add a comment explaining why each class or namespace is in the `ignoring()` list. Review and remove exemptions quarterly. |
| **Reason** | Undocumented exemptions accumulate indefinitely. A comment explains whether the exemption is temporary (legacy code to be refactored) or permanent (valid architectural exception). Quarterly review ensures the list doesn't grow indefinitely. |
| **Bad Example** | `->ignoring('App\Debug\RayLogger')` — no explanation; team doesn't know if this is temporary or permanent. |
| **Good Example** | `->ignoring('App\Debug\RayLogger') // Temporary: RayLogger will be removed in Q3 2026` — clear intent and timeline. |
| **Exceptions** | None. Every exemption should have a documented reason. |
| **Consequences Of Violation** | Exemption list grows indefinitely; architectural violations accumulate; test effectiveness degrades. |
