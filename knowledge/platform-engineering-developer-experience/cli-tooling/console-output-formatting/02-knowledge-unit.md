# Knowledge Unit: Console Output Formatting

## Metadata
- **Subdomain:** CLI Tooling & Artisan Extensions
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** cli-tooling-artisan-extensions/console-output-formatting
- **Maturity:** Mature
- **Related Technologies:** Laravel Artisan, Symfony Console, PHP

## Executive Summary

Laravel provides a rich set of console output formatting tools through the `$this->output` property and helper methods on the Command class. These include styled text (info, comment, question, error, warning, alert), progress bars (`$this->output->createProgressBar()`), tables (`$this->table()`), bulleted lists, and structured output (`--json` flag support via `$this->output->writeln()`). The underlying Symfony Console component handles terminal detection, width/height discovery, color support, and formatting. Laravel extends Symfony with higher-level helper methods (`$this->info()`, `$this->confirm()`, `$this->choice()`) and supports output for both human-readable (`OutputInterface::VERBOSITY_NORMAL`) and machine-parseable formats (`OutputInterface::VERBOSITY_VERBOSE`).

## Core Concepts

- **Output Styles:** `$this->info('message')` (green), `$this->error('message')` (red), `$this->warn('message')` (yellow), `$this->comment('message')` (orange), `$this->alert('message')` (full-width red box)
- **Progress Bars:** `$this->output->createProgressBar($total)` displays a progress bar with percentage, elapsed time, and estimated remaining time
- **Tables:** `$this->table(['Header1', 'Header2'], [['row1col1', 'row1col2']])` renders formatted ASCII tables
- **Bullet Lists:** `$this->bulletList(['item1', 'item2'])` renders indented lists with bullet markers
- **Ask/Choice Output:** `$this->ask()` and `$this->choice()` render formatted questions with options and highlight selected values
- **Write Methods:** `$this->line('text')` (unstyled), `$this->output->writeln('text')` (raw), `$this->newLine($count)` (blank lines)
- **Output Verbosity:** Levels: VERBOSITY_QUIET, VERBOSITY_NORMAL, VERBOSITY_VERBOSE, VERBOSITY_VERY_VERBOSE, VERBOSITY_DEBUG

## Mental Models

- **Output as UI Framework:** Console output formatting is like a UI framework for the terminal—each method provides a different widget (progress bar, table, alert box)
- **Verbosity as Log Levels:** Output verbosity mirrors log levels—normal for standard output, verbose for details, debug for implementation traces
- **Formatting as Communication:** Colors and formatting encode meaning: red for errors, green for success, yellow for warnings, making the terminal speak to the developer at a glance

## Internal Mechanics

1. **Output Resolver:** Laravel's `Command::output()` returns the `SymfonyStyle` instance (which extends `Symfony\Component\Console\Style\SymfonyStyle`), wrapping the `OutputInterface` with formatting helpers
2. **Format Tag Parsing:** Symfony Console parses `<info>text</info>` tags using an `OutputFormatter` that matches tags to styles; nested tags are supported but limited
3. **Terminal Detection:** On construction, Symfony detects terminal width (via `tput cols`, `stty size`, or `COLUMNS` env var) and color support (via `NO_COLOR`, `TERM`, `COLORTERM` env vars)
4. **Progress Bar Rendering:** ProgressBar redraws the current line with updated ticks/percentage on each `->advance()` call, using carriage return (`\r`) to overwrite the previous render
5. **Table Rendering:** Table uses `Symfony\Component\Console\Helper\Table` to calculate column widths based on content and terminal width, wrapping text as needed

## Patterns

- **Structured Output Pattern:** Support `--json` and `--format` flags that switch between human-readable and machine-parseable output using `$this->option('json') ? $this->line(json_encode($data)) : $this->table(...)`
- **Verbose Mode Pattern:** Use `$this->output->writeln('details', OutputInterface::VERBOSITY_VERBOSE)` for debug details that only appear with `-v` or `-vv`
- **Progress Callback Pattern:** Wrap iterable processing with progress bar: `$bar = $this->output->createProgressBar(count($items)); foreach ($items as $item) { process($item); $bar->advance(); } $bar->finish();`
- **Sectioned Output Pattern:** Use `$this->output->section()` to create named output sections for independent updates (e.g., one section for progress, one for log messages)
- **Color-Aware Output Pattern:** Use `$this->output->isDecorated()` to check color support before using raw ANSI codes; fall back to plain text in non-decorated terminals

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Output helper vs raw writeln | `$this->info()` vs `$this->output->writeln('<info>...</info>')` | Use helper methods when they match the semantic meaning; use raw tags for custom formatting |
| Table vs structured output | `$this->table()` vs JSON vs CSV | Table for human display; JSON for programmatic consumers; CSV for spreadsheet import |
| Progress bar vs spinner | ProgressBar for known counts; spinner for indeterminate waits | Use progress bar when count is known; spinner for network calls or indeterminate operations |
| Default verbosity | QUIET vs NORMAL vs VERBOSE | NORMAL for standard CLI usage; QUIET for cron/scheduled tasks; VERBOSE for CI |

