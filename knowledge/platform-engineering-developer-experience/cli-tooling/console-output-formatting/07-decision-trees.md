# Decision Trees: Console Output Formatting

## Metadata
- **KU ID:** cli-tooling-artisan-extensions/console-output-formatting
- **Subdomain:** cli-tooling-artisan-extensions
- **Domain:** platform-engineering-developer-experience
- **Phase:** 4 (Experience Curation)
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Output format | Styled helpers / Table / Progress bar / JSON | Human-readable vs machine-parseable output |
| 2 | Verbosity level | QUIET / NORMAL / VERBOSE / DEBUG | Detail control for different execution contexts |
| 3 | Progress indication | Progress bar / Section spinner / Batch update / None | User feedback for long-running operations |
| 4 | Machine-parsable output | `--json` / Plain text / Table with `--no-ansi` | Integration with CI, automation, and other tools |
| 5 | Terminal support | ANSI colors / No ANSI / Auto-detect | Environment-aware formatting (CI, cron, TTY) |

## Architecture-Level Decision Trees

### Tree 1: Output Format Selection

- **Start:** Deciding how to present command output
- **Is the command output consumed by another program or CI?**
  - Yes → Support `--json` flag. Output structured JSON. Avoid styled text, tables, and progress bars that are hard to parse.
  - No → Continue.
- **Is the command displaying structured data (list of items, records)?**
  - Yes → Use `$this->table()`. Clearly formatted ASCII table with headers and rows.
  - No → Continue.
- **Is the command processing many items (long-running)?**
  - Yes → Use progress bar (`createProgressBar`). Show percentage, elapsed time, and ETA.
  - No → Continue.
- **Default:** Use styled output helpers: `info()` for success, `error()` for failures, `warn()` for warnings, `comment()` for prompts, `alert()` for critical notifications.

### Tree 2: Verbosity Level Strategy

- **Start:** Controlling output detail
- **Is the command running interactively in a terminal?**
  - Yes → Default to NORMAL verbosity. Show essential info, progress bars, and results.
  - No → Continue.
- **Is the command running in CI or cron?**
  - Yes → Default to QUIET or NORMAL. Suppress progress bars (they produce garbled output in logs). Use `--json` or plain text.
  - No → Continue.
- **Verbosity level convention:**
  - QUIET: No output (except errors). Use for cron/scheduled tasks.
  - NORMAL: Essential output. Status messages, summaries, results.
  - VERBOSE (`-v`): Detailed progress. Step-by-step breakdown of what's happening.
  - DEBUG (`-vvv`): Debug information. Dump intermediate values, timing, config.
- **Implementation:** Check `$this->output->isVerbose()` or `$this->option('verbose')` to gate debug output.

### Tree 3: Progress Bar Usage

- **Start:** Deciding how to show progress
- **Does the task iterate over a known number of items?**
  - Yes → Use progress bar: `$this->output->createProgressBar($count)`. Call `$bar->advance()` in loop. Always call `$bar->finish()`.
  - No → Use indeterminate spinner or section-based output.
- **Item count considerations:**
  - <100 items → Progress bar with per-item updates. Smooth visual.
  - 100-10,000 → Batch advances (every 10 or 100 items). Avoids terminal write overhead.
  - 10,000+ → Batch updates only. Terminal writes per item will slow execution.
- **Progress bar lifecycle:**
  1. `$bar->start()` → display initial 0%.
  2. `$bar->advance()` → increment by 1.
  3. `$bar->setProgress($n)` → set to specific count.
  4. `$bar->finish()` → set to 100% and clean up.
  5. `$this->newLine(2)` → move past progress bar for subsequent output.

### Tree 4: Multi-Format Output Support

- **Start:** Supporting both human-readable and machine-readable output
- **Does the command need to output to both humans and automation?**
  - Yes → Implement dual output mode: styled output by default + `--json` flag for programmatic consumers.
  - No → Single format is sufficient.
- **Implementation pattern:**
  ```php
  if ($this->option('json')) {
      $this->line(json_encode($data));
  } else {
      $this->table(['Name', 'Email'], $rows);
  }
  ```
- **ANSI support detection:** Use `$this->output->isDecorated()` before raw ANSI codes. In CI, `CI` env var is typically set. Support `--no-ansi` flag for environments that strip formatting.
- **Log output:** Never write ANSI codes to log files. Use `--no-ansi` or strip formatting before logging.
