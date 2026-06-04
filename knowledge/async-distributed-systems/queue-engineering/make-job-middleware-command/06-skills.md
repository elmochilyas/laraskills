# Skill: Scaffold Job Middleware with make:job-middleware

## Purpose
Use the `php artisan make:job-middleware` command to generate correctly structured job middleware classes in the standard location.

## When To Use
When creating any new custom job middleware. The command enforces correct namespace, interface signature, and directory structure.

## When NOT To Use
Trivial inline callbacks in `middleware()` that don't need a separate class; modifying existing middleware (manual edits instead of regeneration).

## Prerequisites
- Laravel 11+
- Understanding of job middleware pipeline pattern

## Inputs
- Middleware class name (e.g., `LogExecutionTime`, `RateLimitPerUser`)

## Workflow
1. Run: `php artisan make:job-middleware LogExecutionTime`
2. Verify file created at `app/Queue/Middleware/LogExecutionTime.php`
3. Open the generated class — it includes the `handle($job, $next)` stub
4. Implement the middleware logic inside `handle()`
5. Add the middleware to the job's `middleware()` method: `return [new LogExecutionTime]`

## Validation Checklist
- [ ] Command generated file in `app/Queue/Middleware/`
- [ ] Class has correct namespace `App\Queue\Middleware`
- [ ] `handle()` method has correct signature
- [ ] Directory auto-created if it didn't exist

## Common Failures
- Manually creating middleware — wrong namespace or interface signature
- Placing middleware outside `app/Queue/Middleware/` — reduces discoverability
- Regenerating with the same name — overwrites existing implementation

## Decision Points
- New middleware: always use the command
- Existing middleware edits: manual edit, don't regenerate

## Performance Considerations
- Command execution is sub-second — negligible
- Generated stub has no overhead

## Related Rules
- Rule 1: use-command-for-new-middleware
- Rule 2: keep-middleware-in-standard-location

## Related Skills
- Create Custom Job Middleware
- Add RateLimited Middleware to Jobs

## Success Criteria
Job middleware is created with correct namespace, structure, and location in seconds using the Artisan command.
