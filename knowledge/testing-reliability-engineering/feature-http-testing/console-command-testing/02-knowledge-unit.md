# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: Console/Artisan Command Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Console/Artisan command testing verifies that CLI commands execute correctly, handle options/arguments properly, produce expected output, and manage exit codes. Laravel provides `$this->artisan('command', $parameters)` for testing commands within feature tests plus the `HttpKernel` test client for console-specific assertions. Console commands are a critical part of most Laravel applications (scheduled jobs, maintenance tasks, data imports/exports) and require the same testing rigor as HTTP endpoints.

# Core Concepts
- **`$this->artisan('command', $parameters)`**: Executes an Artisan command within a test. Returns exit code. Captures output.
- **`assertExitCode($code)`**: Asserts the command exited with a specific code (0 = success).
- **`assertFailed()`**: Asserts command exited with non-zero code.
- **`expectsOutput($string)`**: Asserts the command outputs a specific string.
- **`expectsQuestion($question, $answer)`**: For commands using `$this->ask()` or `$this->confirm()` for interactive input.
- **`doesntExpectOutput($string)`**: Asserts a string is NOT in the output.
- **`expectsTable($headers, $rows)`**: Asserts command outputs a formatted table.
- **Console output mocking**: `$this->withoutMockingConsoleOutput()` to test with real output.
- **`CommandTester` (Symfony)**: For unit-testing command classes in isolation without Laravel boot.

# Mental Models
- **Command as controller**: An Artisan command is like an HTTP controller for the CLI. Arguments are request parameters; output is the response.
- **Artisan test as simulated CLI session**: `$this->artisan('foo')` simulates running `php artisan foo` with all the framework booting, service registration, and command resolution.
- **Output as assertion target**: Command output (stdout/stderr) is the primary assertion target, analogous to HTTP response body.
- **Exit code as status**: 0 = success, 1+ = failure. Test both success and failure paths with exit code assertions.

# Internal Mechanics
- **`$this->artisan()` implementation**: Creates an `Illuminate\Console\Application`, resolves the command, and executes it within the test's application context. Output is captured to an in-memory buffer.
- **Command resolution**: Commands are registered in `Kernel` and resolved from the container. Dependencies are auto-injected.
- **Output buffering**: `expectsOutput()` captures output to a `BufferedOutput` and compares against expected strings.
- **Question simulation**: `expectsQuestion()` registers answer callbacks. When the command calls `$this->ask()`, the registered answer is returned.
- **Exit code**: The command's `handle()` return value is passed through Symfony's `Command::run()`. 0 = success, 1+ = error.
- **Without mocking output**: By default, Artisan tests capture output. Use `withoutMockingConsoleOutput()` to allow real output (useful for debugging).

# Patterns
- **Pattern: Success path output verification**
  - Purpose: Test command produces correct output on success
  - Benefits: Validates user-facing command results
  - Tradeoffs: Output text changes break tests
  - Implementation: `$this->artisan('import:users')->expectsOutput('Imported 10 users')->assertExitCode(0)`

- **Pattern: Failure path exit code**
  - Purpose: Test command returns non-zero on error
  - Benefits: Scripts depending on exit codes catch failures
  - Tradeoffs: Must trigger actual error condition
  - Implementation: `$this->artisan('import:users', ['--file' => 'missing.csv'])->assertFailed()`

- **Pattern: Interactive command input**
  - Purpose: Test commands that prompt for user input
  - Benefits: Full coverage for interactive workflows
  - Tradeoffs: More verbose test setup
  - Implementation: `$this->artisan('make:model')->expectsQuestion('What is the model name?', 'User')->assertExitCode(0)`

- **Pattern: Scheduled command confidence check**
  - Purpose: Verify scheduled commands run without error in testing environment
  - Benefits: Prevents scheduled task failures from reaching production
  - Tradeoffs: May not test all code paths if command has complex conditions
  - Implementation: `$this->artisan('schedule:run')->assertExitCode(0)` (with faked dependencies)

