# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Snapshot Testing
Knowledge Unit: Snapshot Testing with Spatie
KU Code: ku-01-snapshot-testing
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
Snapshot testing with the Spatie PHPUnit Snapshot Assertions package captures test output and compares it against a stored snapshot on subsequent runs. When output changes unexpectedly, the test fails. Snapshot testing is useful for validating API responses, serialization output, rendered views, and configuration files where writing explicit assertions for every field would be tedious.

# Core Concepts
- **Snapshot**: A stored file representing expected output. Stored in `tests/.pest/snapshots/` or custom directory.
- **`assertMatchesSnapshot()`**: Asserts current value matches stored snapshot. First run creates snapshot; subsequent runs compare.
- **`assertMatchesJsonSnapshot()`**: Parses both sides as JSON before comparison. Handles key ordering. Preferred for API responses.
- **`assertMatchesFileSnapshot()`**: Asserts a file matches stored snapshot. Used for generated files.
- **`assertMatchesHtmlSnapshot()`**: Parses both sides as HTML. Handles attribute ordering and whitespace differences.
- **Snapshot driver**: Customizes serialization and comparison. Default drivers: JSON, Text, HTML, XML, YAML, Image, File.
- **`CREATE_SNAPSHOTS` env variable**: Controls snapshot creation. When `false` (CI), tests fail if snapshot doesn't exist.

# Mental Models
- **Snapshot as regression detector**: Snapshots don't verify correctness — they detect change. A passing snapshot test means output hasn't changed, not that it's correct.
- **Snapshot as documentation**: Snapshot files serve as living documentation of expected output. Reviewing snapshot diffs in PRs is essential.
- **First run creates baseline**: The first run creates the snapshot. Subsequent runs compare against this baseline. Never create snapshots in CI.

# Internal Mechanics
- Snapshot files are stored as plain text in the snapshot directory. The file name is derived from the test class and method name.
- The JSON driver deserializes both sides using `json_decode()` and compares the resulting arrays, ignoring key order.
- The HTML driver parses both sides using DOMDocument, normalizes attribute order and whitespace.
- `CREATE_SNAPSHOTS=true` (default) writes new snapshots when they don't exist. `false` throws an assertion failure.
- Snapshot writes are atomic: write to temp file, then rename. Safe for parallel execution.

# Patterns
- **JSON driver for API output pattern**: Use `assertMatchesJsonSnapshot()` for JSON responses. Handles key ordering differences.
- **Snapshot + explicit assertion pattern**: Combine snapshots with explicit assertions for critical values.
- **CI safety pattern**: Always set `CREATE_SNAPSHOTS=false` in CI to prevent unintended snapshot creation.
- **Driver selection pattern**: Match driver to output type: JSON for API, HTML for views, Text for strings, File for binaries.

# Architectural Decisions
- **Decision: File-based snapshot storage**: Simple, version-control-friendly, reviewable in PR diffs. No database or external service needed.
- **Decision: Atomic snapshot writes**: Prevents corruption during parallel execution. Write to temp file, then atomic rename.
- **Decision: `CREATE_SNAPSHOTS` environment variable**: Allows straightforward CI disabling of snapshot creation without code changes.

# Tradeoffs
- **Snapshot breadth vs assertion precision**: Snapshots catch broad unexpected changes but can't verify individual values. Combine with explicit assertions for critical values.
- **Snapshot maintenance cost**: Frequently changing output creates high maintenance burden. Snapshots are best for stable, rarely-changing output.
- **File size vs reviewability**: Large snapshots (over 500KB) are hard to review in PR diffs. Split into smaller snapshots.

# Performance Considerations
- Text/JSON comparison: <5ms per assertion. Negligible.
- HTML comparison (DOM parsing): 10-50ms. Acceptable for moderate use.
- File comparison (binary): 10-100ms depending on file size.
- Large snapshots (>1MB): 100-500ms. Split into multiple smaller snapshots.
- Parallel execution: Atomic writes prevent contention. No performance degradation in parallel mode.

# Production Considerations
- Snapshot content review: Snapshots may contain sensitive data (API keys, PII, internal URLs). Review before committing.
- Snapshot directory access: Snapshot files are in the project directory. Ensure they're not served by the web server.
- Binary snapshots: Image/file snapshots may contain embedded metadata. Strip EXIF data before creating image snapshots.
- CI environment: `CREATE_SNAPSHOTS=false` prevents CI from writing files. Read-only in CI.

# Common Mistakes
- **Using snapshots for everything**: Every output change breaks tests; developers learn to blindly update snapshots.
- **Not reviewing snapshot diffs in PRs**: Unintended output changes slip through; regression detection is lost.
- **Creating snapshots in CI**: CI creates snapshots that don't represent actual expected output; snapshot drift.
- **Text driver for JSON output**: Text driver is sensitive to key ordering and whitespace; trivial changes break tests.

# Failure Modes
- Platform-dependent snapshots: CRLF vs LF line endings cause false failures on different platforms.
- Timestamp/random data in output: Snapshots with variable content change every run. Normalize before snapshot assertion.
- Snapshot file loss: Accidentally adding snapshot directory to `.gitignore`. Snapshots must be in VCS.
- Snapshot drift: Snapshots that haven't been reviewed in months may not represent intended expected output.

# Ecosystem Usage
- Spatie's PHPUnit Snapshot Assertions is the most popular snapshot testing package for Laravel/PHP (approximately 2,000+ GitHub stars).
- Pest has built-in support via `pest-plugin-snapshot` which wraps the Spatie package.
- Community convention places snapshots in `tests/.pest/snapshots/` by default.
- The package supports custom drivers for different comparison strategies.

# Related Knowledge Units
- JSON API testing
- HTTP test assertions
- Test data management
- Contract testing (OpenAPI diff)
- Custom snapshot drivers
- Binary snapshot comparison

# Research Notes
- Snapshot testing originated in the JavaScript ecosystem (Jest snapshots, 2016) and was adopted by PHP via the Spatie package.
- The approach trades assertion precision for ease of writing. Best used sparingly alongside explicit assertions.
- PHP's lack of a built-in snapshot testing facility means the Spatie package implements its own file management and comparison logic.
- The `CREATE_SNAPSHOTS` pattern is borrowed from Jest's `--updateSnapshot` flag.
