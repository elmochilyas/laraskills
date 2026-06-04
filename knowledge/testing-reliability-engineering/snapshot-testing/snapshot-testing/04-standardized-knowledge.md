# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Snapshot Testing
Knowledge Unit: Snapshot Testing with Spatie
 KU Code: ku-01-snapshot-testing
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Snapshot testing with the Spatie PHPUnit Snapshot Assertions package captures test output (JSON, text, HTML, XML, YAML, or binary) and compares it against a stored "snapshot" on subsequent runs. When output changes unexpectedly, the test fails. Snapshot testing is useful for validating API responses, serialization output, rendered views, and configuration files where writing explicit assertions for every field would be tedious. It serves as a regression detection mechanism for output-oriented code.

# Core Concepts
- **Snapshot**: A stored file representing expected output. Stored in `tests/.pest/snapshots/` or custom directory. Named based on test name and class.
- **`assertMatchesSnapshot()`**: Asserts current value matches stored snapshot. First run creates snapshot; subsequent runs compare.
- **`assertMatchesJsonSnapshot()`**: Parses both sides as JSON before comparison. Handles key ordering. Preferred for API responses.
- **`assertMatchesFileSnapshot()`**: Asserts a file matches stored snapshot. Used for generated files (PDFs, images).
- **`assertMatchesHtmlSnapshot()`**: Parses both sides as HTML. Handles attribute ordering and whitespace differences.
- **Snapshot driver**: Customizes serialization and comparison. Default drivers: JSON, Text, HTML, XML, YAML, Image, File.
- **`CREATE_SNAPSHOTS` env variable**: Controls snapshot creation. When `false` (CI), tests fail if snapshot doesn't exist.

# When To Use
- API response validation where structure is stable and important
- Serialization output (model `toArray()`, `toJson()`, resource responses)
- Rendered Blade views (catch unintended HTML changes)
- Generated files (PDFs, images, compiled assets)
- Configuration output (YAML/XML export)
- Contract validation for third-party API responses

# When NOT To Use
- Frequently changing output (version strings, timestamps, random data)
- Critical individual values that must never change unexpectedly (use explicit assertions)
- Large binary files (>1MB per snapshot)
- Output that varies by environment (line endings, locale-dependent formatting)
- As a replacement for thoughtful assertions (snapshots detect change, not correctness)

# Best Practices (WHY)
- **Use JSON driver for JSON output, not text driver**: Reason: JSON driver normalizes key ordering and formatting. Text driver is sensitive to whitespace and key order, causing false failures.
- **Combine snapshots with explicit assertions**: Reason: snapshots catch unexpected changes broadly. Explicit assertions pin critical values. `$response->assertMatchesJsonSnapshot($json)->assertSee('Payment received')`.
- **Set `CREATE_SNAPSHOTS=false` in CI**: Reason: prevents CI from creating snapshots that don't represent actual expected output. Snapshots must be created locally and committed with code changes.
- **Review snapshot diffs in every PR**: Reason: a snapshot diff that shows unexpected changes indicates a regression. Require explicit approval of snapshot changes in code review.
- **Keep snapshots under 500KB per file**: Reason: large snapshots are hard to review and slow to compare. Split into multiple smaller snapshots if needed.
- **Use snapshot testing for stable, rarely-changing outputs**: Reason: frequently changing snapshots train developers to blindly update them, defeating regression detection.
- **Document the snapshot workflow**: Reason: new team members need to know: (1) run tests locally to create snapshots, (2) review snapshot changes, (3) commit snapshots with code.

# Architecture Guidelines
- **Snapshot location**: Default `tests/.pest/snapshots/` is fine for most projects. Custom location for monorepos.
- **Snapshot naming convention**: Snapshot files are named by test file path, class, and method. Don't rename them manually.
- **Driver selection**: JSON for API/serialization, HTML for views, Text for plain strings, File for binaries. Match driver to output type.
- **Parallel test compatibility**: Snapshot writes are atomic (write to temp file, rename). No corruption risk with parallel execution.
- **Version control**: Commit snapshot files to VCS. They are the expected output baseline. `.gitignore` should NOT exclude snapshot directories.
- **Continuous integration**: Always test with `CREATE_SNAPSHOTS=false` to verify snapshots exist and match.

# Performance
- **Text/JSON comparison**: <5ms per assertion. Negligible.
- **HTML comparison (DOM parsing)**: 10-50ms. Acceptable for moderate use.
- **File comparison (binary)**: 10-100ms depending on file size.
- **Large snapshots (>1MB)**: 100-500ms. Split into multiple smaller snapshots.
- **Parallel execution**: Atomic writes prevent contention. No performance degradation in parallel mode.

