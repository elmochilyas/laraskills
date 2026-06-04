# Skill: Define Artisan Command Signatures and Arguments

## Purpose
Define the name, arguments, options, and constraints for Artisan commands using the `$signature` string syntax, enabling self-documenting `--help` output and structured input validation.

## When To Use
- Defining public API contracts for commands consumed by other developers or automation
- Validating input format at the definition layer (regex patterns)
- Enabling `--help` and `php artisan list` documentation automatically
- Any command requiring structured input beyond simple arguments

## When NOT To Use
- Dynamic signatures that change based on runtime state (use `configure()` method instead)
- Complex validation depending on multiple arguments (use command body)
- Interactive-only input where CLI arguments would be unwieldy
- Secret/sensitive input that should not appear in process listings

## Prerequisites
- Artisan command class extending `Illuminate\Console\Command`
- Understanding of signature syntax (arguments, options, arrays, aliases)
- Familiarity with Symfony Console InputArgument and InputOption

## Inputs
- Command name (`command:name`)
- List of positional arguments with types (required, optional, array)
- List of named options with types (flag, value, array)
- Descriptions for each argument and option

## Workflow
1. Choose a command name following the `group:action` convention (e.g., `user:create`)
2. Define required arguments first, optional arguments after
3. Place array arguments (`{item*}`) last as they consume all remaining positional tokens
4. Use options for behavior modifiers (`--force`, `--dry-run`, `--format=`)
5. Add descriptions to every argument and option for `--help` output
6. Use regex validation for format constraints: `{id:^[0-9]+$}`
7. Add aliases with `{--option|-o}` for commonly used flags
8. Use `$this->secret()` for sensitive values (not signature arguments)
9. Use `configure()` method for dynamic signatures that depend on runtime state
10. Keep signatures under 5 arguments/options; split command if more needed

## Validation Checklist
- [ ] Each argument and option has a description for `--help` documentation
- [ ] Required arguments precede optional arguments
- [ ] Array arguments are placed last
- [ ] Options are used for modifiers; arguments for targets
- [ ] `--force` and `--dry-run` conventions follow Laravel ecosystem patterns
- [ ] Sensitive values use `$this->secret()` not signature arguments
- [ ] Signature is concise (under 5 arguments/options)
- [ ] Regex validation used for format, PHP for business logic

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Signature too long | Too many arguments/options | Split command; use config file for complex input |
| Optional before required | Wrong order | Required arguments must precede optional ones |
| Sensitive value in arguments | Using signature for passwords | Use `$this->secret()` for sensitive input |
| Array argument not last | Array positioned before other arguments | Place `{item*}` as the final argument |
| Ambiguous `--help` output | Missing descriptions | Add description to every argument and option |
| Dynamic signature in string | Runtime-dependent signature | Use `configure()` method instead |

## Decision Points
- **Signature vs configure():** Use signature string for static commands; `configure()` for dynamic
- **Input validation layer:** Regex in signature vs PHP validation in `handle()`
- **Argument vs option:** Positional for primary input data; named for behavior modifiers
- **Array vs single value:** Array for multiple items; single for unambiguous one

## Performance/Security Considerations
- Sensitive values (passwords, tokens, secrets) must use `$this->secret()` — never arguments
- Signature regex validates only structure; business logic validation belongs in command body
- Array arguments can consume unexpected tokens; document usage clearly
- Command input appears in process listings; avoid sensitive data in arguments

## Related Rules
- SIG-RULE-001 through SIG-RULE-011

## Related Skills
- Create Custom Artisan Commands
- Format Console Output
- Build Interactive Commands
- Automate CLI Workflows

## Success Criteria
- Every custom Artisan command has a complete `$signature` with descriptions
- `--help` output is self-documenting for all commands
- Input validation catches format errors at the signature level
- Sensitive input is always handled via `$this->secret()`
- No command exceeds 5 arguments/options
