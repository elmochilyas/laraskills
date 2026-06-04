# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** Console/Artisan Command Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Test both success and failure paths for every command
- [ ] Apply rule: Mock all external services in command tests
- [ ] Apply rule: Use flexible output assertions for variable data
- [ ] Apply rule: Test interactive commands with `expectsQuestion()` before execution
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Both success and failure paths tested with exit code assertions
- [ ] External services mocked with fakes
- [ ] Output assertions use flexible matching for variable data
- [ ] Interactive commands have `expectsQuestion()` setup
- [ ] Database/behavior side effects asserted (not just output)
- [ ] Avoid: Mistake
- [ ] Avoid: Not testing error/edge case paths
- [ ] Avoid: Expecting exact output strings

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`$this->artisan()` vs `CommandTester`**: Use `$this->artisan()` for integration testing (boots Laravel, ~30-50ms). Use `CommandTester` for unit testing command logic without framework overhead (<1ms).
- **Output assertions vs behavior assertions**: Prefer output assertions for user-facing commands. Prefer behavior assertions (database changes, side effects) for data-processing commands.
- **Command isolation**: Commands depending on external services should use fakes. Commands writing to shared resources need process isolation.
- **Scheduled commands**: Test with faked dependencies and assert exit code 0.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Test both success and failure paths for every command
- [ ] Follow rule: Mock all external services in command tests
- [ ] Follow rule: Use flexible output assertions for variable data
- [ ] Follow rule: Test interactive commands with `expectsQuestion()` before execution
- [ ] Follow rule: Define and test exit code conventions
- [ ] Follow rule: Include a confidence check test for every scheduled command
- [ ] - [ ] Both success and failure paths tested with exit code assertions
- [ ] - [ ] External services mocked with fakes
- [ ] - [ ] Output assertions use flexible matching for variable data
- [ ] - [ ] Interactive commands have `expectsQuestion()` setup

# Performance Checklist
- `$this->artisan()` boots Laravel: ~30-50ms per command.
- Command execution overhead depends on logic. Data-processing commands may be slow.
- `CommandTester` without framework: <1ms per command. Use for unit-level command logic.
- Parallel execution: Commands writing to shared resources need isolation. Use process-specific temp directories.

# Security Checklist
- Commands that accept user input are vulnerable to argument injection. Test with unexpected arguments.
- Commands that handle sensitive data (PII, credentials) should not leak to stdout. Test with `doesntExpectOutput()` for sensitive data.
- DB-destructive commands should have confirmation prompts. Test the confirmation path.

# Reliability Checklist
- [ ] Ensure: Console/Artisan command testing verifies that CLI commands execute correctly, ha...
- [ ] Verify: Test both success and failure paths for every command
- [ ] Verify: Mock all external services in command tests
- [ ] Verify: Use flexible output assertions for variable data
- [ ] Verify: Test interactive commands with `expectsQuestion()` before execution

# Testing Checklist
- [ ] Both success and failure paths tested with exit code assertions
- [ ] External services mocked with fakes
- [ ] Output assertions use flexible matching for variable data
- [ ] Interactive commands have `expectsQuestion()` setup
- [ ] Database/behavior side effects asserted (not just output)
- [ ] Scheduled command has a confidence check test
- [ ] Avoid: Mistake
- [ ] Avoid: Not testing error/edge case paths
- [ ] Avoid: Expecting exact output strings

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Test both success and failure paths for every command
- [ ] Apply: Mock all external services in command tests
- [ ] Apply: Use flexible output assertions for variable data
- [ ] Apply: Test interactive commands with `expectsQuestion()` before execution

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not testing error/edge case paths
- [ ] Avoid mistake: Expecting exact output strings
- [ ] Avoid mistake: Forgetting to mock external services
- [ ] Avoid mistake: Testing command registration but not execution

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
- Test both success and failure paths for every command
- Mock all external services in command tests
- Use flexible output assertions for variable data
- Test interactive commands with `expectsQuestion()` before execution
- Define and test exit code conventions
- Include a confidence check test for every scheduled command
- Test behavior (database changes, side effects), not just output
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Artisan Console Commands


