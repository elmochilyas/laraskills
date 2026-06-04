# Rules — Snapshot Testing with Spatie

## Rule 1: Combine Snapshot Assertions with Explicit Critical Value Checks
| Field | Value |
|-------|-------|
| **Name** | Combine Snapshot Assertions with Explicit Critical Value Checks |
| **Category** | Testing Strategy |
| **Rule** | Always pair snapshot assertions with explicit assertions for critical values. Never rely solely on snapshots for correctness verification. |
| **Reason** | Snapshots detect that output changed, not that it's correct. An API returning `500 Internal Server Error` instead of `200 OK` would produce a new snapshot that "passes" but represents a regression. Always assert critical values (status codes, error states, key data fields) explicitly. |
| **Bad Example** | `$this->assertMatchesJsonSnapshot($response->json())` — snapshot passes even if status is `error`. |
| **Good Example** | `$response->assertOk(); $this->assertMatchesJsonSnapshot($response->json())` — status is explicitly verified. |
| **Exceptions** | Outputs so simple that every field is equally critical and any change is a failure. |
| **Consequences Of Violation** | Regression in critical fields is detected as a snapshot change but mistakenly approved as intentional. |

## Rule 2: Always Set `CREATE_SNAPSHOTS=false` in CI
| Field | Value |
|-------|-------|
| **Name** | Always Set `CREATE_SNAPSHOTS=false` in CI |
| **Category** | CI & Environment |
| **Rule** | Always configure CI with `CREATE_SNAPSHOTS=false` environment variable. Never permit snapshot creation in CI. |
| **Reason** | CI-created snapshots capture whatever output the code happens to produce, which may not represent the intended expected output. This causes "snapshot drift" — tests pass in CI but produce different output locally. Snapshots must be created locally and committed with the corresponding code changes. |
| **Bad Example** | CI workflow runs tests without `CREATE_SNAPSHOTS=false` — CI creates snapshots that don't match local output. |
| **Good Example** | `CREATE_SNAPSHOTS=false php artisan test` in CI — tests fail if snapshot doesn't exist, requiring intentional local creation. |
| **Exceptions** | None. CI must never create snapshots automatically. |
| **Consequences Of Violation** | Snapshot drift; tests pass in CI but reveal different output locally; regression detection is lost. |

## Rule 3: Use the Correct Snapshot Driver for Each Output Type
| Field | Value |
|-------|-------|
| **Name** | Use the Correct Snapshot Driver for Each Output Type |
| **Category** | Driver Selection |
| **Rule** | Use `assertMatchesJsonSnapshot()` for JSON, `assertMatchesHtmlSnapshot()` for HTML, `assertMatchesFileSnapshot()` for files, and `assertMatchesSnapshot()` only for plain text. Match the driver to the output type. |
| **Reason** | Each driver applies appropriate normalization for its type. JSON driver normalizes key ordering. HTML driver handles attribute ordering and whitespace. File driver handles binary comparison. Using the wrong driver (e.g., text driver for JSON) causes false failures on ordering or formatting differences. |
| **Bad Example** | `$this->assertMatchesSnapshot($response->getContent())` for HTML — fails on attribute ordering differences. |
| **Good Example** | `$this->assertMatchesHtmlSnapshot($response->getContent())` — HTML-aware comparison. |
| **Exceptions** | Custom drivers for specific output formats (YAML, XML) that have dedicated snapshot drivers. |
| **Consequences Of Violation** | False-positive failures on formatting differences that have no semantic meaning. |

## Rule 4: Review Every Snapshot Change in Every PR
| Field | Value |
|-------|-------|
| **Name** | Review Every Snapshot Change in Every PR |
| **Category** | Process & Review |
| **Rule** | Require explicit review of all snapshot file changes in every pull request. Never approve snapshot changes without examining the diff. |
| **Reason** | A snapshot diff shows exactly how the output changed. If the change is intentional (e.g., adding a new field), the diff confirms correctness. If the change is unintended (e.g., regression in a computation), the diff catches it. Skipping this review defeats the entire purpose of snapshot testing. |
| **Bad Example** | PR description: "Updated snapshots for new feature" — reviewer approves without checking the snapshot diff, missing an unintended output change. |
| **Good Example** | Reviewer examines snapshot diff: "I can see the new `email` field was added. The existing fields are unchanged. Approved." |
| **Exceptions** | Automated bulk snapshot updates from dependency upgrades where individual review is impractical (review a sample instead). |
| **Consequences Of Violation** | Unintended output changes reach production undetected; snapshot testing becomes noise. |

## Rule 5: Normalize Dynamic Data in Custom Drivers
| Field | Value |
|-------|-------|
| **Name** | Normalize Dynamic Data in Custom Drivers |
| **Category** | Test Design |
| **Rule** | Create custom snapshot drivers that normalize dynamic data (timestamps, UUIDs, random values) to placeholders before comparison. Never snapshot output containing raw dynamic values. |
| **Reason** | Dynamic data changes every test run, making snapshots useless. By replacing timestamps with `{TIMESTAMP}` and UUIDs with `{UUID}`, the snapshot compares only the stable structure, catching meaningful changes while ignoring irrelevant variations. |
| **Bad Example** | Snapshotting an API response with `"created_at": "2026-06-02T12:00:00Z"` — fails on every test run. |
| **Good Example** | Custom driver normalizes `created_at` to `"created_at": "{TIMESTAMP}"` — stable snapshot across runs. |
| **Exceptions** | Tests that explicitly verify dynamic values (e.g., "timestamps are in ISO 8601 format"). |
| **Consequences Of Violation** | Snapshot tests fail on every run; developers learn to blindly update snapshots. |

## Rule 6: Keep Snapshot Files Under 500KB
| Field | Value |
|-------|-------|
| **Name** | Keep Snapshot Files Under 500KB |
| **Category** | Performance & Reviewability |
| **Rule** | Keep individual snapshot files under 500KB. Split larger snapshots into component-level files. Never commit snapshots over 1MB. |
| **Reason** | Large snapshots are slow to compare (100-500ms), hard to review in PR diffs, and indicate the test is capturing too much output. Component-level snapshots (header, content, footer) are more reviewable and provide better regression localization. |
| **Bad Example** | One snapshot containing the entire `views/admin/dashboard.blade.php` rendered output — 900KB, unreadable diff. |
| **Good Example** | `dashboard-header.json`, `dashboard-stats-panel.json`, `dashboard-recent-activity.json` — each under 200KB. |
| **Exceptions** | Binary snapshots (images) that are inherently larger despite reasonable compression. |
| **Consequences Of Violation** | Slow tests; unreadable PR diffs; decreased engagement with snapshot review. |
