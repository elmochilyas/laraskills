# Knowledge Unit: Interactive Commands

## Metadata
- **Subdomain:** CLI Tooling & Artisan Extensions
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** cli-tooling-artisan-extensions/interactive-commands
- **Maturity:** Mature
- **Related Technologies:** Laravel Artisan, Symfony Console, PHP

## Executive Summary

Interactive Artisan commands use prompts to collect user input dynamically during command execution, enabling complex data entry, confirmation dialogs, and multi-step workflows without requiring all input upfront via arguments. Laravel provides `$this->ask()`, `$this->secret()`, `$this->confirm()`, `$this->choice()`, `$this->anticipate()`, and `$this->autocomplete()` methods for gathering input with validation, as well as `$this->output->progressAdvance()` for progress feedback. Interactive commands are ideal for setup scripts, database seeding with user input, deployment confirmations, and commands that mimic wizards. The `$this->askWithCompletion()` method provides tab-completion hints based on predefined options or dynamic callbacks. All interactive methods respect the `--no-interaction` flag, automatically using defaults or skipping prompts when the command runs in non-interactive (CI/cron) contexts.

## Core Concepts

- **Input Prompts:** `$this->ask('Question')` returns a string; `$this->secret('Password')` hides input; `$this->confirm('Continue?')` returns boolean
- **Selection Prompts:** `$this->choice('Pick one', ['a', 'b', 'c'], $default)` returns a single selection; `$this->choice('Pick', [...], null, null, true)` returns multiple selections
- **Tab Completion:** `$this->anticipate('Name', ['Alice', 'Bob'])` suggests options but allows free text; `$this->askWithCompletion('Name', [...])` provides tab-completion
- **Non-Interaction Mode:** When `--no-interaction` is passed, `$this->ask()` throws `RuntimeException`; use `$this->ask('Question', $default)` to provide fallback defaults
- **Validation:** Inline validation via `$this->ask('Email', null, function($value) { if (!filter_var($value, FILTER_VALIDATE_EMAIL)) throw new \Exception('Invalid email'); return $value; })`

## Mental Models

- **Interactive as Wizard:** Interactive commands act like installation wizards—each step collects input, validates it, and proceeds to the next step
- **Prompt as Form Field:** Each prompt is equivalent to a form field: label, input, validation, error feedback, and progression
- **Non-Interaction as Defaults:** The `--no-interaction` flag forces commands to use defaults, treating the command as if all inputs were provided via arguments

## Internal Mechanics

1. **Question Helper Invocation:** `$this->ask()` calls Symfony's `QuestionHelper::ask()`, which creates a `Question` object, renders it to the terminal, reads input via `stream_get_line(STDIN)`, and returns the validated result
2. **Hidden Input:** `$this->secret()` uses Symfony's `Question::setHidden(true)`, which attempts to hide input using `stty -echo` (Unix) or `wincmd` (Windows); falls back to explicit prompt if stty is unavailable
3. **Choice Rendering:** `$this->choice()` uses Symfony's `ChoiceQuestion`, which renders a numbered list with arrow-key navigation or allows typed selection by key/index
4. **Auto-Completion:** `$this->anticipate()` creates a `Question` with `setAutocompleterCallback()` or `setAutocompleterValues()`, using `readline` extension for tab-completion when available
5. **Non-Interaction Detection:** Before each prompt, Symfony checks `InputInterface::isInteractive()`; if false, `ask()` throws `RuntimeException` unless a default is set

## Patterns

- **Wizard Pattern:** Chain multiple prompts to guide the user through a multi-step process: project setup, configuration, or data entry
- **Conditional Prompt Pattern:** Show follow-up prompts based on previous answers: `if ($this->confirm('Send notifications?')) { $email = $this->ask('Email address:'); }`
- **Default-Driven Pattern:** Provide sensible defaults for all prompts: `$this->ask('App name', 'My App')` so `--no-interaction` works seamlessly
- **Validation with Feedback Pattern:** Use inline validation with clear error messages; loop until valid input (like a form with server-side validation)
- **Batch Input Pattern:** Use `$this->ask()` in a loop for collecting lists of items, with an empty input signaling completion
- **Progress Indication Pattern:** Show a spinner (`$this->output->writeln('<fg=yellow>Processing...</>')`) or progress bar during long operations between prompts
- **Table Confirmation Pattern:** Display a summary table of collected input before executing: `$this->table(['Field', 'Value'], $inputSummary); $this->confirm('Proceed?')`

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Prompt type | Choice vs Confirm vs Ask | Choice for bounded options; Confirm for yes/no; Ask for open-ended text |
| Validation location | Inline callback vs post-collection validation | Inline for immediate feedback; post-collection for cross-field validation |
| Non-interaction behavior | Throw vs use default vs skip | Use defaults for setup commands; throw for required input; skip for optional input |
| Multi-select | Multiple choice() calls vs single multi-choice | Single multi-choice for related options; multiple calls for sequence-dependent selections |

