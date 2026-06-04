# 04-Standardized Knowledge: Interactive Commands

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | cli-tooling-artisan-extensions |
| **Knowledge Unit** | interactive-commands |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | artisan-command-signatures-arguments, console-output-formatting, custom-artisan-command-patterns |
| **Framework/Language** | Laravel Artisan, Symfony Console, PHP |

## Overview

Interactive Artisan commands collect user input dynamically via prompts: `$this->ask()`, `$this->secret()`, `$this->confirm()`, `$this->choice()`, `$this->anticipate()`, and `$this->askWithCompletion()`. They enable setup wizards, confirmation dialogs, and multi-step workflows. All methods respect `--no-interaction`, using defaults or throwing when non-interactive. Inline validation callbacks provide immediate feedback. The system uses Symfony's QuestionHelper.

## Core Concepts

- **Input Prompts**: `ask()` returns string; `secret()` hides input; `confirm()` returns boolean
- **Selection Prompts**: `choice()` returns single selection (or multiple with `$multiple=true`)
- **Tab Completion**: `anticipate()` suggests options but allows free text
- **Non-Interaction**: `--no-interaction` flag causes `ask()` to throw `RuntimeException` unless a default is set
- **Inline Validation**: callback as third parameter validates and loops until valid
- **Conditional Prompts**: show follow-up prompts based on previous answers

## When to Use

- Setup commands (installers, configuration wizards)
- Commands requiring complex structured input better expressed interactively
- Confirmation dialogs before destructive operations (data deletion, production changes)
- Guided workflows where step-by-step input improves UX over many CLI flags

## When NOT to Use

- Commands run by scheduler, CI, or deployment scripts (always non-interactive)
- Commands in pipelines or shell scripts
- Commands where all input can be expressed via arguments/options
- Automated batch processing — provide argument-driven mode alongside interactivity

## Best Practices (WHY)

- **Always provide defaults**: `$this->ask('Name', 'default')` prevents crashes in `--no-interaction`
- **Detect interactivity early**: check `$this->input->isInteractive()` at the start to fail fast with clear message
- **Limit prompts to 5-7**: too many prompts overwhelm users; use config files for complex input
- **Choice for bounded options**: `choice()` prevents invalid input for known options
- **Confirmation before destruction**: always `confirm()` before irreversible operations in interactive mode
- **Summary before execution**: display collected input in a table and ask "Proceed?" before acting

## Architecture Guidelines

- All interactive input must be expressible via arguments/options for non-interactive use
- Use `secret()` for passwords, tokens, and sensitive data
- Extract prompting logic into methods that accept `InputInterface` for testability
- Handle Ctrl+C gracefully with shutdown/cleanup when needed

## Performance Considerations

- Interactive commands pause waiting for input — intentional but confusing in automated contexts
- `readline` extension adds ~0.1ms per prompt
- `stty -echo` toggle adds ~5-10ms per `secret()` call
- Negligible for interactive use; only relevant in automated/non-interactive contexts

## Security Considerations

- `$this->secret()` hides input from terminal but value remains in memory — clear after use
- Never log prompted values (especially passwords, API keys)
- Input encoding varies by terminal — normalize to UTF-8 for consistent processing
- Add command-level timeouts to prevent hanging in case of mistaken non-interactive execution

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| No defaults for --no-interaction | `ask('Name')` without default | Forgetting non-interactive mode | RuntimeException crash | Always provide default values |
| Interactive in scheduled commands | `confirm()` in task run by cron | Not checking context | Hangs indefinitely | Detect non-interactive early |
| Too many prompts | 10+ sequential prompts | Over-design of wizard UX | User abandonment | Use config files for complex input |
| No fallback for choice() | Arrow-key selection in SSH pipe | Assuming terminal capabilities | Broken UX in non-TTY | Provide numbered/text input fallback |
| Not handling Ctrl+C | No cleanup on SIGINT | Default behavior | Dirty state on abort | Use pcntl_signal for cleanup |

## Anti-Patterns

- **Required Interaction**: command that can't run without interactive input — always support arguments
- **Prompt Without Validation**: accepting any input without checking format or constraints
- **Repeated Confirmation**: asking "Are you sure?" multiple times in a single command
- **Sensitive Echo**: using `ask()` instead of `secret()` for passwords
- **Nested Interactive Chains**: calling interactive commands from within interactive commands

## Examples

```php
public function handle(): int
{
    if (!$this->input->isInteractive()) {
        $this->error('This command requires an interactive terminal.');
        return Command::FAILURE;
    }

    $name = $this->ask('Project name', 'my-app');
    $stack = $this->choice('Starter kit', ['breeze', 'jetstream'], 'breeze');
    $testing = $this->confirm('Include testing setup?', true);
    $email = $this->askWithValidation('Admin email');

    $this->table(['Setting', 'Value'], [
        ['Name', $name],
        ['Stack', $stack],
        ['Testing', $testing ? 'Yes' : 'No'],
        ['Email', $email],
    ]);

    if (!$this->confirm('Create project with these settings?')) {
        $this->info('Cancelled.');
        return Command::SUCCESS;
    }

    // Create project...
    return Command::SUCCESS;
}

private function askWithValidation(string $question): string
{
    return $this->ask($question, null, function ($value) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \RuntimeException('Please enter a valid email address.');
        }
        return $value;
    });
}
```

## Related Topics

- artisan-command-signatures-arguments — defining input specifications
- console-output-formatting — tables, progress bars, styled output
- custom-artisan-command-patterns — command structure and registration

## AI Agent Notes

- Interactive commands break when called programmatically — AI agents should always pass inputs as arguments
- When generating interactive commands, ensure every prompt has a non-interactive fallback
- Use `$this->ask()` with `--no-interaction` defaults so agents can script the command
- The `choice()` multi-select (`$multiple=true`) returns an array — handle accordingly in agent code

## Verification

- [ ] All prompts work in interactive terminal
- [ ] `--no-interaction` uses defaults or errors gracefully
- [ ] Validation callbacks reject invalid input and re-prompt
- [ ] `$this->secret()` hides input during entry
- [ ] `choice()` renders navigable options
- [ ] Summary table displays before execution
- [ ] Command works fully with arguments (no forced interaction)
- [ ] Ctrl+C handled gracefully (no dirty state)
