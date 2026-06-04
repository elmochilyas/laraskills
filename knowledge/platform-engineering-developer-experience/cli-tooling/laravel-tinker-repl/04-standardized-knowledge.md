# 04-Standardized Knowledge: Laravel Tinker REPL

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | cli-tooling-artisan-extensions |
| **Knowledge Unit** | laravel-tinker-repl |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | custom-artisan-command-patterns, cli-workflow-automation, interactive-commands |
| **Framework/Language** | Laravel Tinker, PsySH, PHP |

## Overview

Laravel Tinker is an interactive REPL (Read-Eval-Print-Loop) for Laravel, built on PsySH. It provides a fully bootstrapped Laravel environment where developers can access models, query databases, test relationships, evaluate config, run commands, and debug code in real-time. Features include tab completion, history navigation, inline documentation (`doc`), source inspection (`show`), and namespace management. Access via `php artisan tinker`.

## Core Concepts

- **REPL**: interactive shell reading PHP code, evaluating in Laravel context, printing results
- **PsySH**: underlying engine providing history, tab completion, exception handling, variable inspection
- **Full Bootstrap**: Tinker loads the complete Laravel application (all service providers, config, facades)
- **Tab Completion**: context-aware completion for class names, methods, variables, file paths
- **Shell Commands**: `doc`, `show`, `ls`, `trace`, `warn`, `clear`, `exit` for shell environment operations

## When to Use

- Ad-hoc database queries and Eloquent relationship testing during development
- Prototyping new code patterns, service interactions, or helper functions
- Debugging variable states, method return values, and configuration resolution
- One-off data corrections (careful: bypasses some model events)
- Testing Artisan command output or behavior interactively

## When NOT to Use

- Production environments — never run Tinker on production servers
- Complex multi-step data migrations (use dedicated migration/seeder scripts)
- Operations requiring transaction safety (Tinker sessions are stateless across evaluations)
- When file changes need immediate reflection (restart Tinker to pick up new code)
- Automated or CI tasks (use `Artisan::call()` programmatically instead)

## Best Practices (WHY)

- **Limit result sets**: use `User::limit(10)->get()` instead of `User::all()` to avoid memory exhaustion
- **Eager load relationships**: use `with()` to prevent N+1 queries during exploration
- **Test with `->get()` before destructive operations**: verify the query returns what you expect before calling `->delete()` or `->update()`
- **Use `doc` and `show` commands**: leverage PsySH commands for code exploration and documentation lookup
- **Import facades once**: `use Illuminate\Support\Facades\Cache` at session start
- **Restart after file changes**: exit and re-enter Tinker to pick up modified PHP files

## Architecture Guidelines

- Tinker configuration (`config/tinker.php`) supports command whitelist/blacklist and aliases
- Use `shell.include` config to pre-load helper files on startup for custom global functions
- Tinker should never be installed as a non-dev dependency (`require-dev` only)
- Consider `PsySH\Configuration::setStartupMessage()` for team-specific prompts or registered commands

## Performance Considerations

- Bootstrap time: 50-200ms for full Laravel application boot (once per session)
- Code evaluation: <1ms after bootstrap — effectively instant
- Large result sets: `User::all()->toArray()` with thousands of records consumes memory and terminal output
- N+1 queries: all queries log to terminal during exploration — use eager loading

## Security Considerations

- **Never in production**: Tinker provides unrestricted data and service access
- If unavoidable in non-local, use `config/tinker.php` whitelist/blacklist to disable destructive operations
- Active Tinker session on a server = equivalent to root shell access
- Tinker bypasses some Laravel model events and observers for direct DB operations
- Database modifications in Tinker are not automatically rolled back

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Destructive query without WHERE | `User::delete()` instead of `User::where(...)->delete()` | Typo or haste | Data loss | Always `->get()` first to verify |
| Forgetting facade imports | Using facade without importing | Facade autoloading not active | Class not found error | Import with `use` statement |
| Expecting file changes to reflect | Modifying files during Tinker session | Not knowing class caching | Stale class state | Exit and re-enter Tinker |
| Not knowing PsySH commands | Only typing PHP without using `doc`, `show`, `ls` | Unfamiliarity | Reduced productivity | Learn PsySH commands |
| Production Tinker | Running on production for ad-hoc fixes | Convenience | Security breach | Never run Tinker in production |

## Anti-Patterns

- **Production Tinker Sessions**: using Tinker on live production servers
- **Bulk Data Operations**: inserting/updating thousands of records via Tinker instead of batch jobs
- **Session Dependency**: relying on Tinker state across different terminal sessions
- **Unlimited Result Sets**: `Model::all()` without limits on large tables
- **Skipping Eager Loading**: triggering N+1 queries during interactive exploration

## Examples

```php
// Start session
php artisan tinker

// Ad-hoc queries
>>> $user = User::with('posts.comments')->find(1);
>>> $user->posts->count();
>>> $user->posts->pluck('title');

// Prototype new code
>>> $service = new App\Services\ReportService;
>>> $service->generate(Carbon::now());

// Inspect configuration
>>> config('services.stripe.key');
>>> app()->bound('reports');

// Use PsySH commands
>>> doc User::where
>>> show App\Models\User

// One-off data fix (careful!)
>>> User::where('email', 'typo@example.com')->update(['email' => 'correct@example.com']);
```

## Related Topics

- custom-artisan-command-patterns — command structure and registration
- cli-workflow-automation — chaining commands into workflows
- interactive-commands — prompts, confirmations, choices
- laravel-telescope — request inspection and debugging

## AI Agent Notes

- Tinker provides a fully bootstrapped app context — ideal for AI agents to test queries and verify behavior
- For automated exploration, use `php artisan tinker --execute="User::count()"` for single expressions
- Tinker maintains no state between evaluations for the agent — each command is an isolated expression
- When AI agents generate Tinker examples, always include eager loading and limit clauses

## Verification

- [ ] `php artisan tinker` starts with PsySH prompt
- [ ] Tab completion works for class names and methods
- [ ] `doc` and `show` PsySH commands display documentation
- [ ] Eloquent queries return expected results
- [ ] `User::limit(10)` works without memory issues
- [ ] Facades accessible after import (`use` statement)
- [ ] Tinker only in `require-dev` composer configuration
- [ ] No production access configured
