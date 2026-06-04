# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Snapshot Testing
**Knowledge Unit:** Snapshot Testing with Spatie
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Combine Snapshot Assertions with Explicit Critical Value Checks
- [ ] Apply rule: Always Set `CREATE_SNAPSHOTS=false` in CI
- [ ] Apply rule: Use the Correct Snapshot Driver for Each Output Type
- [ ] Apply rule: Review Every Snapshot Change in Every PR
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Snapshot files are committed to version control
- [ ] Dynamic fields are excluded with `ignoreKeys` or custom drivers
- [ ] Snapshot driver matches the data type (JSON, Var, Text, XML)
- [ ] `--update-snapshots` is never used in CI
- [ ] Snapshot diffs are reviewed during code review
- [ ] Avoid: Using snapshots for everything
- [ ] Avoid: Not reviewing snapshot diffs in PRs
- [ ] Avoid: Creating snapshots in CI

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Snapshot storage**: Default location (`tests/.pest/snapshots/`) is fine for most projects. Custom location for monorepos.
- **Snapshot workflow**: Create locally â†’ review diff â†’ commit snapshot + code â†’ CI verifies. Never create snapshots manually in CI.
- **Driver selection**: JSON for API/serialization. HTML for views. Text for plain strings. File for binaries. Match driver to output type.
- **Snapshot naming**: Based on test file path, class name, and method name. Unique test names prevent collisions in parallel execution.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Combine Snapshot Assertions with Explicit Critical Value Checks
- [ ] Follow rule: Always Set `CREATE_SNAPSHOTS=false` in CI
- [ ] Follow rule: Use the Correct Snapshot Driver for Each Output Type
- [ ] Follow rule: Review Every Snapshot Change in Every PR
- [ ] Follow rule: Normalize Dynamic Data in Custom Drivers
- [ ] Follow rule: Keep Snapshot Files Under 500KB
- [ ] - [ ] Snapshot files are committed to version control
- [ ] - [ ] Dynamic fields are excluded with `ignoreKeys` or custom drivers
- [ ] - [ ] Snapshot driver matches the data type (JSON, Var, Text, XML)
- [ ] - [ ] `--update-snapshots` is never used in CI

# Performance Checklist
- **Snapshot comparison**: <5ms for text/JSON, 10-50ms for HTML (DOM parsing), 10-100ms for files (binary comparison).
- **Snapshot creation**: Similar to comparison. <10ms for most types.
- **Large snapshots (>1MB)**: May take 100-500ms. Consider splitting large snapshots into multiple smaller ones.
- **Parallel test compatibility**: Snapshot writes are atomic (write to temp file, rename). No file corruption risk.
- **CI run without snapshot creation**: Faster (no write step). Same comparison speed.

# Security Checklist
- **Snapshot content**: Snapshots may contain sensitive data from test fixtures. Review snapshot content before committing.
- **Snapshot file permissions**: Snapshot files should be readable by the CI process. Default permissions are usually correct.
- **SEI-182 snapshot exposure**: API response snapshots may reveal API contract details. Restrict access to snapshot directories in production.

# Reliability Checklist
- [ ] Ensure: Snapshot testing with the Spatie PHPUnit Snapshot Assertions package captures th...
- [ ] Verify: Combine Snapshot Assertions with Explicit Critical Value Checks
- [ ] Verify: Always Set `CREATE_SNAPSHOTS=false` in CI
- [ ] Verify: Use the Correct Snapshot Driver for Each Output Type
- [ ] Verify: Review Every Snapshot Change in Every PR

# Testing Checklist
- [ ] Snapshot files are committed to version control
- [ ] Dynamic fields are excluded with `ignoreKeys` or custom drivers
- [ ] Snapshot driver matches the data type (JSON, Var, Text, XML)
- [ ] `--update-snapshots` is never used in CI
- [ ] Snapshot diffs are reviewed during code review
- [ ] Snapshot directory is in `.gitignore`? (No â€” snapshots must be tracked)
- [ ] Avoid: Using snapshots for everything
- [ ] Avoid: Not reviewing snapshot diffs in PRs
- [ ] Avoid: Creating snapshots in CI

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Combine Snapshot Assertions with Explicit Critical Value Checks
- [ ] Apply: Always Set `CREATE_SNAPSHOTS=false` in CI
- [ ] Apply: Use the Correct Snapshot Driver for Each Output Type
- [ ] Apply: Review Every Snapshot Change in Every PR

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Using snapshots for everything
- [ ] Avoid mistake: Not reviewing snapshot diffs in PRs
- [ ] Avoid mistake: Creating snapshots in CI
- [ ] Avoid mistake: Using text driver for JSON output

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Combine Snapshot Assertions with Explicit Critical Value Checks
- Always Set `CREATE_SNAPSHOTS=false` in CI
- Use the Correct Snapshot Driver for Each Output Type
- Review Every Snapshot Change in Every PR
- Normalize Dynamic Data in Custom Drivers
- Keep Snapshot Files Under 500KB
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Use Spatie Snapshot Assertions for Regression Testing


