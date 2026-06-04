# Rules — Test Organization Patterns

## Rule 1: Group Tests by Feature, Not by Implementation Type
| Field | Value |
|-------|-------|
| **Name** | Group Tests by Feature, Not by Implementation Type |
| **Category** | Organization & Structure |
| **Rule** | Organize test files by business feature or domain capability, not by implementation type (Controllers, Services, Models). Each feature directory contains all test types for that feature. |
| **Reason** | Type-based organization scatters tests for a single feature across multiple directories (Controller tests here, Service tests there, Model tests elsewhere). Understanding feature coverage requires opening 5+ files. Feature-based organization keeps all related tests together, making it easy to understand what's tested for a feature and what's missing. |
| **Bad Example** | `tests/Feature/Controllers/InvoiceControllerTest.php`, `tests/Feature/Services/InvoiceServiceTest.php`, `tests/Feature/Models/InvoiceTest.php` — scattered across 3 directories. |
| **Good Example** | `tests/Feature/Invoices/InvoiceCreationTest.php`, `tests/Feature/Invoices/InvoicePaymentTest.php`, `tests/Feature/Invoices/InvoiceCancellationTest.php` — all in one feature directory. |
| **Exceptions** | Very large codebases (>1000 tests) where type-based organization provides additional structure. |
| **Consequences Of Violation** | Scattered, hard-to-navigate test suite; difficulty understanding feature coverage. |

## Rule 2: Use Descriptive Pest Test Names
| Field | Value |
|-------|-------|
| **Name** | Use Descriptive Pest Test Names |
| **Category** | Readability & Communication |
| **Rule** | Write test names as descriptive sentences that communicate the expected behavior. Use `test('description')` format. Never use generic names like `test_invoice()` or `test_auth()`. |
| **Reason** | Test names are the primary documentation of the test suite. A name like `test('rejects invoice with past due date')` communicates exactly what behavior is verified. Generic names require reading the test body to understand intent. Descriptive names also appear in CI failure reports, immediately conveying what broke. |
| **Bad Example** | `test_invoice()` — what about invoices? Payment? Cancellation? Authorization? Unclear. |
| **Good Example** | `test('rejects invoice with past due date')` — clear behavior documented in the name. |
| **Exceptions** | Test helper methods that aren't actual test cases. |
| **Consequences Of Violation** | Uninformative test failure reports; difficulty understanding test intent without reading code. |

## Rule 3: Use Arrange-Act-Assert with Blank Line Separation
| Field | Value |
|-------|-------|
| **Name** | Use Arrange-Act-Assert with Blank Line Separation |
| **Category** | Readability & Structure |
| **Rule** | Structure every test method with three sections separated by blank lines: Arrange (setup), Act (execute the action), Assert (verify the result). Never mix sections. |
| **Reason** | Blank line separation creates a visual structure that makes tests instantly scannable. A reader's eye can quickly identify: "Here's the setup (Arrange), here's the action (Act), here's the verification (Assert)." Mixing sections makes it unclear where setup ends and verification begins. |
| **Bad Example** | `$user = User::factory()->create(); $response = $this->actingAs($user)->get('/dashboard'); $user->update(['name' => 'New']); $response->assertOk();` — assertions mixed with act. |
| **Good Example** | ```
// Arrange
$user = User::factory()->create(['role' => 'admin']);

// Act
$response = $this->actingAs($user)->get('/admin');

// Assert
$response->assertOk();
$response->assertSee('Admin Panel');
``` |
| **Exceptions** | Very short tests (1-2 lines) where blank lines add unnecessary vertical space. |
| **Consequences Of Violation** | Hard-to-read tests; unclear where setup ends and assertions begin; bugs in test logic. |

## Rule 4: Prefer Readable Tests Over DRY Tests
| Field | Value |
|-------|-------|
| **Name** | Prefer Readable Tests Over DRY Tests |
| **Category** | Readability & Maintainability |
| **Rule** | Accept some duplication in tests if it makes each test self-contained and readable. Never extract shared setup into helpers that obscure the test's intent. |
| **Reason** | Tests are read more often than they are written. A test that contains all its setup inline is fully understandable without navigating to other files. Over-extracted test helpers (deep factory method chains, distant setUp blocks) force readers to jump between files to understand what a test does. "Boring" test code is maintainable test code. |
| **Bad Example** | `$this->createStandardInvoiceWithLineItemsAndTaxForPremiumUser()` — the test reader must navigate to this method to understand what's created; the name doesn't reveal what's included. |
| **Good Example** | `$invoice = Invoice::factory()->hasItems(3)->create(['user_id' => $user->id, 'status' => 'draft']);` — everything is visible in the test. |
| **Exceptions** | Complex setups that are identical across 10+ tests (extract with a descriptive name). |
| **Consequences Of Violation** | Hard-to-read tests; developers spend more time understanding test setup than test logic. |

## Rule 5: Limit Test Files to ~300 Lines
| Field | Value |
|-------|-------|
| **Name** | Limit Test Files to ~300 Lines |
| **Category** | Maintainability & Navigation |
| **Rule** | Split test files that exceed approximately 300 lines into multiple files grouped by sub-feature. Never maintain single files exceeding 500 lines. |
| **Reason** | Files over 300 lines are hard to navigate, hard to review in PRs, and tend to accumulate unrelated tests. A 1000-line `UserTest.php` might contain authentication, profile management, and notification tests — these should be separate files. Small, focused files are easier to find, understand, and maintain. |
| **Bad Example** | `UserTest.php` — 850 lines, 34 tests covering login, registration, profile, notifications, and settings. Hard to navigate. |
| **Good Example** | `UserAuthenticationTest.php`, `UserProfileTest.php`, `UserNotificationTest.php` — each under 250 lines. |
| **Exceptions** | Integration test scenarios that inherently require many test cases for a single complex feature. |
| **Consequences Of Violation** | Hard-to-navigate test files; merge conflicts from multiple developers editing the same file. |
