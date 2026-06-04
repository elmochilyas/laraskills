# Skill: Implement Snapshot Testing

## Purpose
Use snapshot testing to capture and compare serialized output of data structures, JSON responses, or rendered content, detecting unintended changes by comparing against a stored baseline.

## When To Use
- Testing complex data structures where writing explicit assertions is tedious
- Testing JSON API responses with many fields
- Testing serialized output that should not change unintentionally
- Testing configuration output, export files, or generated content
- When you want to detect regressions in output format

## When NOT To Use
- For data that changes frequently (every commit would update snapshots)
- For data with non-deterministic values (timestamps, UUIDs, random IDs)
- When explicit assertions would be clearer and more maintainable
- For testing business logic where individual field assertions matter
- As a replacement for all other assertions (snapshot tests complement, not replace)

## Prerequisites
- Pest or PHPUnit with snapshot testing support
- `spatie/phpunit-snapshot-assertions` or Pest's built-in `->toMatchSnapshot()`
- Understanding of snapshot file management and review process

## Inputs
- Data to snapshot (array, object, string, JSON)
- Snapshot file naming convention
- Snapshot directory configuration
- Exclusion patterns for non-deterministic fields

## Workflow
1. Identify output that should be tested for regression (API response, export file, rendered content)
2. Write a test using snapshot assertion: `$response->assertJsonSnapshot()` or `expect($data)->toMatchSnapshot()`
3. Run the test to generate the initial snapshot file
4. Review the snapshot file and commit it to version control
5. On subsequent runs, the test compares actual output to the snapshot
6. When intentional changes occur, update snapshots: `php artisan test --update-snapshots` or `-d --update-snapshots`
7. For non-deterministic values, use `->assertJsonSnapshot(ignoreKeys: ['id', 'created_at'])` or dynamic snapshot drivers
8. Review snapshot diffs during code review to catch unintended changes

## Validation Checklist
- [ ] Snapshot files are committed to version control
- [ ] Non-deterministic fields are excluded or handled
- [ ] Snapshot update process is documented for the team
- [ ] Snapshot diffs are reviewed during PRs as carefully as code diffs
- [ ] Snapshot files are organized in a predictable directory structure
- [ ] Snapshots are updated only when output intentionally changes
- [ ] CI fails when snapshots don't match (no auto-update in CI)

## Common Failures
- Auto-updating snapshots in CI — meaningless tests that always pass
- Committing snapshots with non-deterministic data — flaky test failures
- Large snapshots that are never reviewed — undetected regressions
- Snapshots for trivial data that explicit assertions would cover better
- Not excluding dynamic fields — snapshot changes every run

## Decision Points
- Snapshot vs explicit assertion — snapshot for complex/wide output, explicit for focused/important fields
- JSON snapshot vs string snapshot — JSON for structured data, string for text output
- `assertJsonSnapshot` with ignoreKeys vs custom driver — ignoreKeys for simple exclusions, custom driver for complex scenarios

## Performance Considerations
- Snapshot comparison is fast (<5ms per assertion)
- Snapshot file I/O is minimal (read once per test file, write on update)
- Large snapshots (>100KB) may slow down the test suite
- Use `--update-snapshots` flag only in development, never in CI

## Security Considerations
- Snapshots may contain sensitive data (PII, API keys, internal structure)
- Review snapshot files before committing — they become part of the codebase
- Avoid snapshotting authentication tokens, user passwords, or secrets
- Use ignoreKeys to exclude security-sensitive fields from snapshots
- Consider encrypting snapshot files that contain security-relevant data

## Related Rules
- [Rule: Never Auto-Update Snapshots in CI](./05-rules.md)
- [Rule: Exclude Non-Deterministic Fields](./05-rules.md)
- [Rule: Review Snapshot Diffs in Code Review](./05-rules.md)

## Related Skills
- Snapshot Testing with Spatie
- Pest Snapshot Assertions
- JSON API Testing

## Success Criteria
- [ ] Snapshot testing is set up and working for complex output
- [ ] Non-deterministic fields are excluded from snapshots
- [ ] Snapshot update process is documented and followed
- [ ] Snapshots are reviewed during PRs alongside code changes
- [ ] CI enforces snapshot matching (no auto-update)