# Security
- **Snapshot content review**: Snapshots may contain sensitive data (API keys, PII, internal URLs). Review snapshot content before committing.
- **Snapshot directory access**: Snapshot files are in the project directory. Ensure they're not served by the web server.
- **Binary snapshots**: Image/file snapshots may contain embedded metadata. Strip EXIF data before creating image snapshots.
- **CI environment**: `CREATE_SNAPSHOTS=false` prevents CI from writing files. Read-only in CI.

# Common Mistakes

**Mistake: Using snapshots for everything**
- Description: Replacing all assertions with snapshot matches
- Cause: "Snapshots are quick; write once, verify forever"
- Consequence: Every output change breaks tests; developers learn to blindly update snapshots
- Better: Use snapshots for stable output contracts. Use explicit assertions for critical values.

**Mistake: Not reviewing snapshot diffs in PRs**
- Description: Approving snapshot changes without examining the diff
- Cause: "The snapshot changed because I changed the output; it's fine"
- Consequence: Unintended output changes slip through; regression detection is lost
- Better: Review every snapshot change in every PR. Require explicit approval.

**Mistake: Creating snapshots in CI**
- Description: Running with `CREATE_SNAPSHOTS=true` (default) in CI
- Cause: Not configuring CI environment variables
- Consequence: CI creates snapshots that don't represent actual expected output; snapshot drift
- Better: Always set `CREATE_SNAPSHOTS=false` in CI. Create snapshots locally.

**Mistake: Text driver for JSON output**
- Description: Using `assertMatchesSnapshot()` (text driver) for JSON content
- Cause: JSON is text; text driver works
- Consequence: Text driver is sensitive to key ordering and whitespace; trivial changes break tests
- Better: Use `assertMatchesJsonSnapshot()` for JSON output.

# Anti-Patterns
- **Snapshot-first testing**: Writing snapshot assertions before writing the code. Leads to snapshots that validate garbage output.
- **No snapshot maintenance**: Accumulating snapshots without review. Snapshots drift from intended output over months.
- **Overwriting snapshots without review**: Running `--update-snapshots` as a reflex instead of investigating failures.
- **Platform-dependent snapshots**: Creating snapshots on Windows (CRLF) and verifying on Linux (LF). Use consistent platform or normalize line endings.
- **Gi normalling snapshots**: Adding snapshot directories to `.gitignore`. Snapshots must be in VCS to be useful.

# Examples

**JSON API snapshot test**
```php
test('api returns user list structure', function () {
    User::factory(3)->create();

    $response = $this->getJson('/api/users');

    $response->assertOk();
    $this->assertMatchesJsonSnapshot($response->json());
});
```

**HTML view snapshot test**
```php
test('profile page renders correctly', function () {
    $user = User::factory()->create(['name' => 'Test User']);

    $response = $this->actingAs($user)->get('/profile');

    $this->assertMatchesHtmlSnapshot($response->getContent());
});
```

**CI configuration for snapshot safety**
```yaml
# .github/workflows/tests.yml
- name: Run tests (no snapshot creation)
  run: CREATE_SNAPSHOTS=false php artisan test
  env:
    CREATE_SNAPSHOTS: false
```

**Updating snapshots intentionally**
```bash
# Create/update snapshots locally
CREATE_SNAPSHOTS=true php artisan test --filter=UserApiTest

# Review changes
git diff tests/.pest/snapshots/
```

# Related Topics
- JSON API testing
- HTTP test assertions
- Test data management
- Contract testing (OpenAPI diff)
- Custom snapshot drivers
- Binary snapshot comparison

# AI Agent Notes
- When generating snapshot tests, prefer `assertMatchesJsonSnapshot()` over `assertMatchesSnapshot()` for API response testing.
- Always include a comment explaining why snapshot testing is appropriate for the specific output.
- Never generate snapshot tests for output that contains timestamps, random values, or version strings without normalizing them first.
- Recommend combining snapshot assertions with explicit critical value assertions in the same test.
- For CI workflows, always set `CREATE_SNAPSHOTS: false` and document the local snapshot creation workflow.
- The JSON driver handles key ordering differences; the text driver does not. Choose the driver that matches the output characteristics.

# Verification
- [ ] Can create a JSON snapshot assertion and verify first-run creates the snapshot file
- [ ] Can run with `CREATE_SNAPSHOTS=false` and confirm failure when snapshot doesn't exist
- [ ] Can review snapshot diff and identify intentional vs unintentional output changes
- [ ] Snapshot files are committed to VCS and included in code review
- [ ] HTML snapshots handle attribute ordering and whitespace differences correctly
- [ ] Parallel test execution does not corrupt snapshot files
- [ ] Snapshot files are under 500KB each
- [ ] CI pipeline sets `CREATE_SNAPSHOTS=false` and never creates snapshots
