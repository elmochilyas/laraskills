# Rules — Pest Mutation Testing

## Rule 1: Always Use `covers()` to Scope Mutation
| Field | Value |
|-------|-------|
| **Name** | Always Use `covers()` to Scope Mutation |
| **Category** | Performance & Scope |
| **Rule** | Always declare `covers(ClassName::class)` on every test that uses mutation. Never run `--mutate` without `covers()` annotations. |
| **Reason** | Without `covers()`, Pest mutates the entire codebase, taking 30+ minutes and mutating unrelated code. With `covers()`, mutation is scoped to the class under test, completing in 1-5 minutes. The #1 source of confusion for Pest mutation users is missing `covers()` — without it, no mutation happens because Pest doesn't know what to mutate. |
| **Bad Example** | `php artisan test --mutate` with no `covers()` annotations — mutates everything or mutates nothing; impractical. |
| **Good Example** | `covers(InvoiceCalculator::class); test('calculates total', function () { ... })` — targeted, fast mutation. |
| **Exceptions** | Integration-level mutation tests where a test exercises multiple classes. Use `covers()` for the primary class under test. |
| **Consequences Of Violation** | Impractically slow mutation runs; or no mutation occurs at all (silent failure). |

## Rule 2: Set Realistic MSI Targets — Start at 60%
| Field | Value |
|-------|-------|
| **Name** | Set Realistic MSI Targets — Start at 60% |
| **Category** | Thresholds & Strategy |
| **Rule** | Set `--min=60` for initial mutation testing adoption. Gradually escalate to 70-80% as test quality improves. Never set `--min=100`. |
| **Reason** | A 60% target that the team achieves is more valuable than a 100% target that's ignored. Starting too high causes the first run to show 30% MSI, demoralizing the team and leading to abandonment. Incremental improvement builds momentum. |
| **Bad Example** | `--min=100` on first mutation run — 35% MSI; team gives up. |
| **Good Example** | Start at `--min=60`; celebrate reaching 60%; raise target to 70% next quarter. |
| **Exceptions** | Well-tested critical paths (auth, billing) where 80%+ is achievable from the start. |
| **Consequences Of Violation** | Team abandons mutation testing; no quality improvement. |

## Rule 3: Review Surviving Mutations — Don't Just Check the Score
| Field | Value |
|-------|-------|
| **Name** | Review Surviving Mutations — Don't Just Check the Score |
| **Category** | Process & Culture |
| **Rule** | Always review surviving mutations after each mutation run. Determine whether each survivor needs a test or is an acceptable equivalent mutation. |
| **Reason** | The MSI score alone doesn't tell you which behaviors are untested. A score of 85% may be acceptable, but the 15% survivors could include critical auth logic or a security check that's not tested. Each survivor is a discussion point — either the behavior needs a test, or the mutation is acceptable. |
| **Bad Example** | Checking `--min=70` passes and never looking at survivors — untested auth bypass check goes unnoticed. |
| **Good Example** | After mutation run: "3 survivors. 2 are equivalent boolean flips (acceptable). 1 is a missing `isAdmin()` check — adding a test." |
| **Exceptions** | Teams using Infection baseline to track acceptable survivors automatically. |
| **Consequences Of Violation** | Untested behaviors accumulate; mutation testing becomes a vanity metric. |

## Rule 4: Combine `--mutate` with `--filter` for Fast Local Feedback
| Field | Value |
|-------|-------|
| **Name** | Combine `--mutate` with `--filter` for Fast Local Feedback |
| **Category** | Workflow & Performance |
| **Rule** | Use `php artisan test --mutate --filter=SpecificTest` during development to target mutation to a specific test file. |
| **Reason** | Running mutation on the entire test suite takes 5-30 minutes. During development, you only need to verify that the specific test you're writing has good coverage. Filtering reduces feedback time to 1-2 minutes. |
| **Bad Example** | Running `php artisan test --mutate` during development — waiting 15 minutes for results on every change. |
| **Good Example** | `php artisan test --mutate --filter=InvoiceCalculatorTest` — 2-minute feedback during development. |
| **Exceptions** | Final pre-commit verification should run broadly, not with `--filter`. |
| **Consequences Of Violation** | Slow development feedback; developers stop using mutation testing during TDD. |

## Rule 5: Target Mutation on Service and Action Classes First
| Field | Value |
|-------|-------|
| **Name** | Target Mutation on Service and Action Classes First |
| **Category** | Adoption Strategy |
| **Rule** | Apply mutation testing to service and action classes before controllers, models, or views. Focus on classes containing business logic with the highest mutation impact. |
| **Reason** | Services and actions contain core business logic. a surviving mutation here likely means a missing test for a business rule. Controllers typically have thin logic (HTTP routing + authorization calls). Models often have predictable CRUD operations. Prioritizing services provides the highest ROI. |
| **Bad Example** | Spending mutation efforts on `UserControllerTest` (HTTP routing) instead of `InvoiceServiceTest` (business logic). |
| **Good Example** | `covers(InvoiceCalculator::class)` on business logic tests; less focus on controller/CRUD tests. |
| **Exceptions** | Models with complex business logic (scopes, computed attributes, event handling) also deserve mutation testing. |
| **Consequences Of Violation** | Mutation testing effort spent on low-value targets; business logic remains untested. |

## Rule 6: Prefer Pest Mutation Before Adopting Infection
| Field | Value |
|-------|-------|
| **Name** | Prefer Pest Mutation Before Adopting Infection |
| **Category** | Tool Selection |
| **Rule** | Start with Pest's built-in mutation testing before adopting Infection PHP. Pest mutation is sufficient for most Laravel projects. Only adopt Infection for advanced needs (custom mutators, full differential coverage, comprehensive baseline management). |
| **Reason** | Pest mutation requires zero configuration and integrates directly with `php artisan test`. It uses Infection's mutators under the hood, so mutation quality is identical. Infection adds configuration overhead (infection.json, baseline files) and is only justified for comprehensive pre-release analysis. |
| **Bad Example** | Setting up Infection JSON configuration and baseline before trying `php artisan test --mutate` — unnecessary complexity. |
| **Good Example** | `covers(Service::class); php artisan test --mutate --min=70` — simple, zero-config, sufficient. |
| **Exceptions** | Large codebases requiring custom mutators, differential mutation, or team-wide baseline management. |
| **Consequences Of Violation** | Over-engineered mutation setup; unnecessary configuration overhead. |
