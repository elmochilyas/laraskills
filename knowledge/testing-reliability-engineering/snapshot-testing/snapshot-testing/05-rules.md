# Rules — Snapshot Testing Concepts

## Rule 1: Never Use Snapshots as the Only Assertion Mechanism
| Field | Value |
|-------|-------|
| **Name** | Never Use Snapshots as the Only Assertion Mechanism |
| **Category** | Testing Strategy |
| **Rule** | Always combine snapshot assertions with explicit critical-value assertions. Never replace all assertions with snapshot matches. |
| **Reason** | Snapshots detect change, not correctness. A snapshot test will pass if the output changes to another incorrect value. Explicit assertions for critical fields (status codes, error messages, key data values) ensure those fields are always correct regardless of snapshot changes. |
| **Bad Example** | `$response->assertMatchesJsonSnapshot($response->json())` — snapshot passes even if `status` changes from `success` to `error`. |
| **Good Example** | `$response->assertOk(); $this->assertMatchesJsonSnapshot($response->json())` — explicit status assertion plus broad snapshot coverage. |
| **Exceptions** | Trivially correct output where every field is equally important and any change is a failure. |
| **Consequences Of Violation** | Snapshot tests silently validate wrong output; regressions go undetected. |

## Rule 2: Always Set `CREATE_SNAPSHOTS=false` in CI
| Field | Value |
|-------|-------|
| **Name** | Always Set `CREATE_SNAPSHOTS=false` in CI |
| **Category** | CI & Environment |
| **Rule** | Always set the `CREATE_SNAPSHOTS=false` environment variable in CI environments. Never allow CI to create snapshots automatically. |
| **Reason** | CI-created snapshots don't represent actual expected output — they represent whatever output the code happened to produce in CI. This causes "snapshot drift" where tests pass in CI but locally the output is different. Snapshots must be created locally and committed with code changes. |
| **Bad Example** | Running tests in CI without `CREATE_SNAPSHOTS=false` — CI creates new snapshots when they don't exist, drifting from intended output. |
| **Good Example** | CI workflow: `env: CREATE_SNAPSHOTS: false` — tests fail if snapshot doesn't exist, ensuring intentional creation. |
| **Exceptions** | None. CI should never create snapshots. |
| **Consequences Of Violation** | Snapshot drift; tests pass in CI but produce different output locally; regression detection is lost. |

## Rule 3: Use JSON Driver for JSON Output, Not Text Driver
| Field | Value |
|-------|-------|
| **Name** | Use JSON Driver for JSON Output, Not Text Driver |
| **Category** | Driver Selection |
| **Rule** | Use `assertMatchesJsonSnapshot()` for JSON output. Never use `assertMatchesSnapshot()` (text driver) for JSON content. |
| **Reason** | The JSON driver normalizes key ordering and formatting before comparison. The text driver is sensitive to whitespace and key order, causing false failures on trivial formatting differences. JSON output should always use the JSON driver. |
| **Bad Example** | `$this->assertMatchesSnapshot(json_encode($data))` — text driver fails when key order changes. |
| **Good Example** | `$this->assertMatchesJsonSnapshot($data)` — JSON driver normalizes and handles key order. |
| **Exceptions** | Tests that specifically verify JSON key ordering (rare). |
| **Consequences Of Violation** | False-positive snapshot failures on key ordering or whitespace differences. |

## Rule 4: Review Every Snapshot Diff in PR Code Review
| Field | Value |
|-------|-------|
| **Name** | Review Every Snapshot Diff in PR Code Review |
| **Category** | Process & Review |
| **Rule** | Require every snapshot file change to be reviewed as part of the PR. Never approve a PR with snapshot changes without examining the diff. |
| **Reason** | A snapshot diff represents unexpected output changes. An intentional change produces a expected snapshot diff that should be reviewed for correctness. An unintended change (regression) is caught by snapshot diff review. Skipping this step defeats the purpose of snapshot testing. |
| **Bad Example** | Approving PR with "Updated snapshot files" comment and no diff review — regression in API response goes unnoticed. |
| **Good Example** | Reviewing snapshot diff in PR: "The snapshot changed because we added the `email` field to the user response. Approved." |
| **Exceptions** | Automated dependency updates where snapshots must be accepted without review (review baseline separately). |
| **Consequences Of Violation** | Regression detection is lost; unintended output changes reach production. |

## Rule 5: Use Snapshot Testing Only for Stable, Rarely-Changing Outputs
| Field | Value |
|-------|-------|
| **Name** | Use Snapshot Testing Only for Stable, Rarely-Changing Outputs |
| **Category** | Testing Strategy |
| **Rule** | Apply snapshot assertions only to outputs that change infrequently and intentionally. Avoid snapshot testing for outputs that change with every deployment or vary by environment. |
| **Reason** | Frequently changing snapshots train developers to blindly update them without review. When every PR changes a snapshot, the diff review becomes a formality and actual regressions are missed. Snapshots work best as regression detectors for stable contracts. |
| **Bad Example** | Snapshot testing an API response that includes a timestamp — every test run produces a different snapshot. |
| **Good Example** | Snapshot testing an API response after normalizing timestamps to fixed values — stable, reviewable diff. |
| **Exceptions** | Outputs where every change is meaningful and will be reviewed (e.g., contract API responses with versioned endpoints). |
| **Consequences Of Violation** | Developers blindly update snapshots; real regressions are missed; snapshot testing becomes noise. |

## Rule 6: Keep Single Snapshot Files Under 500KB
| Field | Value |
|-------|-------|
| **Name** | Keep Single Snapshot Files Under 500KB |
| **Category** | Performance & Reviewability |
| **Rule** | Split snapshot files that exceed 500KB into multiple smaller snapshots. Never commit snapshots larger than 1MB. |
| **Reason** | Large snapshots are slow to compare (100-500ms), hard to review in PR diffs (Git struggles with large file diffs), and indicate that the test is capturing too much output. Split by component or logical section for manageable, reviewable snapshots. |
| **Bad Example** | One snapshot containing the full HTML of an entire page — 800KB; PR diff is unreadable; comparison takes 400ms. |
| **Good Example** | Split into component-level snapshots: `header.html`, `content.html`, `footer.html` — each under 200KB. |
| **Exceptions** | Binary snapshots (images) that inherently exceed 500KB despite reasonable compression. |
| **Consequences Of Violation** | Slow snapshot comparison; unreadable PR diffs; decreased likelihood of meaningful review. |
