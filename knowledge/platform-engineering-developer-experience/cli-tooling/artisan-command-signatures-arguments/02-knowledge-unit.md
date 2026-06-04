# Knowledge Unit: Artisan Command Signatures and Arguments

## Metadata
- **Subdomain:** CLI Tooling & Artisan Extensions
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** cli-tooling-artisan-extensions/artisan-command-signatures-arguments
- **Maturity:** Mature
- **Related Technologies:** Laravel Artisan, Symfony Console, PHP

## Executive Summary

Artisan command signatures define the name, arguments, options, and constraints for console commands in Laravel. The `$signature` property uses an expressive string syntax that mirrors Symfony Console's definition pattern but with a more concise format. Signatures support required arguments (`{argument}`), optional arguments (`{argument?}`), arguments with defaults (`{argument=default}`), options with (`--option`) and without (`--option?`) values, option shortcuts, array inputs, and input validation via regex patterns. Laravel parses the signature string into Symfony Console InputArgument and InputOption definitions behind the scenes, allowing commands to inherit full Symfony console functionality while using Laravel's expressive syntax.

## Core Concepts

- **Signature String:** A single-line string on the `$signature` property: `{argument}` for required, `{argument?}` for optional, `{argument=default}` for default values, `{--option}` for flags, `{--option=}` for options with values
- **Argument vs Option:** Arguments are positional (order matters), options are named (--name) and unordered; arguments are for primary input, options for modifiers
- **Input Arrays:** Append `*` to accept arrays: `{argument*}` captures all remaining positional args, `{--option*}` accepts multiple `--option=value` flags
- **Alias Support:** Short option aliases defined with `--option|-o` syntax
- **Validation via Regex:** Append `:regex-pattern` to enforce constraints: `{argument:^[0-9]+$}` limits to digits only
- **Description:** Append description after the definition: `{argument : The user ID}`

## Mental Models

- **Signature as API Contract:** The signature defines the command's public API—what it accepts, what's required, and how inputs map to command logic
- **Signature as Validation Layer:** Regex patterns in signatures act as a first validation gate, rejecting invalid input before command code runs
- **Arguments as Primary Data:** Arguments are the main input (what the command acts on); options are configuration (how the command behaves)

## Internal Mechanics

1. **Signature Parsing:** Laravel's `Illuminate\Console\Parser` (or `Symfony\Component\Console\Descriptor`) parses the signature string into tokens: command name, arguments, options, and their descriptions
2. **InputDefinition Building:** The parsed tokens are converted to `Symfony\Component\Console\Input\InputArgument` and `InputOption` instances with the appropriate mode (REQUIRED, OPTIONAL, IS_ARRAY, etc.)
3. **Validation Execution:** On `handle()`, Symfony's `InputArgument::validate()` checks required arguments and regex constraints before the command body runs
4. **Input Retrieval:** Inside the command, `$this->argument('name')` and `$this->option('name')` retrieve parsed values from the `ArgvInput` object

## Patterns

- **Descriptive Signature Pattern:** Always include descriptions: `{argument : The ID of the user to process}`—descriptions appear in `php artisan list` and `--help`
- **Required Arguments First Pattern:** Required arguments must precede optional ones in the signature to avoid positional ambiguity
- **Option Prefix Convention Pattern:** Use `--force`, `--dry-run`, `--quiet` as boolean flags; use `--format=`, `--output=` for value options
- **Array Argument Pattern:** Use `{ids* : The user IDs}` for commands that accept multiple items: `php artisan users:activate 1 2 3`
- **Validation Responsibility Split Pattern:** Use signature regex for simple format validation, command body logic for business rule validation

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Signature vs define() | Signature string property vs `configure()` method with `$this->setName()`/`setDescription()` | Use `$signature` for readability; fall back to `configure()` for dynamic definitions |
| Argument vs Option | Positional arguments vs named options | Arguments for primary targets; options for behavior flags |
| Array vs Single | `{item*}` vs `{item}` with repeated calls | Array for bulk operations; single for targeted commands |
| Regex vs PHP validation | Signature patterns vs `$this->validate()` or manual checks | Regex for format validation; PHP for context-dependent rules |

## Tradeoffs

