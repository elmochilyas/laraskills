# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Snapshot Testing
Knowledge Unit: Snapshot Testing with Spatie
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Snapshot testing with the Spatie PHPUnit Snapshot Assertions package captures the output of a test (JSON, text, HTML, XML, YAML, or binary) and compares it against a stored "snapshot" on subsequent runs. When the output changes unexpectedly, the test fails, alerting the team to unintended changes. Snapshot testing is particularly useful for validating API responses, serialization output, rendered views, and configuration files where writing explicit assertions for every field would be tedious. It serves as a regression detection mechanism for output-oriented code. The package supports parallel test execution, custom snapshot drivers, and CI-specific behavior (preventing new snapshot creation).

# Core Concepts
- **Snapshot**: A stored file representing the expected output of a test. Stored in `tests/.pest/snapshots/` or custom directory. Named based on test name and class.
- **`assertMatchesSnapshot()`**: Asserts the current value matches the stored snapshot. On first run, creates the snapshot. On subsequent runs, compares against stored value.
- **`assertMatchesJsonSnapshot()`**: Parses both sides as JSON before comparison. Handles key ordering differences. Preferred for API response testing.
- **`assertMatchesFileSnapshot()`**: Asserts a file matches the stored snapshot. Used for generated files (PDFs, images, compiled assets).
- **`assertMatchesHtmlSnapshot()`**: Parses both sides as HTML. Handles attribute ordering and whitespace differences.
- **Snapshot driver**: Customizes how snapshots are serialized and compared. Default drivers: JSON, Text, HTML, XML, YAML, Image, File.
- **`CREATE_SNAPSHOTS` env variable**: Controls snapshot creation. When `false` (CI), tests fail if snapshot doesn't exist instead of creating one.

# Mental Models
- **Snapshot as frozen output**: A snapshot is like a photograph of the expected output at a point in time. If the output changes, the test fails. You "develop a new photograph" when the change is intentional.
- **Snapshot testing vs assertions**: Explicit assertions say "this field must equal X." Snapshot testing says "the entire output must match what we last agreed upon." Both have their place.
- **First run creates, subsequent runs verify**: The first test run establishes the baseline. Every subsequent run is a regression check. This makes snapshot tests quick to write but requires care when reviewing failures.
- **CI as enforcement**: In CI, snapshots cannot be created — they can only be verified. This prevents accidental snapshot creation from CI runs. Snapshots must be created locally and committed.

# Internal Mechanics
- **Snapshot storage**: Snapshots stored as files in `tests/.pest/snapshots/` organized by test class. File format matches snapshot type: `.json`, `.txt`, `.html`, `.xml`, `.yaml`.
- **Snapshot naming**: Based on test file path, test class name, and test method name. Example: `tests__Feature__Api__UserTest__test_it_lists_users.json`.
- **Comparison algorithm**: For JSON: `json_decode()` both sides, compare as arrays (ignores key order, whitespace). For text: exact string comparison. For HTML: DOM parsing, compares structure and content ignoring attribute order.
- **First-run behavior**: If no snapshot exists for the test, the current value is saved as the snapshot and the test passes. This is how baselines are established.
- **CI behavior**: With `CREATE_SNAPSHOTS=false`, if a snapshot doesn't exist, the test fails with "Snapshot does not exist" instead of creating one. Prevents false passes in CI.
- **Parallel test compatibility**: Snapshots use atomic file writes (write to temp file, rename). Multiple processes can write snapshots without corruption.

# Patterns
- **Pattern: JSON API snapshot testing**
  - Purpose: Validate API response structure and values
  - Benefits: Catches unintentional API contract changes
  - Tradeoffs: Large snapshots may hide subtle changes in code review
  - Implementation: `$response->assertMatchesJsonSnapshot($response->json())`

- **Pattern: Serialization snapshot testing**
  - Purpose: Validate model/object serialization output
  - Benefits: Catches serialization changes that affect API responses
  - Tradeoffs: Snapshot changes on any model change (including irrelevant fields)
  - Implementation: `$this->assertMatchesJsonSnapshot($user->toArray())`

- **Pattern: HTML view snapshot testing**
  - Purpose: Validate rendered Blade view output
  - Benefits: Catches view changes that affect user-visible output
  - Tradeoffs: Fragile — CSS class changes, whitespace changes, and version strings trigger failures
  - Implementation: `$response->assertMatchesHtmlSnapshot($response->getContent())`

- **Pattern: Generated file snapshot testing**
  - Purpose: Validate generated PDFs, images, or compiled files
  - Benefits: Detects unintended changes in generated output
  - Tradeoffs: Binary snapshots are large; comparison is byte-exact
  - Implementation: `$this->assertMatchesFileSnapshot($generatedPdfPath)`

- **Pattern: CI-safe snapshot testing**
  - Purpose: Prevent accidental snapshot creation in CI
  - Benefits: Ensures snapshots are intentionally created and reviewed
  - Tradeoffs: CI fails if snapshot doesn't exist (expected)
  - Implementation: Set `CREATE_SNAPSHOTS=false` in CI environment; developers create snapshots locally

