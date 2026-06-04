# Rules — Fault Injection Testing with Laravel Resilience

## Rule 1: Write Fallback Code Before Resilience Tests
| Field | Value |
|-------|-------|
| **Name** | Write Fallback Code Before Resilience Tests |
| **Category** | Methodology & Order |
| **Rule** | Implement fallback behavior in the application code before writing resilience tests that verify it. Never write resilience tests for services without fallback code. |
| **Reason** | Resilience tests inject faults specifically to verify that fallback code executes correctly. Without fallback code, every resilience test fails with no useful signal — the test validates nothing except that "the service crashes when it fails." Fallback code must exist first. |
| **Bad Example** | `Resilience::fake(PaymentGateway::class, 'charge', ExceptionFault::class)` — no fallback code exists; test fails and the failure reveals nothing new. |
| **Good Example** | First implement: `catch (GatewayException $e) { return $this->cachedResponse(); }`. Then test: inject fault, assert fallback response. |
| **Exceptions** | Resilience tests designed to verify that the application correctly propagates errors when no fallback exists. |
| **Consequences Of Violation** | Tests that fail without providing useful signal; wasted test effort. |

## Rule 2: Inject One Fault Per Test
| Field | Value |
|-------|-------|
| **Name** | Inject One Fault Per Test |
| **Category** | Test Design |
| **Rule** | Inject exactly one fault type (ExceptionFault, TimeoutFault, or LatencyFault) in each resilience test. Never combine multiple faults in the same test. |
| **Reason** | Each fault type exercises a different failure handling path. Multiple faults in one test make it impossible to determine which fault caused the observed behavior. Test each fault type separately to validate each fallback path independently. |
| **Bad Example** | Injecting both `ExceptionFault` and `TimeoutFault` in the same test — failure could be from either; unclear which path was exercised. |
| **Good Example** | Test 1: `ExceptionFault` → verify fallback. Test 2: `TimeoutFault` → verify timeout handling. Separate tests. |
| **Exceptions** | Tests designed to validate behavior under multiple simultaneous faults (after single-fault tests pass). |
| **Consequences Of Violation** | Inconclusive test results; inability to verify specific fallback paths. |

## Rule 3: Always Assert Fallback Behavior After Fault Injection
| Field | Value |
|-------|-------|
| **Name** | Always Assert Fallback Behavior After Fault Injection |
| **Category** | Assertions & Completeness |
| **Rule** | Every fault injection must be followed by an assertion that verifies the fallback behavior. Never inject a fault without asserting the response. |
| **Reason** | Injecting a fault and not checking the response validates nothing. The test passes even if fallback code doesn't execute. `assertFallbackUsed()` or response content assertions are required to verify that the application correctly handles the failure. |
| **Bad Example** | `Resilience::fake(Service::class, 'method', ExceptionFault::class); $this->get('/endpoint'); // no assertion` — test passes even without fallback. |
| **Good Example** | `$this->injectFault(...); $response = $this->get('/endpoint'); $response->assertOk(); $this->assertFallbackUsed();` — verifies fallback execution. |
| **Exceptions** | Tests designed to verify that the application propagates the error correctly (assert specific error response). |
| **Consequences Of Violation** | Test passes vacuously; fallback code never actually executes; false confidence. |

## Rule 4: Clear Faults Between Tests
| Field | Value |
|-------|-------|
| **Name** | Clear Faults Between Tests |
| **Category** | Isolation & Reliability |
| **Rule** | Clear all injected faults in `setUp()`/`beforeEach()` or `tearDown()`/`afterEach()`. Never let faults persist across tests. |
| **Reason** | Active faults persisting across tests cause unpredictable, cascading failures. A fault injected in test A affects test B if not cleared, making tests order-dependent. Each test should start with a clean state. |
| **Bad Example** | Fault injected in `test_payment_gateway_fallback` — persists to `test_invoice_creation` and causes unexpected failure. |
| **Good Example** | `beforeEach(fn () => Resilience::clearFaults())` — every test starts with no active faults. |
| **Exceptions** | Suite-level fault configuration in `beforeAll()` for integration scenarios (document clearly). |
| **Consequences Of Violation** | Order-dependent test failures; unpredictable test behavior; wasted debugging time. |

## Rule 5: Run Resilience Tests in a Separate CI Stage
| Field | Value |
|-------|-------|
| **Name** | Run Resilience Tests in a Separate CI Stage |
| **Category** | CI & Pipeline |
| **Rule** | Run resilience tests (especially those with TimeoutFault and LatencyFault) in a separate CI stage or scheduled workflow. Never include them in the main PR test suite. |
| **Reason** | TimeoutFault and LatencyFault add 100-500ms per test. A suite of 50 resilience tests with latency injection adds 5-25 seconds to CI run time. The main test suite must remain fast for rapid developer feedback. Resilience tests should run in a separate stage after the main suite passes. |
| **Bad Example** | Including resilience tests with TimeoutFault in `php artisan test` — CI time doubles. |
| **Good Example** | Main CI: `php artisan test --exclude=resilience`. Separate job: `php artisan test --group=resilience`. |
| **Exceptions** | ExceptionFault-only tests that complete in milliseconds without latency injection. |
| **Consequences Of Violation** | Slow main CI pipeline; delayed developer feedback. |

## Rule 6: Use Short Timeout Values in Test Faults
| Field | Value |
|-------|-------|
| **Name** | Use Short Timeout Values in Test Faults |
| **Category** | Test Performance |
| **Rule** | Configure TimeoutFault and LatencyFault with short values for testing: 100-200ms timeout, 50-100ms latency. Never use production-scale timeouts (5s) in tests. |
| **Reason** | Timeout faults delay test execution by the configured duration. A 5-second timeout makes the test 5 seconds slower. Using 100ms achieves the same validation (timeout handling code path is exercised) while keeping tests fast. |
| **Bad Example** | `Resilience::fake(...)->willTimeout(5000)` — test takes 5 extra seconds to verify a code path that 100ms would also trigger. |
| **Good Example** | `Resilience::fake(...)->willTimeout(100)` — same fallback path exercised in 100ms. |
| **Exceptions** | Tests that verify specific timeout duration-dependent behavior (e.g., retry after X seconds). |
| **Consequences Of Violation** | Slow resilience tests; cumulative CI time waste across the suite. |
