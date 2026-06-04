# Rules — Laravel Resilience Fault Injection

## Rule 1: Write Fallback Code Before Writing Resilience Tests
| Field | Value |
|-------|-------|
| **Name** | Write Fallback Code Before Writing Resilience Tests |
| **Category** | Methodology & Order |
| **Rule** | Implement fallback behavior in the service before writing a Resilience fault injection test. Never write resilience tests for services without fallback code. |
| **Reason** | Resilience tests verify that fallback code executes when faults are injected. Without fallback code, every test fails with a crash — not a useful signal. Fallback code must exist before the test that validates it. |
| **Bad Example** | `Resilience::fake(PaymentGateway::class)->method('charge')->willThrow(...)` — no fallback exists; test confirms the app crashes, which is already known. |
| **Good Example** | First: `catch (GatewayException $e) { return $this->fallbackResponse(); }`. Then: inject fault, assert `assertFallbackUsed()`. |
| **Exceptions** | Tests that verify error propagation behavior when no fallback exists (document explicitly). |
| **Consequences Of Violation** | Tests fail with no useful signal; effort wasted on tests that confirm known crash behavior. |

## Rule 2: Always Assert Fallback Behavior After Fault Injection
| Field | Value |
|-------|-------|
| **Name** | Always Assert Fallback Behavior After Fault Injection |
| **Category** | Assertions & Completeness |
| **Rule** | Every fault injection must be paired with a fallback assertion. Never inject a fault without verifying the response. |
| **Reason** | Injecting a fault and not checking the response validates nothing — the test passes even if the fallback code doesn't execute. `assertFallbackUsed()`, `assertDegradedButSuccessful()`, or response content assertions are required to confirm correct fallback behavior. |
| **Bad Example** | `Resilience::fake(Service::class)->method('fetch')->willThrow(...); $this->get('/endpoint');` — no assertion; test passes vacuously. |
| **Good Example** | `$this->injectFault(...); $response = $this->get('/endpoint'); $response->assertOk(); $this->assertFallbackUsed();` — verifies fallback. |
| **Exceptions** | Tests that verify the application correctly returns a specific error response when no fallback exists. |
| **Consequences Of Violation** | Test passes vacuously; fallback code may not actually execute; false confidence. |

## Rule 3: Use Per-Test Fault Activation — Never Global
| Field | Value |
|-------|-------|
| **Name** | Use Per-Test Fault Activation — Never Global |
| **Category** | Isolation & Reliability |
| **Rule** | Activate faults within individual test methods using `Resilience::fake()`. Never activate global faults that persist across tests. |
| **Reason** | Global faults leak across test boundaries, causing unpredictable cascade failures. Activating faults per-test ensures isolation — each test controls exactly which faults are active and clears them on completion. |
| **Bad Example** | Setting a global fault in `setUp()` that persists for the entire test class — affects every test, even tests that don't need fault injection. |
| **Good Example** | `test('handles payment timeout'): Resilience::fake(PaymentGateway::class)->method('charge')->willTimeout(100);` — scoped to this test only. |
| **Exceptions** | Suite-level faults for integration scenarios where every test must survive a specific failure (document clearly). |
| **Consequences Of Violation** | Order-dependent test failures; unpredictable behavior; wasted debugging time. |

## Rule 4: Use Short Timeout Values in Test Faults
| Field | Value |
|-------|-------|
| **Name** | Use Short Timeout Values in Test Faults |
| **Category** | Test Performance |
| **Rule** | Configure TimeoutFault and LatencyFault with short values: 100-200ms timeout, 50-100ms latency. Never use production-scale values (5s) in tests. |
| **Reason** | Timeout faults delay test execution by the configured duration. Using 5s makes the test 5 seconds slower. Using 100ms exercises the same code path (timeout handling) while keeping tests fast. The test validates the behavior, not the duration. |
| **Bad Example** | `willTimeout(5000)` — test takes 5+ seconds to verify a code path that 100ms would also exercise. |
| **Good Example** | `willTimeout(100)` — same fallback path exercised in 100ms. |
| **Exceptions** | Tests that verify specific timeout duration-dependent behavior (retry after X seconds). |
| **Consequences Of Violation** | Slow resilience tests; cumulative CI time waste across the suite. |

## Rule 5: Run Resilience Tests in a Separate CI Stage
| Field | Value |
|-------|-------|
| **Name** | Run Resilience Tests in a Separate CI Stage |
| **Category** | CI & Pipeline |
| **Rule** | Run Resilience tests (especially with TimeoutFault and LatencyFault) in a separate CI stage after the main test suite. Never mix them in the same job. |
| **Reason** | Resilience tests with latency/timeout faults are slower than standard tests. Including them in the main test suite increases CI wall time for every PR, slowing developer feedback. A separate stage allows fast main test feedback while still validating resilience. |
| **Bad Example** | `php artisan test` includes resilience tests with 200ms latency faults — every CI run takes 20% longer. |
| **Good Example** | Main CI: `php artisan test --exclude-group=resilience`. Post-deploy: `php artisan test --group=resilience`. |
| **Exceptions** | ExceptionFault-only tests (no latency injection) can run in the main suite if fast enough. |
| **Consequences Of Violation** | Slow main CI; developers bypass resilience tests to restore CI speed. |

## Rule 6: Follow the Discovery → Scaffold → Test Workflow
| Field | Value |
|-------|-------|
| **Name** | Follow the Discovery → Scaffold → Test Workflow |
| **Category** | Methodology & Adoption |
| **Rule** | Always run `php artisan resilience:discover` before writing resilience tests. Use `php artisan resilience:scaffold` to generate test templates. Customize scaffolds with meaningful assertions. |
| **Reason** | Discovery reveals all container-managed services that can be fault-injected. Scaffold generates test templates for each service. Customizing scaffolds with specific assertions tests the actual fallback behavior, not just that the service can be decorated. This workflow ensures comprehensive coverage of all injectable services. |
| **Bad Example** | Manually writing resilience tests without running discovery — miss services that could be tested; duplicate effort. |
| **Good Example** | `php artisan resilience:discover` → review output → `php artisan resilience:scaffold` → customize assertions → run tests. |
| **Exceptions** | Small projects where all services are known and manually enumerated. |
| **Consequences Of Violation** | Missed services with untested fallback behavior; incomplete resilience coverage. |
