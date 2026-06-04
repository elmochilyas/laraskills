# Skill: Use Laravel Tinker REPL for Development

## Purpose
Interact with a fully bootstrapped Laravel application in a REPL environment for ad-hoc queries, prototyping, debugging, and one-off data corrections.

## When To Use
- Ad-hoc database queries and Eloquent relationship testing during development
- Prototyping new code patterns, service interactions, or helper functions
- Debugging variable states, method return values, and configuration resolution
- One-off data corrections (with caution: bypasses some model events)
- Testing Artisan command output or behavior interactively

## When NOT To Use
- Production environments — never run Tinker on production servers
- Complex multi-step data migrations (use dedicated migration/seeder scripts)
- Operations requiring transaction safety (Tinker sessions are stateless across evaluations)
- When file changes need immediate reflection (restart Tinker to pick up new code)
- Automated or CI tasks (use `Artisan::call()` programmatically instead)

## Prerequisites
- Laravel Tinker installed (`composer require laravel/tinker --dev`)
- PHP 8.0+ with readline extension
- Understanding of PsySH commands (`doc`, `show`, `ls`, `trace`)

## Inputs
- PHP expressions to evaluate
- Eloquent queries to test
- Service class methods to call
- Configuration values to inspect

## Workflow
1. Start Tinker with `php artisan tinker`
2. Run queries with limits: `User::limit(10)->get()` (avoid `::all()` memory exhaustion)
3. Eager load relationships with `User::with('posts')->limit(10)->get()`
4. Use `doc Eloquent::method` for inline documentation lookup
5. Use `show ClassName` to inspect class source code
6. Test with `->get()` before calling `->delete()` or `->update()` to verify query
7. Import facades once with `use` statements at session start
8. Evaluate code incrementally, checking variable states with `dd()` or dump
9. Restart Tinker after making file changes to pick up modifications
10. Exit with `Ctrl+D` or `exit`

## Validation Checklist
- [ ] Result sets limited (no `::all()`, `limit(10)` used)
- [ ] Relationships eager loaded to prevent N+1 queries
- [ ] Queries verified with `->get()` before destructive operations
- [ ] Tinker is in `require-dev` only, not production
- [ ] `config/tinker.php` configured with command whitelist/blacklist if needed
- [ ] Tinker never run on production servers
- [ ] PsySH commands (`doc`, `show`, `ls`) used for exploration
- [ ] Tinker restarted after file changes

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Memory exhausted | `::all()` on large table | Use `limit(10)` and `chunk()` for large datasets |
| N+1 queries during exploration | No eager loading | Use `with('relation')` on queries |
| Destructive query destroys data | No verification | `->get()` first, verify, then `->delete()`/`->update()` |
| Code changes not reflected | Tinker cached old code | Exit and re-enter Tinker |
| Facade not found | No import | `use Illuminate\Support\Facades\...` at session start |
| Tinker installed in production | Security risk | Ensure `require-dev` only; check composer.json |

## Decision Points
- **Query verification:** `->get()` before modifications vs using transactions
- **Facade usage:** Ad-hoc import vs pre-loaded aliases in `tinker.php`
- **Result limiting:** `limit()` vs `chunk()` vs cursor() for large datasets
- **Command restrictions:** Whitelist vs blacklist in `config/tinker.php`

## Performance/Security Considerations
- **Tinker must NEVER be installed in production** — equivalent to root shell access
- Use `config/tinker.php` to restrict commands and add aliases
- One-off data corrections bypass model events (booted traits, observers, casts)
- Large queries can exhaust memory; always limit result sets
- Tinker sessions are stateless (no transaction across evaluations); use transactions manually
- Never expose Tinker access in any environment accessible to unauthorized users

## Related Rules
- TINKER-RULE-001 through TINKER-RULE-011

## Related Skills
- Build Interactive Commands
- Create Custom Artisan Commands
- Optimize Database Queries
- Debug with Laravel Debugbar

## Success Criteria
- Tinker is used regularly for prototyping and ad-hoc queries during development
- No Tinker access in production environments
- All queries in Tinker use appropriate limits and eager loading
- Team understands the limitations (no transaction safety, bypasses events)
- PsySH commands (`doc`, `show`) are used for documentation and source exploration
