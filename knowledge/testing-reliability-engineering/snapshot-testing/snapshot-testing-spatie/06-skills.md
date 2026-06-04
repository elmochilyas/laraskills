# Skill: Use Spatie Snapshot Assertions for Regression Testing

## Purpose
Use `spatie/phpunit-snapshot-assertions` to capture and compare complex output (JSON, arrays, objects, strings) against stored baselines, enabling regression detection for API responses, serialized data, and generated content.

## When To Use
- Testing JSON API responses with many fields
- Testing complex array/object serialization
- Testing generated files (reports, exports, configuration)
- Testing string output where manual assertion would be excessive
- When combined with `ignoreKeys` for dynamic fields

## When NOT To Use
- For testing simple, focused assertions (use explicit assertions)
- When snapshot updates would happen on every code change
- For data with many dynamic fields — exclusions would be too complex
- When the team doesn't review snapshot diffs during code review
- For binary output (images, PDFs) — use dedicated comparison tools

## Prerequisites
- `spatie/phpunit-snapshot-assertions` installed (`composer require --dev spatie/phpunit-snapshot-assertions`)
- PHPUnit or Pest configured for snapshot testing
- Understanding of snapshot drivers: `JsonDriver`, `VarDriver`, `TextDriver`, `XmlDriver`

## Inputs
- Output data to snapshot (array, object, JSON string, XML)
- Snapshot ID for file naming
- Driver selection for serialization format
- Ignore keys for non-deterministic values

## Workflow
1. Install Spatie snapshot assertions: `composer require --dev spatie/phpunit-snapshot-assertions`
2. In a test, assert with snapshot: `$this->assertMatchesSnapshot($data)` or `$this->assertMatchesJsonSnapshot($data)`
3. For Pest: use `expect($data)->toMatchSnapshot()` or `->assertSnapshot()`
4. Run the test to generate the initial snapshot file in `tests/_snapshots/`
5. Review the snapshot file for correctness before committing
6. For dynamic values, use `$this->assertMatchesJsonSnapshot($data, ignoreKeys: ['id', 'updated_at'])`
7. Use custom drivers for non-JSON serialization: `$this->assertMatchesSnapshot($xml, new XmlDriver())`
8. Update snapshots with `--update-snapshots` flag when output intentionally changes

## Validation Checklist
- [ ] Snapshot files are committed to version control
- [ ] Dynamic fields are excluded with `ignoreKeys` or custom drivers
- [ ] Snapshot driver matches the data type (JSON, Var, Text, XML)
- [ ] `--update-snapshots` is never used in CI
- [ ] Snapshot diffs are reviewed during code review
- [ ] Snapshot directory is in `.gitignore`? (No — snapshots must be tracked)
- [ ] Team has agreed on snapshot testing conventions

## Common Failures
- Using the wrong driver — `assertMatchesSnapshot` uses VarDriver by default, not JSON
- Not excluding timestamps and IDs — snapshot changes every test run
- Auto-updating snapshots in CI — tests always pass, never catch regressions
- Large snapshots that no one reviews — undetected unintended changes
- Committing generated snapshots without reviewing them first

## Decision Points
- `assertMatchesSnapshot` vs `assertMatchesJsonSnapshot` — JSON for structured data, Variant for PHP arrays
- `ignoreKeys` vs custom driver — ignoreKeys for simple field exclusions, custom driver for complex transforms
- Snapshot ID: auto vs manual — auto for simple tests, manual `->id('name')` for organized naming

## Performance Considerations
- Snapshot I/O: reads file once per test class, caches in memory
- JSON driver comparison: O(n) over keys — fast for typical responses (<0.5ms)
- Large snapshots (>1MB) may slow down test suite
- Use dedicated snapshot directory per test file for organization

## Security Considerations
- Snapshot files are committed to the codebase — no secrets, tokens, or PII
- Review snapshot files for sensitive data before committing
- Use `ignoreKeys` to exclude auth tokens, session IDs, and user PII
- Consider snapshot file permissions — should be readable only by the team

## Related Rules
- [Rule: Use the Correct Snapshot Driver](./05-rules.md)
- [Rule: Exclude Non-Deterministic Keys](./05-rules.md)
- [Rule: Never Auto-Update in CI](./05-rules.md)

## Related Skills
- Snapshot Testing Concepts
- JSON API Testing
- Pest Snapshot Assertions

## Success Criteria
- [ ] Spatie snapshot assertions are installed and configured
- [ ] Complex responses use snapshot assertions instead of 20-line explicit assertions
- [ ] Dynamic fields are excluded and snapshots are stable across runs
- [ ] Team reviews snapshot diffs as part of the PR process
- [ ] Snapshots are updated intentionally, never auto-updated in CI
