# Skill: Create Custom Artisan Commands

## Purpose
Build custom Artisan commands that automate development tasks, provide CLI interfaces for application features, and bridge Laravel operations with external tools.

## When To Use
- Automating repetitive development tasks (setup, migrations, data cleanup)
- Creating CLI interfaces for application features (reports, exports, notifications)
- Bridging Laravel operations with external tools (APIs, file systems, queues)
- Providing maintenance and troubleshooting commands for production operations

## When NOT To Use
- Simple one-off tasks better suited for closures in `routes/console.php`
- Business logic that belongs in service classes (commands should be thin I/O wrappers)
- Interactive workflows needing complex state machines (use dedicated console apps)
- Operations better handled by the task scheduler or queue workers

## Prerequisites
- Laravel application with Artisan configured
- Understanding of command signatures, arguments, and output formatting
- Familiarity with dependency injection via `handle()`

## Inputs
- Command purpose and name (`group:action` convention)
- Arguments and options for input
- Service classes for business logic
- Output requirements (formatting, exit codes)

## Workflow
1. Generate command with `php artisan make:command CommandName`
2. Define `$signature` with name, arguments, options, and descriptions
3. Set `$description` for `php artisan list` output
4. Inject dependencies in `handle()` method signatures
5. Keep `handle()` thin — delegate business logic to service classes
6. Use Guard pattern: check prerequisites before proceeding
7. Return `0` on success and `1` on failure for scriptable exit codes
8. Make commands idempotent: check state before acting, report "nothing to do" instead of erroring
9. Register via `$commands` array for small apps; use `load()` for modular/multi-package apps
10. For simple one-off commands in Laravel 11+, use closure syntax in `routes/console.php`

## Validation Checklist
- [ ] Command class extends `Illuminate\Console\Command`
- [ ] `$signature` includes name, arguments, options, and descriptions
- [ ] `$description` set for `php artisan list` output
- [ ] Business logic delegated to service classes (thin handle)
- [ ] Exit codes: `return 0` on success, `return 1` on failure
- [ ] Command is idempotent (check state before acting)
- [ ] No `die()`, `exit()`, or `dd()` used; always return exit codes
- [ ] Dependencies injected via `handle()` for testability
- [ ] Command registered in Kernel or via `load()`

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Command logic mixed with I/O | No service delegation | `handle()` should only call services; logic in service classes |
| Hard to test command | Using `$this->argument()` everywhere | Inject services via `handle()`; use `$this->artisan()` assertions |
| Exit code always 0 | No explicit return | Always `return 0` on success, `return 1` on failure |
| Command not found | Not registered | Register in `$commands` array or use `load()` |
| Die/exit/dd in command | Wrong error handling | Return exit codes instead |
| Command breaks if re-run | Not idempotent | Check state before acting; report "nothing to do" |
| Too many responsibilities | Single responsibility violated | Split complex workflows into focused commands |

## Decision Points
- **Registration method:** `$commands` array (small apps) vs `load()` (modular/multi-package)
- **Injection style:** Constructor injection (shared deps) vs `handle()` injection (per-command services)
- **Command class vs closure:** Full class for complex commands; `__invoke()` closure for simple one-offs
- **Hidden commands:** Use `$hidden = true` for maintenance commands not shown in `list`

## Performance/Security Considerations
- Never use `die()`, `exit()`, or `dd()` — always return exit codes for scripting
- Commands may run with elevated permissions (scheduler, CI); validate all input
- Use `$this->secret()` for sensitive input (passwords, tokens)
- Commands in production must be idempotent to prevent data corruption on re-run
- Log command execution for audit trail (CommandStarting/CommandFinished events)

## Related Rules
- CAC-RULE-001 through CAC-RULE-013

## Related Skills
- Define Command Signatures and Arguments
- Format Console Output
- Build Interactive Commands
- Create Custom Generator Commands
- Automate CLI Workflows

## Success Criteria
- Custom commands are testable with `$this->artisan()` assertions
- All commands return appropriate exit codes for CI/CD usage
- Business logic is in service classes, not in `handle()`
- Commands are idempotent and safe to re-run
- `php artisan list` shows all commands with accurate descriptions
