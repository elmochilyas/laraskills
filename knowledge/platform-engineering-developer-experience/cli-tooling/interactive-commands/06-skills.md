# Skill: Build Interactive Artisan Commands

## Purpose
Collect user input dynamically via prompts for setup wizards, confirmation dialogs, and multi-step guided workflows, with proper support for non-interactive mode.

## When To Use
- Setup commands (installers, configuration wizards)
- Commands requiring complex structured input better expressed interactively
- Confirmation dialogs before destructive operations (data deletion, production changes)
- Guided workflows where step-by-step input improves UX over many CLI flags

## When NOT To Use
- Commands run by scheduler, CI, or deployment scripts (always non-interactive)
- Commands in pipelines or shell scripts
- Commands where all input can be expressed via arguments/options
- Automated batch processing — provide argument-driven mode alongside interactivity

## Prerequisites
- Artisan command extending `Illuminate\Console\Command`
- Understanding of prompt methods: `ask()`, `secret()`, `confirm()`, `choice()`, `anticipate()`
- Symfony Console QuestionHelper knowledge

## Inputs
- Question prompts with types (text, secret, confirm, choice)
- Default values for non-interactive fallback
- Inline validation callbacks
- Conditional logic for follow-up questions

## Workflow
1. Detect interactivity early: check `$this->input->isInteractive()` and fail fast if interactive required
2. Always provide defaults: `$this->ask('Name', 'default')` prevents crashes in `--no-interaction`
3. Limit prompts to 5-7; use config files for complex input
4. Use `choice()` for bounded options to prevent invalid input
5. Use `secret()` for passwords, tokens, and sensitive data
6. Add inline validation callbacks to loop until valid input
7. Always `confirm()` before irreversible operations in interactive mode
8. Display collected input in a table and ask "Proceed?" before execution
9. Extract prompting logic into methods that accept `InputInterface` for testability
10. Ensure all interactive input can also be expressed via arguments/options

## Validation Checklist
- [ ] Default values provided for all prompts (non-interactive safe)
- [ ] Interactivity detected early with clear failure message
- [ ] 5-7 prompts maximum (config files for more complex input)
- [ ] `choice()` used for bounded options
- [ ] `secret()` used for passwords, tokens, and sensitive data
- [ ] Confirmation required before destructive operations
- [ ] Summary table displayed before execution (proceed prompt)
- [ ] All interactive input expressible via arguments/options
- [ ] Prompting logic extractable for testability
- [ ] `--no-interaction` flag respected throughout

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Command crashes in CI | No defaults provided | Always provide defaults for `--no-interaction` |
| User overwhelmed by prompts | Too many prompts | Limit to 5-7; use config file for complex input |
| Invalid input crashes | No validation | Use `choice()` for bounded options; add validation callbacks |
| Destructive action without confirmation | No confirm() | Always confirm before irreversible operations |
| User doesn't know what they entered | No summary | Display input table and ask "Proceed?" |
| Hard to test prompting logic | Prompts in handle() | Extract prompting logic into testable methods |
| Sensitive input visible | Using ask() for secrets | Use `secret()` for passwords and tokens |

## Decision Points
- **Prompt vs argument/option:** Interactive-only input uses prompts; argument-driven mode for automation
- **Inline validation vs post-validation:** Inline loops until valid; post-validation rejects batch input
- **Single vs multi-step:** Single prompt vs wizard with conditional follow-ups
- **Default behavior:** Safe defaults vs explicit input (choose safe defaults for non-interactive)

## Performance/Security Considerations
- Use `secret()` for all sensitive input (never `ask()` for passwords or tokens)
- Confirmation prompts must be non-blocking in non-interactive mode (default to "no" for destructive)
- Input validation should prevent injection attacks (shell injection, SQL injection)
- Displayed summaries should mask sensitive values (show `*****` for passwords)
- Never log raw input from prompts (especially secret, password, token fields)

## Related Rules
- INT-RULE-001 through INT-RULE-012

## Related Skills
- Create Custom Artisan Commands
- Format Console Output
- Define Command Signatures and Arguments
- Automate CLI Workflows

## Success Criteria
- Interactive commands work correctly with both `--no-interaction` and interactive terminals
- Destructive operations always prompt for confirmation
- Sensitive input is secret/hidden during entry
- Input summary is displayed before execution
- Prompting logic is testable in isolation
- Commands never crash due to missing interactive input in CI/CD pipelines
