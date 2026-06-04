# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Snapshot Testing |
| Knowledge Unit | Snapshot Testing with Spatie |
| Difficulty | Intermediate |
| Maturity | Mature |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | PHPUnit/Pest test writing, JSON and serialization concepts |
| Related KUs | JSON API testing, HTTP test assertions, Test data management |
| Source | domain-analysis.md K026 |

# Overview

Snapshot testing with the Spatie PHPUnit Snapshot Assertions package captures the output of a test (JSON, text, HTML, XML, YAML, or binary) and compares it against a stored "snapshot" on subsequent runs. When the output changes unexpectedly, the test fails, alerting the team to unintended changes. Snapshot testing is particularly useful for validating API responses, serialization output, rendered views, and configuration files where writing explicit assertions for every field would be tedious. It serves as a regression detection mechanism for output-oriented code. The package supports parallel test execution, custom snapshot drivers, and CI-specific behavior (preventing new snapshot creation).

# Core Concepts

- **Snapshot**: A stored file representing the expected output of a test. Stored in `tests/.pest/snapshots/` or custom directory. Named based on test name and class.
- **`assertMatchesSnapshot()`**: Asserts the current value matches the stored snapshot. On first run, creates the snapshot. On subsequent runs, compares against stored value.
- **`assertMatchesJsonSnapshot()`**: Parses both sides as JSON before comparison. Handles key ordering differences. Preferred for API response testing.
- **`assertMatchesFileSnapshot()`**: Asserts a file matches the stored snapshot. Used for generated files (PDFs, images, compiled assets).
- **`assertMatchesHtmlSnapshot()`**: Parses both sides as HTML. Handles attribute ordering and whitespace differences.
- **Snapshot driver**: Customizes how snapshots are serialized and compared. Default drivers: JSON, Text, HTML, XML, YAML, Image, File.
- **`CREATE_SNAPSHOTS` env variable**: Controls snapshot creation. When `false` (CI), tests fail if snapshot doesn't exist instead of creating one.

# When To Use

- Validating API response structure and values
- Serialization output verification (model arrays, DTO serialization)
- Rendered Blade view output validation
- Generated file validation (PDFs, images, compiled assets)
- Configuration file regression detection
- Broad output validation where individual field assertions would be tedious

# When NOT To Use

- For critical fields that should never change without explicit review (use explicit assertions)
- For frequently changing outputs (snapshot maintenance overhead becomes too high)
- For outputs where only specific fields matter (use targeted assertions instead)
- As the only assertion mechanism (combine with explicit assertions for key values)
- When output contains timestamps, random values, or dynamic data (normalize in custom driver)

# Best Practices (WHY)

- **Use JSON driver for JSON output, not text driver**: Reason: JSON driver normalizes key ordering and formatting. Text driver is sensitive to whitespace and ordering.
- **Combine snapshots with explicit assertions**: Reason: snapshot for broad structure, explicit assertions for critical fields. `$response->assertMatchesJsonSnapshot(...)` + `$response->assertSee('Welcome')`.
- **Always set `CREATE_SNAPSHOTS=false` in CI**: Reason: prevents accidental snapshot creation in CI. Snapshots must be created locally and committed.
- **Review every snapshot change in PRs**: Reason: a snapshot diff showing unexpected output changes indicates a bug. If intentional, approve. If unexpected, fix.
- **Use custom drivers to normalize dynamic data**: Reason: timestamps, UUIDs, and random values should be normalized (replaced with placeholders) for stable snapshot comparison.
- **Keep snapshots under 500KB per file**: Reason: large snapshots are slow to compare and hard to review. Split into multiple snapshots if needed.

# Architecture Guidelines

- **Snapshot storage**: Default location (`tests/.pest/snapshots/`) is fine for most projects. Custom location for monorepos.
- **Snapshot workflow**: Create locally → review diff → commit snapshot + code → CI verifies. Never create snapshots manually in CI.
- **Driver selection**: JSON for API/serialization. HTML for views. Text for plain strings. File for binaries. Match driver to output type.
- **Snapshot naming**: Based on test file path, class name, and method name. Unique test names prevent collisions in parallel execution.

# Performance Considerations

