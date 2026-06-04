# Skill: Format Console Output in Artisan Commands

## Purpose
Provide clear, structured, and user-friendly console output with styled text, progress bars, tables, and verbosity levels appropriate for human readers and programmatic consumers.

## When To Use
- Human-readable command output that explains what happened clearly
- Progress indication for long-running commands (data processing, batch jobs)
- Structured data display (tables) for list-style commands
- Machine-parseable output (`--json` flag) for CI/tool integration
- Color-coded status: green for success, red for errors, yellow for warnings

## When NOT To Use
- Piped output that another program consumes (use plain text or `--json` format)
- Log file output where ANSI codes cause garbled text
- Very large datasets (use streaming output instead of buffered tables)
- Performance-critical loops with millions of iterations (batched progress updates)

## Prerequisites
- Artisan command extending `Illuminate\Console\Command`
- Understanding of Symfony Console output helpers (info, error, table, progress bar)

## Inputs
- Command logic producing output messages
- Data to display (arrays for tables, totals for progress bars)
- Output context (human terminal, CI, piped, cron)

## Workflow
1. Use `$this->info()` for success messages, `$this->error()` for failures, `$this->warn()` for warnings
2. Use `$this->alert()` for critical notices requiring attention
3. Use `$this->table(['Headers'], [['rows']])` for structured data display
4. Use progress bars for long-running operations with `$this->output->createProgressBar($total)`
5. Call `$bar->finish()` after completion to clean up progress bar display
6. Use `$this->output->section()` for independent output areas (log + progress bar)
7. Support `--json` flag for programmatic output consumers
8. Use verbosity levels: NORMAL for summary, VERBOSE for details, DEBUG for diagnostics
9. Detect CI environment and adjust formatting for headless/headless contexts
10. Check `$this->output->isDecorated()` before using raw ANSI codes

## Validation Checklist
- [ ] `$this->info()`, `$this->error()`, `$this->warn()` used instead of `echo`
- [ ] Tables used for structured data display
- [ ] Progress bars properly finished with `$bar->finish()`
- [ ] `--json` flag supported for programmatic consumers
- [ ] Verbosity levels correctly implemented (details at VERBOSE, not NORMAL)
- [ ] Output detects CI environment and adjusts formatting
- [ ] `--quiet` flag switches to QUIET verbosity for cron/scheduled tasks
- [ ] No sensitive data output even in DEBUG verbosity
- [ ] Color support checked before raw ANSI codes

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Garbled output in logs | ANSI codes in log files | Detect non-TTY output; strip ANSI codes |
| Progress bar never finishes | `$bar->finish()` not called | Always call `$bar->finish()` after loop |
| Too much output in normal mode | Debug info at NORMAL level | Use VERBOSE/DEBUG for diagnostic details |
| JSON and formatted output mixed | No format flag | Support `--json` that suppresses formatted output |
| Tables not aligned | Long content in cells | Truncate or wrap long values |
| Missing output in cron | No output at all | Log output to file; provide summary email |
| ANSI codes in piped output | Not checking decorated | Use `isDecorated()` check before raw ANSI |

## Decision Points
- **Output format:** Human-readable vs JSON vs plain text (use `--json` flag)
- **Verbosity defaults:** NORMAL for summary, VERBOSE for details, DEBUG for diagnostics
- **Progress bar vs spinner:** Progress bar for known total; spinner for unknown duration
- **Table vs list:** Tables for comparison; lists for simple enumeration

## Performance/Security Considerations
- Never output sensitive data even in DEBUG verbosity
- Large datasets should stream output rather than build one giant table
- Progress bars add overhead per iteration; batch updates for millions of items
- CI environment should default to appropriate verbosity (QUIET for cron, NORMAL for CI logs)
- JSON output must be valid and parseable; test with `jq` or similar tools

## Related Rules
- OUTPUT-RULE-001 through OUTPUT-RULE-011

## Related Skills
- Create Custom Artisan Commands
- Build Interactive Commands
- Define Command Signatures and Arguments
- Automate CLI Workflows

## Success Criteria
- All Artisan commands use styled helpers instead of `echo`
- `--json` flag returns valid JSON for programmatic consumers
- Progress bars display correctly and always finish
- Output is appropriate for context (verbose locally, quiet in cron, structured for piped)
- No sensitive data appears in any verbosity level
