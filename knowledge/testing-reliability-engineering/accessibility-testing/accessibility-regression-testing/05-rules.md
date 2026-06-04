# Rules — Accessibility Regression Testing

## Rule 1: Run axe-core on Critical Pages Only — Never on Every Page in Every Test
| Field | Value |
|-------|-------|
| **Name** | Run axe-core on Critical Pages Only — Never on Every Page in Every Test |
| **Category** | Performance & Scope |
| **Rule** | Run axe-core accessibility audits only on the top 5-10 critical user-facing pages (login, checkout, registration, dashboard). Never run axe-core on every page in every Dusk test. |
| **Reason** | axe-core adds 500-2000ms per execution depending on DOM complexity. Running it on every page in every test balloons CI time from minutes to hours. Focused audits on critical pages catch the highest-impact regressions without degrading CI performance. |
| **Bad Example** | Adding axe-core audit to every Dusk test — 50 Dusk tests × 1s each = 50 seconds of axe-core overhead per CI run. |
| **Good Example** | Adding axe-core to 5 critical page tests only — 5 seconds total overhead, covering login, checkout, registration, profile, and dashboard. |
| **Exceptions** | Dedicated accessibility CI jobs that run comprehensive nightly scans with Pa11y. |
| **Consequences Of Violation** | CI time increases dramatically; axe-core audits are disabled to restore performance. |

## Rule 2: Test Error States — Not Just Happy Path Accessibility
| Field | Value |
|-------|-------|
| **Name** | Test Error States — Not Just Happy Path Accessibility |
| **Category** | Coverage & Completeness |
| **Rule** | Always test accessibility of error states (form validation errors, 404 pages, 500 errors) in addition to happy paths. Error states are where accessibility most commonly fails. |
| **Reason** | Form validation without `aria-invalid` on error fields, error summaries without `role="alert"`, and focus not moving to error messages are the most common accessibility regressions in Laravel applications. Happy paths are well-tested; error states are often overlooked. |
| **Bad Example** | Testing only the successful form submission path — form validation errors have no `aria-invalid`, no focus management, and no `role="alert"` announcement. |
| **Good Example** | Submit form with invalid data; verify: `$browser->assertAttribute('@email-input', 'aria-invalid', 'true')`, `assertFocused('@error-summary')`, `assertPresent('[role="alert"]')`. |
| **Exceptions** | Pages that don't have error states (static content pages). |
| **Consequences Of Violation** | Users with screen readers cannot identify or correct form errors; regulatory compliance gaps. |

## Rule 3: Maintain an axe-core Baseline — Fail Only on New Violations
| Field | Value |
|-------|-------|
| **Name** | Maintain an axe-core Baseline — Fail Only on New Violations |
| **Category** | CI & Strategy |
| **Rule** | Store known axe-core violation counts per page in CI artifacts. Configure the CI gate to fail only when violations increase, not on existing violations. |
| **Reason** | Many projects have pre-existing accessibility violations that cannot be fixed immediately. Failing CI on all violations blocks the pipeline indefinitely, so teams disable the check. A baseline approach allows progressive improvement — existing violations are tracked and addressed over time, while new violations are prevented. |
| **Bad Example** | CI fails if any axe-core violations exist — project has 20 pre-existing violations; CI is permanently red; a11y check is disabled. |
| **Good Example** | CI artifact stores baseline: `{ "/login": 3 violations, "/checkout": 5 violations }`. CI fails only if count exceeds baseline. |
| **Exceptions** | Greenfield projects with zero pre-existing accessibility violations. |
| **Consequences Of Violation** | Accessibility CI gate is ignored or disabled; new violations introduced without detection. |

## Rule 4: Pin axe-core Version and Review Rule Changes on Upgrade
| Field | Value |
|-------|-------|
| **Name** | Pin axe-core Version and Review Rule Changes on Upgrade |
| **Category** | Maintenance & Stability |
| **Rule** | Pin the axe-core version used in Dusk tests. Review changelog for new or changed rules before upgrading. Never auto-update axe-core. |
| **Reason** | New axe-core versions add or change accessibility rules. A previously passing page may fail after upgrade due to a new rule, not a real regression. Pinning the version prevents unexpected CI failures from rule changes. Reviewing the changelog ensures the team understands and addresses new rules intentionally. |
| **Bad Example** | `npm install axe-core@latest` — auto-upgrade adds 3 new rules; previously passing pages now fail; team is confused. |
| **Good Example** | `"axe-core": "4.8.2"` in package.json; team reviews changelog before bumping; addresses new rules. |
| **Exceptions** | Projects with comprehensive accessibility teams who actively track WCAG updates. |
| **Consequences Of Violation** | Unexpected CI failures from new axe-core rules; team distrusts accessibility tests. |

## Rule 5: Use `@dusk` Selectors for Keyboard Tab Flow Tests
| Field | Value |
|-------|-------|
| **Name** | Use `@dusk` Selectors for Keyboard Tab Flow Tests |
| **Category** | Test Reliability |
| **Rule** | Use `@dusk` attribute selectors for keyboard navigation tests (`$browser->keys('@body', '{tab}')`). Never use CSS selectors or `pause()` for keyboard flow verification. |
| **Reason** | Keyboard tab flow tests are inherently brittle — tab order depends on DOM structure and focusable elements. `@dusk` selectors isolate the test from DOM structure changes. Using `waitFor()` instead of `pause()` ensures timing doesn't affect keyboard test reliability. |
| **Bad Example** | `$browser->pause(1000)->keys('body', '{tab}')->assertFocused('.nav-link')` — fixed pause and CSS class selector. |
| **Good Example** | `$browser->waitFor('@body')->keys('@body', '{tab}')->assertFocused('@skip-link')` — reliable selector and timing. |
| **Exceptions** | Tests where `@dusk` attributes cannot be added to focusable elements. |
| **Consequences Of Violation** | Flaky keyboard navigation tests; false positives from CSS class changes. |

## Rule 6: Log axe-core "Incomplete" Results for Manual Review
| Field | Value |
|-------|-------|
| **Name** | Log axe-core "Incomplete" Results for Manual Review |
| **Category** | Process & Completeness |
| **Rule** | Store axe-core "incomplete" results in CI artifacts. Schedule regular (monthly) manual review of incomplete items. Never ignore incomplete results. |
| **Reason** | axe-core "incomplete" results require human judgment — automated tools cannot determine if these are violations without manual verification. Without scheduled review, incomplete results accumulate and are forgotten, leaving potential accessibility issues unaddressed. |
| **Bad Example** | axe-core returns 5 incomplete results per page; team ignores them because they're "not violations" — legitimate issues go unaddressed for months. |
| **Good Example** | Incomplete results logged to CI artifact; monthly review: "3 of 5 incomplete items are false positives, 2 need ARIA attribute updates." |
| **Exceptions** | None. Incomplete results always require manual review. |
| **Consequences Of Violation** | Accessibility issues that require human judgment are never reviewed; compliance gaps persist. |
