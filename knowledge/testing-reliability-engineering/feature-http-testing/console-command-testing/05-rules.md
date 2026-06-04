# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: Console/Artisan Command Testing

---

### Rule 1: Test both success and failure paths for every command

| Field | Value |
|-------|-------|
| **Name** | Test success and failure exit codes |
| **Category** | Command Execution |
| **Rule** | For every custom Artisan command, test both the success path (assert exit code 0) and at least one failure path (assert non-zero exit code). |
| **Reason** | Scripts and cron jobs that call Artisan commands rely on exit codes for error handling. A command that always returns 0 even on failure breaks downstream automation. |
| **Bad Example** | Testing only `$this->artisan('import:users')->assertExitCode(0)` — failure path untested. |
| **Good Example** | `test_import_succeeds()` + `test_import_fails_on_missing_file()` + `test_import_fails_on_invalid_format()`. |
| **Exceptions** | Commands that never fail by design (e.g., `cache:clear`). |
| **Consequences Of Violation** | Cron jobs and scripts do not detect failures. Automated workflows silently skip error handling. |

---

### Rule 2: Mock all external services in command tests

| Field | Value |
|-------|-------|
| **Name** | Fake external services in command tests |
| **Category** | Test Isolation |
| **Rule** | Always use `Http::fake()`, `Mail::fake()`, `Queue::fake()`, `Storage::fake()`, or other fakes for external service calls in Artisan command tests. |
| **Reason** | Commands making real API calls, sending real emails, or writing to real storage during tests create side effects, depend on external service availability, and execute slower. A command that makes a real API call during testing is a bug. |
| **Bad Example** | `$this->artisan('sync:users')` — makes real API calls to external service during test. |
| **Good Example** | `Http::fake(); $this->artisan('sync:users')->assertExitCode(0);` — external calls intercepted. |
| **Exceptions** | Integration or smoke tests that deliberately test external service connectivity. These should be in a separate suite. |
| **Consequences Of Violation** | Real emails sent, real API calls made. Tests fail when external services are unavailable. CI depends on network connectivity. |

---

### Rule 3: Use flexible output assertions for variable data

| Field | Value |
|-------|-------|
| **Name** | Prefer `expectsOutputToContain()` over exact `expectsOutput()` |
| **Category** | Output Assertions |
| **Rule** | Use `expectsOutputToContain('Processed')` or regex matching for output containing variable data (timestamps, counts, IDs). Reserve exact `expectsOutput()` for fully static strings. |
| **Reason** | Exact output matching on dynamic values (e.g., `Processed 10 records`) breaks every time the count changes. Flexible matching keeps tests robust while still verifying the critical output content. |
| **Bad Example** | `$this->artisan('import:users')->expectsOutput('Imported 10 users')` — breaks when 11 users are created. |
| **Good Example** | `expectsOutputToContain('Imported')` or `expectsOutput(fn ($output) => preg_match('/Imported \d+ users/', $output))`. |
| **Exceptions** | Output that is guaranteed static (e.g., command headers, separators). |
| **Consequences Of Violation** | Tests break on every data change. Developers stop trusting or maintaining command tests. |

---

### Rule 4: Test interactive commands with `expectsQuestion()` before execution

| Field | Value |
|-------|-------|
| **Name** | Register expected answers for interactive commands |
| **Category** | Interactive Commands |
| **Rule** | For commands using `ask()`, `confirm()`, `anticipate()`, or `choice()`, register all expected answers with `expectsQuestion()` before calling `$this->artisan()`. |
| **Reason** | Interactive commands attempt to read from STDIN during execution. Without pre-registered answers via `expectsQuestion()`, the command hangs waiting for input or fails with a read error. |
| **Bad Example** | `$this->artisan('make:model')` — no question setup; test hangs. |
| **Good Example** | `$this->artisan('make:model')->expectsQuestion('What is the model name?', 'User')->assertExitCode(0)`. |
| **Exceptions** | Commands run with `--no-interaction` flag that suppresses questions should not need `expectsQuestion()`. |
| **Consequences Of Violation** | Test hangs indefinitely. CI job times out. No feedback about command behavior. |

---

### Rule 5: Define and test exit code conventions

| Field | Value |
|-------|-------|
| **Name** | Establish command exit code conventions |
| **Category** | Command Design |
| **Rule** | Define exit code conventions for commands (0=success, 1=general error, 2=validation error, 3=partial success) and test each exit code path explicitly. |
| **Reason** | Downstream consumers (scripts, cron, CI) depend on exit codes to make decisions. Consistent conventions across all commands reduce integration bugs. |
| **Bad Example** | All failures return exit code 1 — consumers cannot distinguish validation errors from system errors. |
| **Good Example** | `exit(2)` for validation errors, `exit(1)` for system errors. Tests verify each code. |
| **Exceptions** | Commands with only success/failure states. |
| **Consequences Of Violation** | Downstream automation makes wrong decisions. Partial failures are treated as full successes or vice versa. |

---

### Rule 6: Include a confidence check test for every scheduled command

| Field | Value |
|-------|-------|
| **Name** | Confidence check scheduled commands |
| **Category** | Scheduled Tasks |
| **Rule** | For every command registered in the schedule, write a test that fakes all dependencies, runs the command, and asserts exit code 0. |
| **Reason** | Scheduled commands run without human oversight. A regression that breaks a scheduled command may go unnoticed for days. A confidence check verifies the command resolves, accepts its arguments, and executes without error. |
| **Bad Example** | No test for `cleanup:expired` — after a refactor, the command throws an exception and runs silently in production for a week. |
| **Good Example** | `Queue::fake(); Log::fake(); $this->artisan('cleanup:expired')->assertExitCode(0);`. |
| **Exceptions** | Commands that are inherently destructive and cannot be safely faked. |
| **Consequences Of Violation** | Scheduled tasks silently fail. Data accumulation, stale states, or missed operations go undetected. |

---

### Rule 7: Test behavior (database changes, side effects), not just output

| Field | Value |
|-------|-------|
| **Name** | Assert command side effects |
| **Category** | Command Execution |
| **Rule** | For data-processing commands, assert on database changes, file operations, and side effects — not just output and exit code. |
| **Reason** | Output can be correct while the command produces wrong side effects. A command that prints "Deleted 10 records" but actually deleted 0 is a bug that output assertions alone won't catch. |
| **Bad Example** | `expectsOutput('Purged 10 expired orders')` — no assertion that orders were actually deleted. |
| **Good Example** | `$this->assertDatabaseMissing('orders', ['id' => $expired->id]); $this->assertDatabaseHas('orders', ['id' => $active->id]);`. |
| **Exceptions** | Reporting or informational commands with no side effects. |
| **Consequences Of Violation** | Commands report success but do not perform their intended work. Data integrity issues compound over time. |