- **Expressiveness vs Flexibility:** The signature string is concise but cannot express conditional logic (optional arg that depends on another option). For dynamic definitions, use the `configure()` method with InputDefinition programmatically.
- **Array Arguments vs Named Options:** Array arguments are positional and less discoverable (`users:activate 1 2 3 4`), while repeated options are more self-documenting (`users:activate --id=1 --id=2`). Array arguments are shorter to type; repeated options are clearer.
- **Signature Clarity vs Length:** A long signature with many arguments and options is comprehensive but hard to read. Consider splitting complex commands into subcommands or using interactive prompts for complex input.

## Performance Considerations

- **Signature Parsing Overhead:** The signature is parsed once per command registration and cached if config caching is enabled. Parsing overhead is negligible.
- **Regex Validation Cost:** Regex patterns in signatures are evaluated on every invocation. Simple patterns (character classes, length limits) are fast; complex backtracking patterns could add microseconds of overhead.
- **Input Definition Build:** The InputDefinition is built when the command is instantiated. Commands registered in `Kernel` are loaded lazily—only instantiated when called—so there's no upfront cost for unused commands.

## Production Considerations

- **Argument Validation in Production:** Regex validation is evaluated before command logic. Ensure regex patterns are correct and don't produce false negatives that block legitimate production operations.
- **Sensitive Arguments:** Avoid using arguments for sensitive data (passwords, API keys). Options are visible in process listings. Use interactive prompts with `$this->secret()` for sensitive input.
- **Versioning Command Signatures:** Changing an argument from optional to required or removing an option is a breaking change. Follow semantic versioning for CLI commands used in scripts or CI pipelines.
- **Defensive Defaults:** Optional arguments should have safe defaults (`{limit=50}`) that prevent unintentional resource exhaustion in production.

## Common Mistakes

- **Positional argument ordering:** Placing optional arguments before required ones; Laravel/Symfony throws an error during definition build
- **Forgetting the colon separator:** Writing `{argument :description}` without the space before the colon; the correct format is `{argument : description}` with spaces
- **Using `{--option}` for required values:** Writing `{--password}` creates a boolean flag, not a value option; use `{--password=}` for options that require a value
- **Overusing array arguments:** Array arguments consume all remaining positional tokens, making it impossible to add more arguments later; design array arguments as the last argument
- **Confusing argument names with option names:** An argument named `--force` creates a positional argument with that name; use `{--force}` for an option named `force`

## Failure Modes

- **Regex Rejection Loop:** A poorly-written regex pattern rejects valid production inputs (e.g., Unicode characters in names). Mitigate: use permissive regex patterns and add business logic validation in the command body.
- **Array Argument Collision:** When adding a new argument after an array argument, the array consumes all remaining positional tokens. Mitigate: always place array arguments last in the signature.
- **Argument Renaming Breakage:** Scripts and automation that pass arguments positionally break when argument names change (even though positional order matters, not names). Mitigate: maintain backward-compatible argument ordering and test automation scripts.
- **Option Alias Collision:** Two options with the same shortcut alias (e.g., `--verbose|-v` and `--version|-v`). Symfony throws an exception. Mitigate: use unique shortcuts and test registration.

## Ecosystem Usage

- **Laravel Framework:** Core Artisan commands use signature syntax extensively (make:migration, make:model, migrate, optimize, etc.)
- **Package Commands:** Spatie packages, Laravel Telescope, Horizon, and Pulse all register commands via signature strings
- **Community Tools:** Laravel Debugbar, IDE Helper, and Blueprint use signatures for their custom Artisan commands

## Related Knowledge Units

- custom-artisan-command-patterns
- console-output-formatting
- interactive-commands
- cli-workflow-automation

## Research Notes

- The signature syntax `{argument}` is a Laravel innovation over Symfony's programmatic define approach; it was introduced in Laravel 5.0
- Behind the scenes, Laravel's Parser converts the string into Symfony's InputArgument/InputOption objects, meaning Symfony's full validation pipeline applies
- Regex validation in signatures was added in Laravel 8.x and is powered by Symfony's ExpressionLanguage or PCRE (depending on pattern format)
- The signature-to-InputDefinition conversion happens in `Illuminate\Console\Command::configureUsingFluentDefinition()` and is cached after the first parse
