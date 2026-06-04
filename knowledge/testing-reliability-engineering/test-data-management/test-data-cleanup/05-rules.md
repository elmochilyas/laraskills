# Rules — Test Data Cleanup (Minimal Data Principle)

## Rule 1: Create Only the Minimum Data Required for the Assertion
| Field | Value |
|-------|-------|
| **Name** | Create Only the Minimum Data Required for the Assertion |
| **Category** | Data Minimization |
| **Rule** | Create exactly the minimum records needed to trigger and verify the target behavior. Never add extra records "just in case." |
| **Reason** | Every unnecessary record adds 1-5ms of creation time plus transaction overhead. For a test suite with 500 database tests, each unnecessary record adds up across the entire run. More data also obscures the test's intent — the reader must figure out which records are essential and which are noise. |
| **Bad Example** | `User::factory(10)->create()` for a test that only needs to verify "one user can view their profile" — 9 unnecessary records. |
| **Good Example** | `User::factory()->create(['name' => 'Test User'])` — exactly 1 record for a profile-view test. |
| **Exceptions** | Pagination tests (need per_page + 1 records) and sorting tests (need diverse values). |
| **Consequences Of Violation** | Slow tests; increased CI time; obscured test intent. |

## Rule 2: Use Explicit Values for Asserted Attributes
| Field | Value |
|-------|-------|
| **Name** | Use Explicit Values for Asserted Attributes |
| **Category** | Determinism & Clarity |
| **Rule** | Use explicit fixed values (e.g., `'email' => 'test@example.com'`) for any attribute that appears in a test assertion. Never use Faker-generated values in assertion comparisons. |
| **Reason** | Explicit values make assertions predictable and reproducible. Faker values may contain special characters (dots, plus signs, accented characters) that cause assertion failures on edge-case output. An explicit value guarantees the same assertion every time. |
| **Bad Example** | `$user = User::factory()->create(); $this->assertDatabaseHas('users', ['email' => $user->email])` — Faker email may contain problematic characters. |
| **Good Example** | `$user = User::factory()->create(['email' => 'test@example.com']); $this->assertDatabaseHas('users', ['email' => 'test@example.com'])` — fixed, predictable value. |
| **Exceptions** | Fields where the specific value is irrelevant and only existence or count matters. |
| **Consequences Of Violation** | Non-reproducible assertion failures from edge-case Faker output. |

## Rule 3: Remove Unused Factory-Created Records
| Field | Value |
|-------|-------|
| **Name** | Remove Unused Factory-Created Records |
| **Category** | Cleanliness & Performance |
| **Rule** | Delete any factory-created records that are not used in the test's assertion. Never leave dead data from copy-paste or "might need it" additions. |
| **Reason** | Dead data is the most common form of test pollution. Developers copy-paste factory calls from other tests without checking if every record is needed. These records slow down tests, increase the cognitive load for readers, and may cause false test interactions (a record created for "no reason" could accidentally satisfy a condition the test should verify). |
| **Bad Example** | `$user1 = User::factory()->create(); $user2 = User::factory()->create(); $admin = User::factory()->admin()->create();` — test only uses `$admin`. |
| **Good Example** | `$admin = User::factory()->admin()->create();` — only the needed record. |
| **Exceptions** | Tests where the presence of additional records is part of the setup (e.g., verifying correct filtering). |
| **Consequences Of Violation** | Slower tests; obscured intent; potential false test behavior. |

## Rule 4: Set a Team Convention for Maximum Records Per Test
| Field | Value |
|-------|-------|
| **Name** | Set a Team Convention for Maximum Records Per Test |
| **Category** | Governance & Standards |
| **Rule** | Establish a team convention: "No test creates more than 10 records without a comment explaining why." Enforce this in code review. |
| **Reason** | Most database tests need 1-3 records. Creating 50+ records is almost always unnecessary and suggests the test should be split or the setup can be simplified. A visible team convention makes developers think twice before adding large factory calls and provides reviewers with a standard to enforce. |
| **Bad Example** | `User::factory(100)->create()` in a test that checks "admin can see user list" — reviewer doesn't know if 100 is intentional or copy-paste. |
| **Good Example** | `User::factory(100)->create(); // 100 users: pagination per_page=50, need 2 full pages + 1 for third page` — commented justification. |
| **Exceptions** | Performance tests that intentionally need production-like data volumes. |
| **Consequences Of Violation** | Data-heavy tests accumulate without scrutiny; CI time grows. |

## Rule 5: Profile Test Data Creation with `--profile`
| Field | Value |
|-------|-------|
| **Name** | Profile Test Data Creation with `--profile` |
| **Category** | Performance & Optimization |
| **Rule** | Use `php artisan test --profile` to identify data-heavy tests. Optimize or split any test where data creation is a significant portion of its runtime. |
| **Reason** | Profiling reveals the actual cost of data creation. A test that creates 50 records may take 200ms — 150ms of which is database writes. Profiling data makes the performance impact visible and helps prioritize optimization. |
| **Bad Example** | "Our test suite is slow" — profiling shows 30% of time is in 3 tests that create 200 records each. |
| **Good Example** | Profile shows `UserSearchTest` creates 100 records and takes 800ms. Refactor to create 15 records (pagination + 1) = 150ms. |
| **Exceptions** | Tests where data creation is inherently expensive and cannot be reduced (e.g., complex integration scenarios). |
| **Consequences Of Violation** | Unnoticed data-heavy tests degrade CI performance over time. |

## Rule 6: Use `RefreshDatabase` for All Test Data Cleanup
| Field | Value |
|-------|-------|
| **Name** | Use `RefreshDatabase` for All Test Data Cleanup |
| **Category** | Isolation & Reliability |
| **Rule** | Use `RefreshDatabase` trait on all test classes that create database records. Never rely on manual cleanup or test ordering for data isolation. |
| **Reason** | `RefreshDatabase` wraps each test in a transaction that rolls back, ensuring no test leaves data for the next test. Manual cleanup (deleting records in `tearDown`) is error-prone (missed records, failing cleanup). Test ordering guarantees don't work in parallel execution. `RefreshDatabase` is the standard, reliable approach. |
| **Bad Example** | `tearDown(): void { User::truncate(); }` — misses related tables; parallel tests collide. |
| **Good Example** | `class UserTest extends TestCase { use RefreshDatabase; }` — automatic, reliable, parallel-safe. |
| **Exceptions** | Tests that intentionally test database persistence across operations (rare). |
| **Consequences Of Violation** | Order-dependent test failures; data leakage between tests; parallel execution collisions. |
