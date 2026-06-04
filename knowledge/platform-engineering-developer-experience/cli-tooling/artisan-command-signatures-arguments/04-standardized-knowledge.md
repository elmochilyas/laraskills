# 04-Standardized Knowledge: Artisan Command Signatures and Arguments

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | cli-tooling-artisan-extensions |
| **Knowledge Unit** | artisan-command-signatures-arguments |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | custom-artisan-command-patterns, console-output-formatting, interactive-commands |
| **Framework/Language** | Laravel Artisan, Symfony Console, PHP |

## Overview

Artisan command signatures define the name, arguments, options, and constraints for console commands via the `$signature` string property. Syntax supports required arguments (`{argument}`), optional (`{argument?}`), defaults (`{argument=default}`), options with values (`{--option=}`) and flags (`{--option}`), array inputs (`{argument*}`), aliases (`{--option|-o}`), regex validation (`{argument:^[0-9]+$}`), and descriptions (`{arg : The description}`). Laravel parses the string into Symfony InputArgument and InputOption definitions.

## Core Concepts

- **Arguments** are positional (order matters); use for primary input data
- **Options** are named (`--name`); use for behavior modifiers
- **Syntax Forms**: required (`{arg}`), optional (`{arg?}`), default (`{arg=default}`), array (`{arg*}`), array-optional (`{arg?*}`)
- **Option Values**: flag (`{--force}`), required value (`{--format=}`), optional value (`{--format=?}`), array (`{--filter=*}`)
- **Aliases**: short form with `{--option|-o}` syntax
- **Regex Validation**: `{argument:^[0-9]+$}` enforces format constraints before command logic runs
- **Descriptions**: append with colon-space: `{argument : The user ID}`

## When to Use

- Defining public API contracts for commands consumed by other developers or automation
- Validating input format at the definition layer (regex patterns)
- Enabling `--help` and `php artisan list` documentation automatically
- Any command requiring structured input beyond simple arguments

## When NOT to Use

- Dynamic signatures that change based on runtime state (use `configure()` method instead)
- Complex validation that depends on multiple arguments (use command body)
- Interactive-only input where CLI arguments would be unwieldy
- Secret/sensitive input that should not appear in process listings

## Best Practices (WHY)

- **Always include descriptions**: each argument and option should have a description so `--help` is self-documenting
- **Required before optional**: required arguments must precede optional ones to avoid positional ambiguity
- **Array arguments last**: `{item*}` consumes all remaining positional tokens; place as the final argument
- **Options for modifiers, arguments for targets**: positional arguments are the "what", named options are the "how"
- **Regex for format, PHP for business logic**: signature regex validates structure; command body validates semantics
- **Use `--force` and `--dry-run` conventions**: standard boolean flags matching Laravel ecosystem patterns

## Architecture Guidelines

- Keep signatures concise — more than 5 arguments/options suggests splitting the command
- Use `configure()` method when signature string cannot express the needed logic
- Document breaking signature changes in changelog and update consuming CI scripts
- Sensitive values (passwords) should use interactive `$this->secret()`, not arguments

## Performance Considerations

- Signature parsed once per command registration; negligible overhead
- Regex patterns evaluated on every invocation — keep patterns simple (avoid backtracking)
- InputDefinition built on command instantiation; lazy loading means no upfront cost for unused commands

## Security Considerations

- Arguments and options are visible in process listings (`ps aux`); never put secrets in them
- Regex validation is a first gate, not a security boundary — always validate in command body too
- Array arguments can overflow — set reasonable limits and validate count
- Option aliases must be unique to avoid collision errors

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Optional before required | `{arg2?} {arg1}` | Not knowing positional rules | Symfony throws exception during definition build | Place required first |
| Forgetting `=` for value options | `{--password}` as boolean instead of `{--password=}` | Confusing flags with value options | Option silently treated as boolean | Use `=}` for value options |
| Array argument not last | `{ids*} {name}` | Not understanding array semantics | `{name}` can never be reached | Always place `*` args last |
| Missing description separator | `{arg:description}` without space | Typo | Syntax parsing error | Use `{arg : description}` with spaces |
| Confusing argument vs option | `--force` as argument name | Not understanding the `{--force}` syntax | Positional argument named "--force" | Use `{--force}` for options |

## Anti-Patterns

- **Signature Overload**: 10+ arguments in one command — split into subcommands
- **Brittle Regex**: overly strict patterns that reject valid Unicode or long inputs
- **Dynamic Argument Meaning**: same argument position meaning different things based on another option
- **Empty Descriptions**: arguments/options without descriptions make `--help` useless
- **Positional Breaking Changes**: adding new arguments before existing ones breaks automation scripts

## Examples

```php
protected $signature = 'users:activate
    {ids* : The user IDs to activate}
    {--server= : Activate users on a specific server}
    {--dry-run : Show what would be done without actually doing it}
    {--force : Skip confirmation prompt}
    {--chunk=100 : Process users in chunks of N}
    {--Q|queue= : Queue the job instead of running synchronously}';
```

## Related Topics

- custom-artisan-command-patterns — command structure and registration
- console-output-formatting — tables, progress bars, styled output
- interactive-commands — prompts, confirmations, choices
- cli-workflow-automation — chaining commands into workflows

## AI Agent Notes

- Signatures are the first thing humans and agents read to understand a command's interface
- Regex patterns in signatures are PCRE — ensure they match what AI generates for validation
- The `configure()` method alternative enables conditional definitions when signature string is insufficient
- When refactoring signatures, maintain backward compatibility by keeping old argument names as aliases

## Verification

- [ ] `php artisan list` shows the command with correct name
- [ ] `php artisan command:name --help` shows all arguments, options, and descriptions
- [ ] Required arguments rejected with error when missing
- [ ] Default values applied when optional arguments omitted
- [ ] Array arguments accept multiple values
- [ ] Regex validation correct for valid and invalid inputs
- [ ] Option aliases (`-o`) work for all defined shortcuts
- [ ] No breaking changes to existing consuming scripts