# Architectural Decisions
- **Snapshot vs explicit assertions**: Use snapshots for broad output validation where individual field assertions would be tedious. Use explicit assertions for critical fields that should never change without review. Combine both: snapshot for structure, explicit assertions for key values.
- **JSON vs text vs HTML drivers**: JSON for API responses and serialization (handles key ordering). HTML for view output (handles attribute ordering). Text for plain string output (exact match).
- **Snapshot location**: Default location (`tests/.pest/snapshots/`) is fine for most projects. Custom location for monorepos or when snapshots should be organized differently.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Quick to write; comprehensive output validation | Fragile — any output change breaks the test | Review snapshot diffs carefully in PRs |
| Catches unintended output changes | May hide subtle changes in large snapshots | Combine with explicit assertions for critical fields |
| JSON driver handles key ordering | Large JSON snapshots are hard to review | Use pretty-print for readable snapshots |
| CI-safe with CREATE_SNAPSHOTS=false | First CI run fails if snapshot doesn't exist | Document workflow: create snapshots locally, commit with code |

# Performance Considerations
- Snapshot comparison: <5ms for text/JSON, 10-50ms for HTML (DOM parsing), 10-100ms for files (binary comparison).
- Snapshot creation: Similar to comparison (write to file). <10ms for most types.
- Large snapshots (>1MB): May take 100-500ms. Consider splitting large snapshots into multiple smaller ones.
- Parallel test compatibility: Snapshot writes are atomic. No file corruption risk.
- CI run without snapshot creation: Faster (no write step). Same comparison speed.

# Production Considerations
- **Snapshot workflow**: Developer runs tests locally → snapshots created → developer reviews snapshot diff → commits snapshot + code change → CI verifies snapshots match. Never create snapshots manually.
- **Snapshot code review**: Snapshot changes must be reviewed in PRs. A snapshot diff that shows unexpected output changes indicates a bug. Use GitHub's diff view for snapshot files.
- **Snapshot maintenance**: When refactoring code that changes output, snapshots must be updated. Delete old snapshots and re-create: `CREATE_SNAPSHOTS=true php artisan test --filter=testName`.
- **Snapshot file size**: Keep snapshots under 500KB per file. Large snapshots are hard to review and slow to compare. Split into multiple snapshots if needed.

# Common Mistakes
- **Mistake: Using snapshots for everything**
  - Why: "Snapshots are quick; write once, verify forever"
  - Why harmful: Every output change breaks tests; developers learn to blindly update snapshots
  - Better: Use snapshots for stable, rarely-changing outputs. Use explicit assertions for critical values.

- **Mistake: Not reviewing snapshot diffs in PRs**
  - Why: "The snapshot changed because I changed the output; it's fine"
  - Why harmful: Unintended output changes slip through; regression detection lost
  - Better: Review every snapshot change in every PR. If the change is intentional, approve. If unexpected, fix the bug.

- **Mistake: Creating snapshots in CI**
  - Why: CI runs create snapshots when they don't exist
  - Why harmful: CI creates snapshots that don't represent the actual expected output; snapshot drift
  - Better: Always set `CREATE_SNAPSHOTS=false` in CI. Snapshots must be created locally and committed.

- **Mistake: Using text driver for JSON output**
  - Why: JSON is text, so text driver works
  - Why harmful: Text driver is sensitive to key ordering and whitespace; trivial changes break tests
  - Better: Use JSON driver for JSON output; it normalizes key ordering and formatting

# Failure Modes
- **Snapshot drift over time**: Snapshots accumulate changes without review. After months, the snapshot may not represent the intended output at all. Review snapshot relevance quarterly.
- **Platform-dependent snapshots**: Line endings (CRLF vs LF), decimal formatting, and date formatting may differ across platforms. Use consistent environment for snapshot creation and verification.
- **Large snapshot changes**: A single code change may alter many snapshots. This is expected during refactoring but should be reviewed carefully. Consider creating new snapshots for major refactors.
- **Parallel test snapshot collision**: Rare. If two tests with the same name (same class + method) run in parallel, they may write to the same snapshot file. Use unique test names.

# Ecosystem Usage
- **Spatie PHPUnit Snapshot Assertions**: The standard snapshot testing package for PHP (2000+ stars). Maintained by Spatie, a well-known PHP open-source organization.
- **Laravel core**: Laravel's own tests do not heavily use snapshot testing; the framework team prefers explicit assertions for framework behavior.
- **Pest**: Pest integrates with Spatie Snapshot Assertions seamlessly. `assertMatchesSnapshot()` is available as a Pest expectation.
- **Spatie packages**: Many Spatie packages (media-library, permissions, backup) use snapshot testing for output validation in their own test suites.

# Related Knowledge Units
- **Prerequisites**: PHPUnit/Pest test writing, JSON and serialization concepts
- **Related Topics**: JSON API testing, HTTP test assertions, Test data management
- **Advanced Follow-up**: Custom snapshot drivers, Binary snapshot comparison, Snapshot management strategy

# Research Notes
- Spatie's Snapshot Assertions package is the most widely adopted snapshot testing tool for PHP; it is maintained by Spatie and receives regular updates for PHP version compatibility
- The package supports custom snapshot drivers via the `Driver` interface, enabling teams to implement domain-specific comparison logic (e.g., normalize dates, ignore timestamps)
- Snapshot testing is complementary to contract testing (OpenAPI diff) for API validation; snapshots catch field-level changes while contract testing catches structural schema violations
- The parallel test compatibility (atomic file writes) was a significant improvement in v2.0; earlier versions had race conditions with parallel test execution
- Community best practice recommends using snapshot testing for "stable output contracts" where the output shape is agreed upon and rarely changes; frequently changing outputs should use explicit assertions
