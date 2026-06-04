# Skill: Test Artisan Console Commands

## Purpose
Write comprehensive tests for Artisan commands covering success/failure paths, exit codes, output assertions, interactive prompts, and side effects.

## When To Use
- Creating a new custom Artisan command
- Adding a command to the schedule
- Modifying an existing command's behavior
- Writing data-processing commands (imports, exports, cleanup)

## When NOT To Use
- Testing Laravel's built-in commands (they are tested by the framework)
- Testing command registration only (test execution, not `list` output)
- Using `$this->artisan()` for unit-level command logic (use `CommandTester` instead)

## Prerequisites
- Custom Artisan command implemented
- Understanding of exit codes (0 = success, non-zero = failure)
- Fakes available for external services (Http::fake, Mail::fake, etc.)

## Inputs
- Command signature and arguments/options
- Expected success and failure scenarios
- Interactive questions (if command uses ask/confirm/choice)

## Workflow
1. Define exit code conventions: 0=success, 1=general error, 2=validation error, 3=partial success
2. Write a success path test: `$this->artisan('command:name', $args)->assertExitCode(0)`
3. Write at least one failure path test asserting non-zero exit code
4. For output, use `expectsOutputToContain()` for variable data (counts, timestamps) and `expectsOutput()` for static strings
5. Mock all external services: `Http::fake()`, `Mail::fake()`, `Queue::fake()`, `Storage::fake()` before executing the command
6. For interactive commands, register answers with `expectsQuestion('Question text', 'answer')` before calling `$this->artisan()`
7. For data-processing commands, assert on database changes or side effects, not just output
8. Write a confidence check test for every scheduled command: fake all dependencies, assert exit code 0
9. Use `CommandTester` for unit-testing command logic without Laravel boot (sub-millisecond tests)

## Validation Checklist
- [ ] Both success and failure paths tested with exit code assertions
- [ ] External services mocked with fakes
- [ ] Output assertions use flexible matching for variable data
- [ ] Interactive commands have `expectsQuestion()` setup
- [ ] Database/behavior side effects asserted (not just output)
- [ ] Scheduled command has a confidence check test
- [ ] Exit code conventions documented and tested per path

## Common Failures
- No exit code assertions — downstream scripts don't detect failures
- Exact output matching on dynamic values (counts, timestamps)
- Real external API calls during test execution
- Missing `expectsQuestion()` for interactive commands (test hangs)
- Only testing the success path

## Decision Points
- Use `$this->artisan()` for integration tests (boots Laravel, ~30-50ms) vs `CommandTester` for unit tests (<1ms)
- Use `expectsOutputToContain()` for dynamic output vs `expectsOutput()` for static strings
- Assert exit code vs assert side effects — both are needed for data-processing commands

## Performance Considerations
- `$this->artisan()` boots Laravel: ~30-50ms per command
- `CommandTester` without framework: <1ms per command
- Data-processing commands may be inherently slow; use fakes for external dependencies
- Commands writing to shared resources need process isolation for parallel execution

## Security Considerations
- Test argument injection: commands accepting user input should handle unexpected arguments safely
- Test sensitive data not leaked to stdout: use `doesntExpectOutput()` for credentials/PII
- Test destructive commands require confirmation prompts

## Related Rules (from 05-rules.md)
- Rule 1: Test both success and failure paths for every command
- Rule 2: Mock all external services in command tests
- Rule 3: Use flexible output assertions for variable data
- Rule 4: Test interactive commands with `expectsQuestion()` before execution
- Rule 5: Define and test exit code conventions
- Rule 6: Include a confidence check test for every scheduled command
- Rule 7: Test behavior (database changes, side effects), not just output

## Success Criteria
- Every custom command tested for success and at least one failure path
- Scheduled commands have confidence checks that run without error
- Exit codes match conventions and are verified by tests
- Interactive commands complete without hanging
- No external service calls leak through to real services
