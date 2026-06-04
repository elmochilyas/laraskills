# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Snapshot Testing
**Knowledge Unit:** Snapshot Testing with Spatie
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Never Use Snapshots as the Only Assertion Mechanism
- [ ] Apply rule: Always Set `CREATE_SNAPSHOTS=false` in CI
- [ ] Apply rule: Use JSON Driver for JSON Output, Not Text Driver
- [ ] Apply rule: Review Every Snapshot Diff in PR Code Review
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Snapshot files are committed to version control
- [ ] Non-deterministic fields are excluded or handled
- [ ] Snapshot update process is documented for the team
- [ ] Snapshot diffs are reviewed during PRs as carefully as code diffs
- [ ] Snapshot files are organized in a predictable directory structure
- [ ] Avoid: Using snapshots for everything
- [ ] Avoid: Not reviewing snapshot diffs in PRs
- [ ] Avoid: Creating snapshots in CI

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Snapshot location**: Default `tests/.pest/snapshots/` is fine for most projects. Custom location for monorepos.
- **Snapshot naming convention**: Snapshot files are named by test file path, class, and method. Don't rename them manually.
- **Driver selection**: JSON for API/serialization, HTML for views, Text for plain strings, File for binaries. Match driver to output type.
- **Parallel test compatibility**: Snapshot writes are atomic (write to temp file, rename). No corruption risk with parallel execution.
- **Version control**: Commit snapshot files to VCS. They are the expected output baseline. `.gitignore` should NOT exclude snapshot directories.
- **Continuous integration**: Always test with `CREATE_SNAPSHOTS=false` to verify snapshots exist and match.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Never Use Snapshots as the Only Assertion Mechanism
- [ ] Follow rule: Always Set `CREATE_SNAPSHOTS=false` in CI
- [ ] Follow rule: Use JSON Driver for JSON Output, Not Text Driver
- [ ] Follow rule: Review Every Snapshot Diff in PR Code Review
- [ ] Follow rule: Use Snapshot Testing Only for Stable, Rarely-Changing Outputs
- [ ] Follow rule: Keep Single Snapshot Files Under 500KB
- [ ] - [ ] Snapshot files are committed to version control
- [ ] - [ ] Non-deterministic fields are excluded or handled
- [ ] - [ ] Snapshot update process is documented for the team
- [ ] - [ ] Snapshot diffs are reviewed during PRs as carefully as code diffs

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Snapshot testing with the Spatie PHPUnit Snapshot Assertions package captures te...
- [ ] Verify: Never Use Snapshots as the Only Assertion Mechanism
- [ ] Verify: Always Set `CREATE_SNAPSHOTS=false` in CI
- [ ] Verify: Use JSON Driver for JSON Output, Not Text Driver
- [ ] Verify: Review Every Snapshot Diff in PR Code Review

# Testing Checklist
- [ ] Snapshot files are committed to version control
- [ ] Non-deterministic fields are excluded or handled
- [ ] Snapshot update process is documented for the team
- [ ] Snapshot diffs are reviewed during PRs as carefully as code diffs
- [ ] Snapshot files are organized in a predictable directory structure
- [ ] Snapshots are updated only when output intentionally changes
- [ ] Avoid: Using snapshots for everything
- [ ] Avoid: Not reviewing snapshot diffs in PRs
- [ ] Avoid: Creating snapshots in CI

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Never Use Snapshots as the Only Assertion Mechanism
- [ ] Apply: Always Set `CREATE_SNAPSHOTS=false` in CI
- [ ] Apply: Use JSON Driver for JSON Output, Not Text Driver
- [ ] Apply: Review Every Snapshot Diff in PR Code Review

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Using snapshots for everything
- [ ] Avoid mistake: Not reviewing snapshot diffs in PRs
- [ ] Avoid mistake: Creating snapshots in CI
- [ ] Avoid mistake: Text driver for JSON output

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
- Never Use Snapshots as the Only Assertion Mechanism
- Always Set `CREATE_SNAPSHOTS=false` in CI
- Use JSON Driver for JSON Output, Not Text Driver
- Review Every Snapshot Diff in PR Code Review
- Use Snapshot Testing Only for Stable, Rarely-Changing Outputs
- Keep Single Snapshot Files Under 500KB
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Implement Snapshot Testing