- **Snapshot comparison**: <5ms for text/JSON, 10-50ms for HTML (DOM parsing), 10-100ms for files (binary comparison).
- **Snapshot creation**: Similar to comparison. <10ms for most types.
- **Large snapshots (>1MB)**: May take 100-500ms. Consider splitting large snapshots into multiple smaller ones.
- **Parallel test compatibility**: Snapshot writes are atomic (write to temp file, rename). No file corruption risk.
- **CI run without snapshot creation**: Faster (no write step). Same comparison speed.

# Security Considerations

- **Snapshot content**: Snapshots may contain sensitive data from test fixtures. Review snapshot content before committing.
- **Snapshot file permissions**: Snapshot files should be readable by the CI process. Default permissions are usually correct.
- **SEI-182 snapshot exposure**: API response snapshots may reveal API contract details. Restrict access to snapshot directories in production.

# Common Mistakes

**Mistake: Using snapshots for everything**
- Description: Replacing all explicit assertions with snapshot tests
- Cause: "Snapshots are quick; write once, verify forever"
- Consequence: Every output change breaks tests; developers learn to blindly update snapshots
- Better: Use snapshots for stable, rarely-changing outputs. Use explicit assertions for critical values.

**Mistake: Not reviewing snapshot diffs in PRs**
- Description: Accepting snapshot changes without reviewing the diff
- Cause: "The snapshot changed because I changed the output"
- Consequence: Unintended output changes slip through
- Better: Review every snapshot change in every PR.

**Mistake: Creating snapshots in CI**
- Description: CI runs create snapshots when they don't exist
- Cause: Not setting `CREATE_SNAPSHOTS=false`
- Consequence: CI creates snapshots that don't represent actual expected output
- Better: Always set `CREATE_SNAPSHOTS=false` in CI.

**Mistake: Using text driver for JSON output**
- Description: JSON is text, so text driver works
- Cause: Lack of understanding of driver differences
- Consequence: Text driver is sensitive to key ordering and whitespace
- Better: Use JSON driver for JSON output.

# Anti-Patterns

- **Blind snapshot updates**: Running tests with `CREATE_SNAPSHOTS=true` after every failure without reviewing the diff.
- **Giant monolithic snapshots**: One snapshot containing an entire page response. Split into component-level snapshots.
- **Unreviewed snapshot accumulation**: Snapshots that change with every commit without review. Snapshot testing becomes noise.
- **Snapshot testing of third-party responses**: Snapshots of external API responses that change without notice.

# Examples

**JSON API snapshot testing**
```php
test('list users returns expected structure', function () {
    User::factory(3)->create();

    $response = $this->getJson('/api/users');

    $response->assertOk();
    $this->assertMatchesJsonSnapshot($response->json());
});
```

**HTML view snapshot**
```php
test('dashboard renders correctly', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertOk();
    $this->assertMatchesHtmlSnapshot($response->getContent());
});
```

**Serialization snapshot**
```php
test('user serialization matches expected output', function () {
    $user = User::factory()->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);

    $this->assertMatchesJsonSnapshot($user->toArray());
});
```

**CI-safe configuration**
```yaml
# In CI environment
CREATE_SNAPSHOTS=false
```

# Related Topics

- JSON API testing
- HTTP test assertions
- Test data management
- Custom snapshot drivers
- Binary snapshot comparison
- Contract testing (OpenAPI diff)

# AI Agent Notes

- When generating snapshot tests, use `assertMatchesJsonSnapshot()` for JSON and `assertMatchesHtmlSnapshot()` for HTML.
- Always include `CREATE_SNAPSHOTS=false` in generated CI configurations.
- Combine snapshot assertions with explicit assertions for critical values in generated test code.
- For snapshots containing dynamic data (timestamps, UUIDs), generate custom drivers that normalize these values.
- Keep generated snapshot tests focused on stable, well-defined output contracts.

# Verification

- [ ] JSON outputs use `assertMatchesJsonSnapshot()` (not text driver)
- [ ] `CREATE_SNAPSHOTS=false` is set in CI environment
- [ ] Snapshots are reviewed in PR diffs
- [ ] Snapshot files are under 500KB each
- [ ] Critical fields have explicit assertions alongside snapshot assertions
- [ ] Dynamic data (timestamps, UUIDs) is normalized via custom drivers
- [ ] Snapshot tests exist for stable, rarely-changing outputs
- [ ] Custom drivers exist for domain-specific comparison logic
