# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | Console/Artisan Command Testing |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | HTTP test helpers, Artisan command development, Console output formatting |
| Related KUs | Scheduled task testing, Queue job testing, Logging testing |
| Source | domain-analysis.md K022 |

# Overview

Console/Artisan command testing verifies that CLI commands execute correctly, handle options/arguments properly, produce expected output, and manage exit codes. Laravel provides `$this->artisan('command', $parameters)` for testing commands within feature tests. Console commands are a critical part of most Laravel applications (scheduled jobs, maintenance tasks, data imports/exports) and require the same testing rigor as HTTP endpoints.

# Core Concepts

- **`$this->artisan('command', $parameters)`**: Executes an Artisan command within a test. Returns exit code. Captures output.
- **`assertExitCode($code)`**: Asserts the command exited with a specific code (0 = success).
- **`assertFailed()`**: Asserts command exited with non-zero code.
- **`expectsOutput($string)`**: Asserts the command outputs a specific string.
- **`expectsQuestion($question, $answer)`**: For commands using `$this->ask()` or `$this->confirm()`.
- **`doesntExpectOutput($string)`**: Asserts a string is NOT in the output.
- **`expectsTable($headers, $rows)`**: Asserts command outputs a formatted table.
- **`CommandTester` (Symfony)**: For unit-testing command classes in isolation without Laravel boot.

# When To Use

- For every custom Artisan command in the application
- For scheduled commands (verify they run without error)
- For data-processing commands (imports, exports, maintenance tasks)
- For interactive commands requiring user input
- For commands that produce output consumed by other systems or scripts

# When NOT To Use

- For commands that are wrapper calls to existing commands (test the wrapped command directly)
- For testing Laravel's built-in commands (they are tested by the framework)
- When `CommandTester` would be more appropriate (unit-level logic, no framework dependencies)
- For testing command registration only (test execution, not just `list` output)

# Best Practices (WHY)

- **Test both success and failure paths**: A command that fails should return a non-zero exit code. Scripts depending on exit codes will catch failures. Test both paths explicitly.
- **Mock external services**: Commands making API calls, sending emails, or queuing jobs should use fakes (`Http::fake()`, `Mail::fake()`, `Queue::fake()`). Real side effects in tests are dangerous and slow.
- **Prefer flexible output assertions**: `expectsOutput('Processed 10 records')` breaks when the count changes. Use `expectsOutputToContain('Processed')` or regex matching for variable data.
- **Test interactive commands with `expectsQuestion()`**: Commands using `ask()` or `confirm()` will fail at runtime without pre-registered answers. Always register expected answers for interactive commands.
- **Define and test exit code conventions**: 0=success, 1=general error, 2=validation error, 3=partial success. Test each exit code path.

# Architecture Guidelines

- **`$this->artisan()` vs `CommandTester`**: Use `$this->artisan()` for integration testing (boots Laravel, ~30-50ms). Use `CommandTester` for unit testing command logic without framework overhead (<1ms).
- **Output assertions vs behavior assertions**: Prefer output assertions for user-facing commands. Prefer behavior assertions (database changes, side effects) for data-processing commands.
- **Command isolation**: Commands depending on external services should use fakes. Commands writing to shared resources need process isolation.
- **Scheduled commands**: Test with faked dependencies and assert exit code 0.

# Performance Considerations

- `$this->artisan()` boots Laravel: ~30-50ms per command.
- Command execution overhead depends on logic. Data-processing commands may be slow.
- `CommandTester` without framework: <1ms per command. Use for unit-level command logic.
- Parallel execution: Commands writing to shared resources need isolation. Use process-specific temp directories.

# Security Considerations

- Commands that accept user input are vulnerable to argument injection. Test with unexpected arguments.
- Commands that handle sensitive data (PII, credentials) should not leak to stdout. Test with `doesntExpectOutput()` for sensitive data.
- DB-destructive commands should have confirmation prompts. Test the confirmation path.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not testing error/edge case paths | Focus on successful execution | Command fails silently in production cron | Test missing files, invalid input, network failures |
| Expecting exact output strings | `expectsOutput('Processed 10 records')` | Record count changes; test breaks | Use `expectsOutputToContain()` or regex matching |
| Forgetting to mock external services | Command calls real APIs or sends real emails | Real side effects in testing; slow execution | `Http::fake()`, `Mail::fake()`, `Queue::fake()` before execution |
| Testing command registration but not execution | `$this->artisan('list')` checks command is registered | Doesn't verify command logic | Test with actual arguments and assert on output/side effects |
| Not testing scheduled commands | Focus on explicitly called commands | Scheduled task fails in production cron | Test each scheduled command with confidence check pattern |

# Anti-Patterns

- **Testing via `list` command**: Running `$this->artisan('list')` to verify a command exists. Instead, test actual command execution with arguments.
- **No exit code assertions**: Only testing output strings. Missing exit code assertions means script integration breaks silently.
- **Hardcoded output in command logic**: Embedding test-only output in core command logic. Instead, structure command output for testability without test-specific code paths.
- **Interactive command without question setup**: Running an interactive command in a test without `expectsQuestion()`. The test will hang or fail.

# Examples

```php
// Success path with output and exit code
public function test_import_users_command_succeeds()
{
    Http::fake();
    User::factory(10)->create();

    $this->artisan('import:users')
        ->expectsOutput('Imported 10 users')
        ->assertExitCode(0);
}

// Failure path with exit code
public function test_import_users_fails_on_missing_file()
{
    $this->artisan('import:users', ['--file' => 'missing.csv'])
        ->assertFailed();
}

// Interactive command
public function test_make_model_prompts_for_name()
{
    $this->artisan('make:model')
        ->expectsQuestion('What is the model name?', 'User')
        ->assertExitCode(0);
}

// Scheduled command confidence check
public function test_scheduled_cleanup_runs_without_error()
{
    Queue::fake();
    Log::fake();

    $this->artisan('cleanup:expired')
        ->assertExitCode(0);
}

// Behavior assertion (database changes)
public function test_purge_command_deletes_expired_records()
{
    $expired = Order::factory()->expired()->create();
    $active = Order::factory()->create();

    $this->artisan('orders:purge');

    $this->assertDatabaseMissing('orders', ['id' => $expired->id]);
    $this->assertDatabaseHas('orders', ['id' => $active->id]);
}
```

# Related Topics

- **Prerequisites**: HTTP test helpers, Artisan command development, Console output formatting
- **Related**: Scheduled task testing, Queue job testing, Logging testing
- **Advanced**: Symfony CommandTester, Custom command validator testing, Command exit code conventions

# AI Agent Notes

- Always mock external services in command tests. A command that makes real API calls during testing is a bug.
- Use `expectsOutputToContain()` for variable output (timestamps, counts). Exact string matching causes brittle tests.
- For scheduled commands, use a "confidence check" test: fake all dependencies and assert exit code 0. This verifies the command resolves and executes without error.

# Verification

- [ ] Every custom Artisan command has a corresponding test
- [ ] Both success and failure paths are tested
- [ ] Exit codes are asserted for each path
- [ ] External services are mocked with fakes
- [ ] Interactive commands have `expectsQuestion()` setup
- [ ] Output assertions use flexible matching for variable data
- [ ] Scheduled commands have a confidence check test
- [ ] Command registration is verified through actual execution, not `list`
