# 04-Standardized Knowledge: Console Output Formatting

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | cli-tooling-artisan-extensions |
| **Knowledge Unit** | console-output-formatting |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | interactive-commands, custom-artisan-command-patterns, artisan-command-signatures-arguments |
| **Framework/Language** | Laravel Artisan, Symfony Console, PHP |

## Overview

Laravel provides console output formatting via `$this->output` and helper methods: styled text (`info`, `error`, `warn`, `comment`, `alert`), progress bars (`createProgressBar()`), tables (`$this->table()`), bullet lists, and structured output. The Symfony Console component handles terminal detection, color support, and formatting. Output verbosity levels (QUIET, NORMAL, VERBOSE, DEBUG) control detail for different contexts (CI, cron, interactive).

## Core Concepts

- **Styled Output**: `info()` (green), `error()` (red), `warn()` (yellow), `comment()` (orange), `alert()` (full-width red box)
- **Progress Bars**: `$this->output->createProgressBar($total)` with percentage, elapsed, ETA
- **Tables**: `$this->table(['Header'], [['row']])` renders formatted ASCII tables
- **Verbosity Levels**: QUIET (silent), NORMAL (default), VERBOSE (`-v`), VERY_VERBOSE (`-vv`), DEBUG (`-vvv`)
- **Raw Output**: `$this->output->writeln('text')`, `$this->line('text')`, `$this->newLine($n)`
- **Format Tags**: `<info>text</info>`, `<error>text</error>`, `<fg=red>text</>`, `<bg=green>text</>`

## When to Use

- Human-readable command output that explains what happened clearly
- Progress indication for long-running commands (data processing, batch jobs)
- Structured data display (tables) for list-style commands
- Machine-parseable output (`--json` flag) for CI/tool integration
- Color-coded status: green for success, red for errors, yellow for warnings

## When NOT to Use

- Piped output that another program consumes (use plain text or `--json` format)
- Log file output where ANSI codes cause garbled text
- Very large datasets (use streaming output instead of buffered tables)
- Performance-critical loops with millions of iterations (batched progress updates)

## Best Practices (WHY)

- **Support `--json`**: provide structured output alongside formatted output for programmatic consumers
- **Use verbosity levels**: debug details go to VERBOSE/DEBUG levels, not NORMAL
- **Check color support**: use `$this->output->isDecorated()` before raw ANSI codes
- **Always finish progress bars**: call `$bar->finish()` after completion to clean up the display
- **Section isolation**: use `$this->output->section()` for independent output areas (log + progress bar)

## Architecture Guidelines

- Use helper methods (`$this->info()`) instead of `echo` to ensure formatting and verbosity control
- Detect CI environment (`CI` env var) to adjust formatting for headless contexts
- Implement `--quiet` flag that switches to QUIET verbosity for cron/scheduled tasks
- Never output sensitive data even in DEBUG verbosity

## Performance Considerations

- Progress bar updates trigger terminal writes — batch advances for loops with 100k+ iterations
- `$this->table()` renders entire table in memory — use streaming for 10k+ rows
- Terminal width detection fails gracefully in cron/non-TTY environments, defaulting to 80 chars
- Output is buffered by default — flush explicitly for real-time progress in long-running commands

## Security Considerations

- Strip ANSI tags or disable decoration for production log output
- Never output passwords, tokens, or API keys in any verbosity level
- Implement `--max-output` limits to prevent log flooding
- Sanitize user-provided data before displaying in output

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Mixing `echo` with helpers | Using `echo` bypasses verbosity control | Unfamiliar with helpers | Output appears in quiet mode | Always use `$this->output->writeln()` |
| Unfinished progress bars | Calling `advance()` but not `finish()` | Forgetting finalization | Incomplete visual state | Always call `$bar->finish()` |
| Assuming ANSI support | Hard-coding color codes | Not checking `isDecorated()` | Garbled output in logs/CI | Check `isDecorated()` or use `--no-ansi` |
| Verbose output in quiet mode | Using `$this->line()` for debug info | Not understanding verbosity | CI logs flooded | Use `OutputInterface::VERBOSITY_DEBUG` |
| Table memory exhaustion | Large tables in `$this->table()` | Not considering memory | OOM for 10k+ rows | Stream rows or paginate |

## Anti-Patterns

- **Progress Bar in Log Output**: updating progress bar while also logging to same stream creates visual corruption
- **Console Dump of Large Objects**: `dd()` or `dump()` in commands meant for automation
- **Over-Formatted Output**: too many colors and styles make output harder to read
- **Sensitive Info in Debug**: printing environment variables, config, or secrets in verbose mode
- **Platform-Specific Formatting**: using Windows-only or Unix-only escape sequences

## Examples

```php
public function handle(): int
{
    $users = User::where('active', false)->get();
    $bar = $this->output->createProgressBar(count($users));
    $bar->start();

    foreach ($users as $user) {
        $this->deactivateUser($user);
        $bar->advance();
    }

    $bar->finish();
    $this->newLine(2);
    $this->table(
        ['Email', 'Status'],
        $users->map(fn($u) => [$u->email, $u->status])->toArray()
    );

    if ($this->option('json')) {
        $this->line(json_encode($users->toArray()));
    }

    return Command::SUCCESS;
}
```

## Related Topics

- custom-artisan-command-patterns — command structure and registration
- artisan-command-signatures-arguments — defining input specifications
- interactive-commands — prompts, confirmations, choices

## AI Agent Notes

- Output helpers are wrappers over Symfony's `SymfonyStyle` — they control styling, not content structure
- For JSON output, use `$this->line(json_encode(...))` to ensure no styling interferes
- Progress bars use carriage return (`\r`) to overwrite — never interleave with other output without sections
- When generating commands, default to supporting `--json` and `--quiet` flags

## Verification

- [ ] `$this->info()` renders green text in supporting terminals
- [ ] Progress bar advances and completes with `->finish()`
- [ ] Tables render with correct column alignment for given data width
- [ ] `--quiet` suppresses all non-error output
- [ ] `-v`/`-vv` reveals verbose/debug output
- [ ] `--json` produces valid parseable JSON
- [ ] No ANSI codes in log file output
- [ ] No sensitive data leaked in any verbosity mode
