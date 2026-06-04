# Knowledge Unit: Laravel Tinker REPL

## Metadata
- **Subdomain:** CLI Tooling & Artisan Extensions
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** cli-tooling-artisan-extensions/laravel-tinker-repl
- **Maturity:** Mature
- **Related Technologies:** Laravel Tinker, PsySH, PHP, Laravel

## Executive Summary

Laravel Tinker is a powerful interactive shell (REPL) for Laravel applications, built on top of PsySH. It provides an interactive PHP environment with full Laravel context: you can access models, query the database, test relationships, evaluate configuration, run Artisan commands, and debug application code in real-time. Tinker supports tab completion (class names, methods, variables), history navigation, inline documentation (`doc` command), source code inspection (`show` command), and namespace management. It's accessible via `php artisan tinker` or programmatically via `Psy\Shell` and `Psy\Configuration`. Tinker is essential for debugging, prototyping, ad-hoc data manipulation, and learning the framework.

## Core Concepts

- **REPL (Read-Eval-Print-Loop):** An interactive shell that reads PHP code, evaluates it in the Laravel application context, and prints the result
- **PsySH:** The underlying REPL engine (by Justin Hileman) that provides shell features: history, tab completion, exception handling, and variable inspection
- **Laravel Bootstrapping:** Tinker boots the full Laravel application (`Illuminate\Foundation\Application`) before presenting the prompt, making all services, facades, and models available
- **Tab Completion:** Tinker provides context-aware completion for: class names, method names, variable names, and file paths
- **Shell Commands:** PsySH commands like: `doc`, `show`, `ls`, `trace`, `warn`, `clear`, `exit` that operate on the shell environment

## Mental Models

- **Tinker as Interactive Test:** Tinker is like a live testing environment—you can call methods, inspect results, and verify behavior without writing tests or scripts
- **Tinker as Database Console:** Tinker with Eloquent is like having a SQL console that speaks PHP—you can query, create, update, delete, and inspect relationships with expressive syntax
- **Tinker as Application Sandbox:** A fully bootstrapped Laravel application where you can run any code, experiment, and observe results without side effects (unless you commit changes)

## Internal Mechanics

1. **Application Bootstrap:** `php artisan tinker` boots the Laravel application via the Kernel, loading all service providers, config files, and facades, just like a web request would
2. **PsySH Initialization:** After booting, Tinker initializes PsySH's `Shell` with a `Configuration` object that sets up: commands, prompt, history file location (`~/.psi_history`), and tab completion
3. **Code Evaluation:** When you enter `User::find(1)`, PsySH evaluates the expression in the global Laravel scope; output is formatted via PsySH's `Presenter` which uses reflection to display object details
4. **Exception Handling:** PsySH catches exceptions and displays them with the stack trace, allowing you to inspect variables at each frame and continue the session
5. **Shell State Persistence:** Tinker maintains state variables across evaluations—you can define `$user = User::first()` and use `$user` in the next expression

## Patterns

- **Ad-Hoc Query Pattern:** Quickly test Eloquent queries, relationships, scopes, and accessors: `User::where('active', true)->with('posts.comments')->get()`
- **Prototyping Pattern:** Test new code patterns, helper functions, or service interactions before committing to file: `$service = new ReportService(); $service->generate(Carbon::now())`
- **Debugging Pattern:** Inspect variables, method return values, and property states during development: `$user = User::with('orders')->find(1); $user->orders->sum('total')`
- **Configuration Inspection Pattern:** Check resolved configuration values, environment variables, and service container bindings: `config('services.stripe.key')`, `app()->bound('reports')`
- **Quick Data Fix Pattern:** Perform one-off data corrections: `User::where('email', 'typo@example.com')->update(['email' => 'correct@example.com'])`
- **Artisan Command Testing Pattern:** Test command output or behavior: `Artisan::call('cache:clear')`, `Artisan::output()`

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Framework | PsySH vs PHPSH vs Boris | PsySH (default, actively maintained, rich features) |
| Configuration | Default vs custom PsySH config | Default for most; customize for team-specific prompts or registered commands |
| History persistence | File (`~/.psi_history`) vs database vs disabled | File for persistence across sessions; disable for shared/CI environments |
| Exception display | PsySH default vs Laravel exception handler | PsySH default for interactive debugging; disable `whoops` integration if it conflicts |

## Tradeoffs