## Tradeoffs

- **Interactivity vs Automation:** Interactive prompts provide great UX for manual use but break automation. Always support `--no-interaction` with defaults. Design commands so interactive input is optional—all data should be expressible via arguments/options.
- **Rich Prompts vs Portability:** Arrow-key selection (`choice()`) works on modern terminals but may fail in CI logs, SSH pipes, or `script` sessions. Provide fallback to numbered/text input.
- **Convenience vs Testability:** Interactive prompts are hard to test. Extract prompting logic into methods that accept `InputInterface` or use `$this->artisan()` with input arrays to simulate non-interactive execution.

## Performance Considerations

- **Input Waiting Time:** Interactive commands pause execution while waiting for user input. This is intentional but can cause confusion in automated contexts. Always detect `--no-interaction` early.
- **Readline Extension Overhead:** If the `readline` PHP extension is loaded, `ask()` uses it for line editing features, adding minimal overhead (~0.1ms per prompt).
- **Terminal Echo Toggle:** `stty -echo`/`stty echo` toggles for `$this->secret()` involve shell command execution (~5-10ms). This is negligible for interactive use.

## Production Considerations

- **Non-Interactive Environments:** Scheduled commands, CI pipelines, and deployment hooks never run interactively. Every interactive command must have a non-interactive mode with sensible defaults or argument-driven input.
- **Sensitive Input Handling:** `$this->secret()` hides input from the terminal but the value is still in memory. Clear secrets after use and never log them.
- **Input Encoding:** User input from the terminal may have varying encoding (UTF-8, Latin-1). Normalize encoding to UTF-8 for consistent processing.
- **Timeout in Automated Contexts:** If a command mistakenly runs interactively in CI, it will hang indefinitely waiting for input. Implement command-level timeouts or CI-level `timeout` minutes.

## Common Mistakes

- **Not providing defaults:** Using `$this->ask('Name')` without a default; when `--no-interaction` is passed, it throws a `RuntimeException` that crashes the command
- **Asking questions in commands that run on schedule:** A command registered in the scheduler calls `$this->confirm()` which hangs in the cron context; all scheduled commands must be non-interactive
- **Not handling Ctrl+C:** Interactive commands don't catch SIGINT by default; pressing Ctrl+C terminates the process. Use `pcntl_signal()` for cleanup if needed
- **Assuming terminal capabilities:** Using `choice()` (which requires arrow key support) in a `script` session or SSH pipe where arrow keys aren't forwarded; provide alternative input methods
- **Over-prompting:** Asking too many questions overwhelms users. Limit interactive commands to 5-7 prompts. For complex input, use configuration files passed via argument.

## Failure Modes

- **Hanging in CI:** An interactive command runs in CI (non-interactive) without `--no-interaction` detection; it hangs indefinitely waiting for input. Mitigate: always provide defaults and detect `$this->input->isInteractive()`.
- **Input Truncation:** Very long input lines (URLs, long tokens) may be truncated by terminal line buffers. Mitigate: use file-based input for long data.
- **Encoding Garbling:** Special characters (Unicode, emoji) in terminal input may arrive garbled. Mitigate: validate encoding and reject non-UTF-8 input.
- **stty Failure:** `$this->secret()` fails to hide input on systems without `stty` or with restricted shell environments. Mitigate: catch stty errors and warn the user.

## Ecosystem Usage

- **Laravel Installer:** The `laravel new` command uses interactive prompts for project name, starter kit selection (Breeze/Jetstream), and testing framework choice
- **Laravel Breeze/Jetstream:** Installation commands prompt for stack choice (Blade with Alpine, Livewire, React, Vue) and authentication features
- **Blueprint:** Blueprint's `blueprint:build` command can run interactively, asking for model definitions when no YAML file is provided
- **Spatie Packages:** Spatie's `laravel-permission` setup command interactively prompts for configuration choices (cache clearing, default guard)

## Related Knowledge Units

- artisan-command-signatures-arguments
- console-output-formatting
- custom-artisan-command-patterns
- cli-workflow-automation

## Research Notes

- The interactive question system is built on Symfony's `QuestionHelper`, which provides the `Question`, `ChoiceQuestion`, and `ConfirmationQuestion` classes
- Laravel wraps Symfony's question objects with additional formatting and validation: `$this->ask()` adds `>> ` prefix and `<question>` styling
- Multi-select for `choice()` (the `$multiple` parameter) was added in Laravel 8.x, using Symfony's `ChoiceQuestion::setMultiselect(true)`
- The `$this->validate()` method in earlier Laravel versions for command input validation was replaced by inline validation callbacks in the question methods
