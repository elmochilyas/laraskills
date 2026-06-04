# Prune Command Skills

## Skill: Schedule and run pruning via the model:prune Artisan command

### Purpose
Use the `model:prune` Artisan command to discover and prune all models using `Prunable` or `MassPrunable` traits, either on all models or targeted via `--model`, with dry-run support via `--pretend`.

### When To Use
- Scheduled cleanup of stale data across all prunable models in the application
- Targeted pruning of specific models via `--model` flag in custom maintenance scripts
- Pre-deployment validation via `--pretend` to preview which records will be affected
- CI/CD pipeline checks to verify pruning behavior before production deployment
- Integration with monitoring — capturing prune output for observability and alerting

### When NOT To Use
- Without scheduling constraints — running every minute would cause overlapping prunes
- Using model discovery for single-model pruning in scripts — use `--model` for performance
- Running `model:prune` without testing with `--pretend` first in production
- Relying on the command for audit logging — it outputs to stdout; capture and store separately
- Using `model:prune` in a web request context — it's a CLI-only command

### Prerequisites
- Models with `Prunable` or `MassPrunable` traits and defined `prunable()` methods

### Inputs
- Optional `--model` flag (one or more class names)
- Optional `--pretend` flag for dry-run mode

### Workflow
1. Schedule `model:prune` in `Kernel::schedule()` with `->withoutOverlapping()`
2. Use `--model` in production to specify exact model classes (avoid discovery overhead)
3. Add `->sendOutputTo()` to capture prune output to a log file for audit trail
4. Add `->onFailure()` and `->then()` handlers for monitoring
5. Run `--pretend` in production before enabling any new prune schedule
6. Use separate schedule entries with different frequencies for models with different retention needs
7. Verify exit codes in CI/CD pipelines
8. Configure custom model paths in `config/prune.php` if models live outside `app/Models`

### Validation Checklist
- [ ] `model:prune` discovers and prunes all prunable models
- [ ] `--model=User` prunes only the User model
- [ ] `--model=User,Post` prunes both models
- [ ] `--pretend` outputs records but does NOT delete
- [ ] Non-prunable models are ignored by the command
- [ ] Schedule executes prune correctly via `Kernel::schedule()`
- [ ] `->withoutOverlapping()` prevents concurrent executions
- [ ] Custom model discovery paths work for models outside `app/Models`
- [ ] Exit code is 0 on success, non-zero on failure

### Common Failures
- Pruning without `--pretend` first in production — running blind can delete more than intended
- Missing `->withoutOverlapping()` — overlapping prune runs cause contention
- Forgetting to import traits — adding `Prunable` without defining `prunable()` results in zero records pruned
- Using `--model` with wrong namespace — `--model=User` resolves to `App\Models\User`; use full class name for others
- Not testing prune in CI — a change to `prunable()` that accidentally removes constraints is catastrophic
- Pruning the same model in multiple overlapping schedule entries

### Decision Points
- **Discovery or --model?** — Use `--model` in production for performance and precision; use discovery in development
- **One schedule entry or multiple?** — Use separate entries with different frequencies when models have different retention needs
- **http route or CLI?** — Always use CLI; never expose pruning via HTTP routes

### Performance Considerations
- Discovery overhead — scanning filesystem and loading models adds 100-500ms
- Use `--model` in production to skip discovery entirely
- Concurrent command execution — overlapping prunes cause contention; use `withoutOverlapping()`
- Memory leaks — model discovery may load large libraries; use `--model` to limit scope
- `--pretend` still executes the `prunable()` query — slow queries make pretend mode slow

### Security Considerations
- The `model:prune` command should only be executable from CLI — not from web routes
- `--pretend` output may reveal record IDs and query conditions — restrict log access
- Pruning bypasses authorization policies — ensure `prunable()` queries respect data access rules
- Command output may contain sensitive information
- Schedule the command as a non-privileged system user with minimal database permissions

### Related Rules
- [Prune-Command-Always-WithoutOverlapping](../prune-command/05-rules.md)
- [Prune-Command-Use-Model-In-Production](../prune-command/05-rules.md)
- [Prune-Command-Pretend-Before-Enabling](../prune-command/05-rules.md)
- [Prune-Command-Capture-Output-To-Log](../prune-command/05-rules.md)
- [Prune-Command-OnFailure-And-Then-Handlers](../prune-command/05-rules.md)
- [Prune-Command-Different-Frequencies](../prune-command/05-rules.md)
- [Prune-Command-Not-Exposed-Via-HTTP](../prune-command/05-rules.md)
- [Prune-Command-Configure-Discovery-Paths](../prune-command/05-rules.md)
- [Prune-Command-Monitor-Exit-Code](../prune-command/05-rules.md)
- [Prune-Command-Dedup-Schedule-Entries](../prune-command/05-rules.md)

### Related Skills
- Automatically prune old records per-record using the Prunable trait
- Automatically prune old records in bulk using MassPrunable

### Success Criteria
- `model:prune` discovers and prunes all eligible models (or specified via `--model`)
- `--pretend` mode shows intended records without deleting
- Schedule executes with `->withoutOverlapping()` — no concurrent runs
- Prune output is captured to a log file for audit trail
- `->onFailure()` and `->then()` handlers provide monitoring
- Separate schedule entries for models with different retention needs
- No schedule entry duplicates a model across multiple prune calls
- Custom discovery paths are configured for models outside `app/Models`
