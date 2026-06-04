# Decision Trees: Artisan Command Signatures and Arguments

## Metadata
- **KU ID:** cli-tooling-artisan-extensions/artisan-command-signatures-arguments
- **Subdomain:** cli-tooling-artisan-extensions
- **Domain:** platform-engineering-developer-experience
- **Phase:** 4 (Experience Curation)
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Argument vs option | Positional argument / Named option / Flag option | Distinguishing primary input from behavior modifiers |
| 2 | Required vs optional | Required / Optional / Default value | How strictly input must be provided at invocation |
| 3 | Array vs single value | Single value / Array argument / Array option | When commands need to process multiple items |
| 4 | Static vs dynamic signature | String `$signature` / `configure()` method / Hybrid | Trade-off between simplicity and runtime flexibility |
| 5 | Regex validation placement | Signature regex / Command body / Both | First gate (format) vs security boundary (semantics) |

## Architecture-Level Decision Trees

### Tree 1: Argument vs Option Selection

- **Start:** Designing a command's input interface
- **Is the input the primary target of the command (the "what")?**
  - Yes → Use positional argument. `{user-id}` for `user:activate 42`. Arguments are positional and ordered.
  - No → Continue.
- **Is the input a behavior modifier (the "how")?**
  - Yes → Use option. `{--dry-run}`, `{--format=json}`. Options are named and unordered.
  - No → Continue.
- **Is the input a boolean toggle?**
  - Yes → Use flag option (no value). `{--force}`, `{--verbose}`. Flags are present or absent.
  - No → Use value option. `{--server=}`, `{--format=json}`.
- **Convention check:** Options for modifiers, arguments for targets. `--force` and `--dry-run` are standard Laravel boolean flags.

### Tree 2: Required, Optional, and Default Values

- **Start:** Deciding how strictly to require input
- **Is the command unusable without this input?**
  - Yes → Required argument. `{name}`. Command fails with error if omitted.
  - No → Continue.
- **Is there a sensible default?**
  - Yes → Optional with default. `{format=json}`. Use when most callers want the same value.
  - No → Optional without default. `{description?}`. Use when input is nice-to-have but not needed.
- **Positional rule:** Required arguments must precede optional ones. Array arguments must be last.
- **Sensitive input:** Never use arguments or options for passwords/secrets. Use `$this->secret()` instead.

### Tree 3: Array vs Single Value Input

- **Start:** Determining if the command accepts multiple values
- **Does the command naturally operate on multiple items?**
  - Yes → Use array argument. `{ids* : User IDs to activate}`. Place as the last argument.
  - No → Use single value argument or option.
- **Is the input a list of options that modifies behavior?**
  - Yes → Use array option. `{--filter=*}`. Multiple `--filter` flags.
  - No → Single value is sufficient.
- **Array validation:** Always validate count. Set reasonable maximums. Array arguments consume all remaining positional tokens.

### Tree 4: Signature Definition Strategy

- **Start:** Choosing how to define the command signature
- **Does the signature change based on runtime conditions?**
  - Yes → Use `configure()` method. Call `$this->setArguments()` / `$this->setOptions()` dynamically based on context.
  - No → Use static `$signature` string. Simpler, self-documenting.
- **Is the command simple (< 5 arguments/options)?**
  - Yes → Static `$signature` string. Concise and readable.
  - No → Consider splitting into subcommands. If necessary, use `configure()` for clarity.
- **Validation strategy:**
  - Format validation → Signature regex: `{argument:^[0-9]+$}`.
  - Semantic validation → Command body. Check business rules after format passes.
  - Both → Regex as first gate, body as security boundary. Never rely solely on signature regex for security.