## Tradeoffs

- **Human vs Machine Readable:** Formatted tables are excellent for humans but painful to parse programmatically. Support both with a `--json` flag that switches to structured output.
- **Color vs Portability:** ANSI colors look great on modern terminals but cause garbled output in log files, CI artifacts, and non-ANSI terminals. Use `--ansi`/`--no-ansi` flags and auto-detection.
- **Progress Bar Accuracy vs Overhead:** Updating the progress bar on every iteration adds microsecond overhead per item. For millions of items, update every 100 or 1000 iterations to reduce overhead.
- **Rich Formatting vs Speed:** Complex table rendering with auto-wrapping and alignment can take milliseconds for large datasets. For huge datasets, stream output row by row or use pagination.

## Performance Considerations

- **Progress Bar Overhead:** Each `$bar->advance()` triggers a terminal write. For loops with 100k+ iterations, this adds significant overhead. Use `$bar->setMaxSteps()` and advance in batches.
- **Table Rendering for Large Datasets:** `$this->table()` renders the entire table at once, reading all rows into memory. For 10k+ rows, memory usage spikes. Use `$this->output->writeln()` with manual formatting for streaming.
- **Terminal Width Detection:** On each `schedule:run` or command invocation, Symfony attempts to detect terminal width. In cron/background contexts where no terminal is attached, this detection fails gracefully and defaults to a fixed width.
- **Output Buffer Flush:** By default, output is buffered. For long-running commands that should show real-time progress, call `$this->output->write('')` with `OutputInterface::VERBOSITY_NORMAL` to flush the buffer.

## Production Considerations

- **Log File Output:** In production logs, color tags appear as raw strings (`<info>...</info>`). Strip tags or disable decoration in production output using `$this->output->setDecorated(false)`.
- **CI and Headless Environments:** In CI environments (GitHub Actions, GitLab CI), output formatting has different color support. Use the `CI` environment variable to detect CI contexts and adjust formatting.
- **Output Truncation:** Extremely long output lines (e.g., dumping a large array) can flood log files and cause performance issues. Implement `--max-output` limits for verbose commands.
- **Sensitive Data in Output:** Never output passwords, API keys, or tokens in command output, even in debug mode. Use `$this->secret()` for input and strip sensitive data from output.

## Common Mistakes

- **Mixing output methods inconsistently:** Using `$this->info()` in some places and `echo` in others; `echo` bypasses Symfony's formatting and verbosity control
- **Progress bar without finishing:** Calling `->advance()` but never `->finish()` leaves the progress bar in an incomplete visual state
- **Table column overflow:** Not accounting for wide content that breaks table layout; use `$table->setColumnWidth()` for predictable rendering
- **Assuming color support:** Hard-coding ANSI codes without checking `$this->output->isDecorated()`; output becomes garbled in non-ANSI environments
- **Outputting too much in quiet mode:** Writing verbose debug information with `$this->line()` instead of `$this->output->writeln('...', OutputInterface::VERBOSITY_DEBUG)`

## Failure Modes

- **Progress Bar Visual Corruption:** When logging between progress bar updates, the progress bar line gets overwritten. Mitigate: use `$this->output->section()` to dedicate a section to the progress bar.
- **Table Width Exhaustion:** Terminal width auto-detection fails in non-interactive environments, defaulting to a width that's too narrow for table content. Mitigate: set explicit `--width` option or `$table->setColumnWidth()`.
- **Encoding Issues:** Non-UTF8 characters in output cause garbled display in some terminals. Mitigate: ensure all output is UTF-8 encoded; use `mb_convert_encoding()` for legacy data.
- **Memory Exhaustion with Table:** Rendering a table with 100k rows consumes memory proportional to total content size. Mitigate: paginate output or stream rows.

## Ecosystem Usage

- **Laravel Installer:** Uses progress bars for project creation, table formatting for available stacks, and color-coded success/error messages
- **Laravel Nova:** Artisan commands use formatted tables for displaying resource information and progress bars for resource creation
- **Blueprint:** Blueprint uses progress bars for code generation phases and formatted tables for summarizing generated files
- **Spatie Packages:** Spatie's packages consistently use `$this->info()`, `$this->error()`, and table output for structured command results

## Related Knowledge Units

- interactive-commands
- custom-artisan-command-patterns
- artisan-command-signatures-arguments

## Research Notes

- The `SymfonyStyle` class (wrapping `OutputInterface`) was introduced in Symfony 3.2 and adopted by Laravel 5.5+; it provides the high-level `info()`, `warning()`, `table()` helpers
- Progress bars in Symfony support multiple formats (normal, verbose, very verbose, debug) and custom format strings via `$bar->setFormat()`
- Terminal width detection follows a priority chain: `COLUMNS` env var (Docker/CI) > `tput cols` > `stty size` > fallback (default 80)
- The `NO_COLOR` environment variable is respected by Symfony Console 6+ for signaling no ANSI color output, following the no-color.org convention