# Architectural Decisions
- **`$this->artisan()` vs `CommandTester`**: Use `$this->artisan()` for integration testing (boots Laravel). Use `CommandTester` for unit testing command logic without framework overhead.
- **Output assertions vs behavior assertions**: Prefer output assertions for user-facing commands. Prefer behavior assertions (database changes, side effects) for data-processing commands.
- **Command isolation**: Commands that depend on external services should use fakes (Http::fake(), Queue::fake()) to ensure speed and determinism.
- **Exit code significance**: Define clear exit code conventions: 0=success, 1=general error, 2=validation error, 3=partial success. Test each.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| `$this->artisan()` is simple and full-stack | Boots entire Laravel (~30ms per command) | Use CommandTester for unit-level tests |
| Output assertions verify user experience | Output text changes break tests | Use regex matchers for variable text |
| Exit codes enable script integration | Exit code conventions must be documented | Define standards early; enforce via tests |
| Question simulation handles interactivity | Questions must match exactly (text + order) | Keep question text stable; test changes |

# Performance Considerations
- `$this->artisan()` boots Laravel: ~30-50ms per command.
- Command execution overhead: Depends on command logic. Data-processing commands may be slow (DB operations, API calls).
- Output buffering: Negligible overhead.
- `CommandTester` without framework: <1ms per command. Use for unit-level command logic.
- Parallel execution: Commands that write to shared resources (files, databases) need isolation. Use process-specific temp directories.

# Production Considerations
- **Scheduled commands**: Test that scheduled commands run correctly in production-like conditions. Use CI cron simulation.
- **Environment awareness**: Commands should behave differently in testing vs production (e.g., no real API calls). Use `APP_ENV` checks with test overrides.
- **Logging**: Console commands that log to files should use `Log::fake()` in tests. Prevent log file pollution.
- **Maintenance mode**: Test that commands respect `php artisan down` (maintenance mode) appropriately. Some commands should still run (queue workers, cache clears).

# Common Mistakes
- **Mistake: Not testing error/edge case paths**
  - Why: Focus on successful execution
  - Why harmful: Command fails silently in production cron
  - Better: Test missing files, invalid input, network failures, missing dependencies

- **Mistake: Expecting exact output strings**
  - Why: `expectsOutput('Processed 10 records')`
  - Why harmful: Record count changes; test breaks
  - Better: Use `expectsOutputToContain('Processed')` or regex matching

- **Mistake: Forgetting to mock external services**
  - Why: Command calls real APIs or sends real emails
  - Why harmful: Real side effects in testing; slow execution
  - Better: `Http::fake()`, `Mail::fake()`, `Queue::fake()` before command execution

- **Mistake: Testing command registration but not execution**
  - Why: `$this->artisan('list')->assertSuccessful()` checks command is registered
  - Why harmful: Doesn't verify command logic at all
  - Better: Test command with actual arguments and asserts on output/side effects

# Failure Modes
- **Command not registered**: If command is not registered in `Kernel`, `$this->artisan()` throws `Symfony\Component\Console\Exception\CommandNotFoundException`. Test registration separately.
- **Interactive command in non-interactive test**: Commands expecting `$this->ask()` without `expectsQuestion()` setup fail with runtime error. Always pre-register answers for interactive commands.
- **Schedule overlap**: Scheduled commands running longer than their frequency overlap. Test with duration tracking.
- **Memory exhaustion in data commands**: Commands processing large datasets may hit memory limits. Use chunking (`chunk()`, `lazy()`) and test with realistic data volumes.

# Ecosystem Usage
- **Laravel core**: Artisan commands (`make:model`, `migrate`, etc.) have comprehensive test coverage using `$this->artisan()`.
- **Laravel Horizon**: Horizon's monitoring and management commands use `$this->artisan()` with Queue fakes.
- **Laravel Telescope**: Telescope's pruning and cleanup commands are tested with database assertions.
- **Spatie packages**: Most Spatie packages provide Artisan commands (e.g., `permission:show`) with test coverage.

# Related Knowledge Units
- **Prerequisites**: HTTP test helpers, Artisan command development, Console output formatting
- **Related Topics**: Scheduled task testing, Queue job testing, Logging testing
- **Advanced Follow-up**: Symfony CommandTester, Custom command validator testing, Command exit code conventions

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server — requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