- **Full Bootstrap vs Fast Startup:** Tinker boots the entire Laravel application, taking 50-200ms. For simple PHP experimentation, `php -a` is faster. For Laravel context, Tinker's bootstrap time is unavoidable.
- **Convenience vs Safety:** Tinker gives full access to your application, including database writes. A typo in a destructive query (`User::truncate()` vs `User::get()`) can corrupt data. Use with care in production.
- **Stateful vs Stateless:** Tinker maintains state (variables, loaded classes, database connections) across evaluations. This makes multi-step experiments easy but can lead to stale state if you modify code files during a session.

## Performance Considerations

- **Bootstrap Time:** Tinker takes 50-200ms to boot the application (depending on service provider count and config caching). Once booted, code evaluation is immediate (<1ms).
- **Large Result Sets:** `User::all()->toArray()` with thousands of records prints all output to the terminal, consuming memory and time. Use `User::limit(10)->get()` for exploration.
- **N+1 Queries Unnoticed:** Running `User::all()->each(fn($u) => $u->posts)` without eager loading fires N+1 queries, all logged to the terminal. Use `with()` or `load()` for efficient exploration.
- **Memory Leaks in Long Sessions:** Variables accumulate in memory over long Tinker sessions. If processing large datasets, unset variables or restart the session periodically.

## Production Considerations

- **Never in Production:** Tinker should never be used in production environments. It's a development tool that gives unrestricted access to your application's data and services.
- **Configuration for Production Safeguards:** If Tinker must be available in non-local environments, use the `config/tinker.php` configuration to whitelist/blacklist commands and disable destructive operations.
- **Database Modification Awareness:** Tinker sessions that modify the database bypass Laravel's model events, observers, or queue dispatch in some contexts. Verify expectations after manual data manipulation.
- **Security Implications:** An active Tinker session on a server is equivalent to root shell access. Never leave Tinker sessions open in production or expose Tinker via HTTP.

## Common Mistakes

- **Running destructive queries without WHERE:** `User::delete()` instead of `User::where('active', false)->delete()`; always test with `->get()` first, then use `->delete()` or `->update()`
- **Forgetting to import facades:** Using `Cache::put()` without importing the Cache facade at the top of the session; use full namespace or import once with `use Illuminate\Support\Facades\Cache`
- **Closing Tinker and losing state:** Variables, connections, and uncommitted transactions are lost when exiting Tinker. Plan multi-step operations to complete before exit.
- **Expecting file changes to reflect immediately:** Modifying PHP files during a Tinker session doesn't reload classes. Exit and re-enter Tinker to pick up file changes (or use the PsySH `reload` command if available).
- **Ignoring PsySH commands:** Not knowing about `doc`, `show`, `ls` commands reduces Tinker's utility for code exploration and documentation lookup.

## Failure Modes

- **Memory Limit Exceeded:** Loading a very large Eloquent collection into a variable exhausts PHP's memory limit. Mitigate: always limit result sets during exploration; use `chunk()` for large data access.
- **Class Not Found After Code Change:** Adding a new class to the application while Tinker is running; Tinker doesn't autoload the new class because the autoloader is cached. Mitigate: restart Tinker after file changes.
- **Database Connection Timeout:** Long Tinker sessions with idle database connections may result in MySQL `wait_timeout` disconnection. Mitigate: reconnect with `DB::reconnect()` if queries fail.
- **Infinite Loop:** A buggy closure or recursive function in Tinker hangs the session. Mitigate: Ctrl+C to interrupt; use `set_time_limit(0)` with caution.

## Ecosystem Usage

- **Laravel Framework:** The `laravel/tinker` package was introduced in Laravel 5.0 and has been included by default since Laravel 5.4
- **PsySH Ecosystem:** Many PsySH plugins extend Tinker's capabilities: custom commands, REPL extensions for debugging, and integration with PHPUnit
- **Laravel Debugging Workflow:** Tinker is used alongside Debugbar and Telescope for a complete debugging experience: use Telescope to capture requests, then Tinker to inspect and manipulate related data
- **Community Packages:** Third-party packages like `barryvdh/laravel-ide-helper` provide Tinker commands for IDE meta generation and model annotation inspection

## Related Knowledge Units

- custom-artisan-command-patterns
- cli-workflow-automation
- interactive-commands

## Research Notes

- PsySH itself is a standalone project (not Laravel-specific) that provides the REPL foundation; Tinker provides the Laravel integration via `PsySH\Configuration::setStartupMessage()` and custom commands
- Tinker's `shell.include` configuration option allows pre-loading helper files on startup—useful for custom global functions or debug helpers
- The Tinker configuration file (`config/tinker.php`) was introduced in Laravel 8.x, allowing whitelist/blacklist configuration for commands and aliases
- PsySH supports custom tab completion via `Completion` classes; this is leveraged by IDE Helper packages to provide type-aware completion in Tinker
