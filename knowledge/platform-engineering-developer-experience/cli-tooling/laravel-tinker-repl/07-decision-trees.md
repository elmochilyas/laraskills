# Decision Trees: Laravel Tinker REPL

## Metadata
- **KU ID:** cli-tooling-artisan-extensions/laravel-tinker-repl
- **Subdomain:** cli-tooling-artisan-extensions
- **Domain:** platform-engineering-developer-experience
- **Phase:** 4 (Experience Curation)
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | When to use Tinker | Ad-hoc queries / Prototyping / Debugging / Data fixes | Appropriate vs inappropriate Tinker usage |
| 2 | Query safety strategy | `->get()` first / Limit always / Transaction wrap | Preventing accidental destructive operations |
| 3 | Environment selection | Local only / Staging / Never production | Security boundaries for REPL access |
| 4 | Session management | Single expression / Multi-line / Using `--execute` | Interactive vs automated REPL usage |
| 5 | Code change reflection | Restart Tinker / Reload classes / No action needed | Ensuring Tinker uses current code state |

## Architecture-Level Decision Trees

### Tree 1: When to Use Tinker

- **Start:** Deciding if Tinker is the right tool
- **Is the task a one-off data operation on local development?**
  - Yes → Tinker is appropriate. Use with caution (preview query before executing).
  - No → Continue.
- **Is the environment production?**
  - Yes → **Never use Tinker in production.** Use dedicated migration/seeder scripts or scheduled jobs. Tinker provides unrestricted data access.
  - No → Continue.
- **Is the task a complex multi-step data migration?**
  - Yes → Use dedicated migration scripts, not Tinker. Tinker sessions are stateless across evaluations and lack transaction safety.
  - No → Continue.
- **Is the task ad-hoc querying, prototyping, or debugging?**
  - Yes → Tinker is the ideal tool. Use PsySH commands (`doc`, `show`, `ls`) for code exploration.
  - No → Consider Artisan commands, dedicated scripts, or queue jobs instead.

### Tree 2: Query Safety Strategy

- **Start:** Executing data operations safely in Tinker
- **Is the operation destructive (delete, update, drop)?**
  - Yes → Continue.
  - No → Safe to execute directly with standard precautions.
- **Safety checklist:**
  1. Always `->get()` first to verify the query returns what you expect.
  2. Apply `->limit()` to prevent processing all records accidentally.
  3. Use `->where()` clauses explicitly. Never call `Model::delete()` without WHERE.
  4. Consider wrapping in a transaction if available.
- **Memory safety:** Always `->limit(10)` for large tables. `User::all()` on a 1M-row table causes memory exhaustion.
- **Relationship loading:** Use `->with('relationship')` to prevent N+1 queries during exploration.

### Tree 3: Session Management and Automation

- **Start:** Choosing how to use Tinker
- **Is the operation interactive exploration?**
  - Yes → Start Tinker shell (`php artisan tinker`). Use PsySH commands for code navigation. Multi-line input supported.
  - No → Continue.
- **Is the operation a single expression for automated execution?**
  - Yes → Use `php artisan tinker --execute="User::count()"`. Runs once and exits. Suitable for automated or CI scripts.
  - No → Continue.
- **Session state understanding:**
  - Tinker evaluates each line independently. No state shared between evaluations in `--execute` mode.
  - For multi-line operations, use heredoc or multi-line string in `--execute`.
  - Restart Tinker (`exit` and re-enter) after changing PHP files to pick up new code.
- **Facade imports:** Import facades at session start: `use Illuminate\Support\Facades\Cache;`. Facade autoloading is not active by default.

### Tree 4: Tinker Configuration and Security

- **Start:** Configuring Tinker for the team
- **Is Tinker installed in `require-dev` only?**
  - Yes → Correct. Verify `composer.json` has `"laravel/tinker": "^2.0"` in `require-dev`.
  - No → Move to `require-dev`. Tinker should never be available in production.
- **Are there commands that should be restricted?**
  - Yes → Configure `config/tinker.php` with `commands.whitelist` or `commands.blacklist`. Lock down destructive operations if Tinker is accessible in non-local environments.
  - No → Default configuration is fine for local development.
- **Pre-loading helpers:** Use `config/tinker.php` `shell.include` to auto-load custom helper functions on startup.
