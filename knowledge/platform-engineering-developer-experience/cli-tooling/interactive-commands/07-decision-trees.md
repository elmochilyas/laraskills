# Decision Trees: Interactive Commands

## Metadata
- **KU ID:** cli-tooling-artisan-extensions/interactive-commands
- **Subdomain:** cli-tooling-artisan-extensions
- **Domain:** platform-engineering-developer-experience
- **Phase:** 4 (Experience Curation)
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Prompt method selection | `ask()` / `secret()` / `confirm()` / `choice()` / `anticipate()` | Input type (free text, hidden, boolean, selection) |
| 2 | Non-interactive fallback | Default values / Arguments-only / Error | Behavior when command is called by automation |
| 3 | Validation strategy | Inline callback / Post-hoc / No validation | Input quality control vs development speed |
| 4 | Multi-step wizard design | Linear / Conditional / Config-backed | User experience for complex setup commands |
| 5 | Prompt count limit | 1-3 / 5-7 / 10+ | Balancing thoroughness with user patience |

## Architecture-Level Decision Trees

### Tree 1: Prompt Method Selection

- **Start:** Choosing the right prompt type for the input
- **Is the input sensitive (password, token, API key)?**
  - Yes → Use `$this->secret()`. Input is hidden during entry. Clear from memory after use. Never log.
  - No → Continue.
- **Is the input a yes/no decision?**
  - Yes → Use `$this->confirm('Proceed?', true)`. Default to safe value (false for destructive operations, true for non-destructive).
  - No → Continue.
- **Is the input selected from a bounded set of options?**
  - Yes → Use `$this->choice('Stack', ['breeze', 'jetstream'], 'breeze')`. Prevents invalid input. Supports `$multiple=true` for multi-select.
  - No → Continue.
- **Does the input benefit from tab completion suggestions?**
  - Yes → Use `$this->anticipate('Name', ['suggestion1', 'suggestion2'])`. Suggests but allows free text.
  - No → Use `$this->ask('Name', 'default')`. Free text input with optional default.

### Tree 2: Non-Interactive Fallback Design

- **Start:** Ensuring the command works in non-interactive contexts
- **Will this command ever be run by CI, scheduler, or automation?**
  - Yes → Every prompt must have a non-interactive fallback strategy.
  - No → Interactive-only is acceptable for development-only commands.
- **Fallback strategy:**
  - Option A: Provide defaults for all prompts. `ask('Name', 'default')`. Works with `--no-interaction`.
  - Option B: Accept all input via arguments/options. Use arguments for input, prompts only as convenience. `--no-interaction` uses argument values.
  - Option C: Fail gracefully with clear message. `if (!$this->input->isInteractive()) { $this->error('...'); return 1; }`.
- **Recommendation:** Option B (arguments + prompts) is most robust. All interactive input must be expressible via CLI arguments/options.

### Tree 3: Validation and Confirmation

- **Start:** Validating user input
- **Does the input have a specific format (email, number, date)?**
  - Yes → Use inline validation callback as third parameter to `ask()`. Loop until valid input provided. Provide clear error message per attempt.
  - No → Continue.
- **Is the input from a bounded set (choice)?**
  - Yes → `choice()` handles validation automatically. Invalid options are rejected.
  - No → Post-hoc validation in command body. Check after all input collected. Report all errors at once.
- **Destructive operation?**
  - Yes → Always confirm before executing. Show summary of what will happen. Require explicit confirmation.
  - No → Standard validation is sufficient.
- **Summary pattern:** Display collected input in a table and ask "Proceed?" before executing.

### Tree 4: Multi-Step Wizard Design

- **Start:** Designing a setup wizard with multiple prompts
- **How many prompts are needed?**
  - 1-3 → Simple linear flow. All prompts shown sequentially. Quick to complete.
  - 4-7 → Conditional flow. Show follow-up prompts only when previous answers require them. Use `$this->confirm()` to gate optional sections.
  - 7+ → Consider config file instead. Too many prompts overwhelm users. Accept a config file path as alternative to interactive mode.
- **Wizard structure:**
  1. Introduction: what this command will do.
  2. Collect inputs: group by topic (project settings, features, services).
  3. Summary: show table of all collected values.
  4. Confirmation: "Proceed with these settings?"
  5. Execute: perform the operation.
  6. Result: success/failure with next steps.
- **Progress indication:** Use section headers and spacing to make long wizards feel organized.
