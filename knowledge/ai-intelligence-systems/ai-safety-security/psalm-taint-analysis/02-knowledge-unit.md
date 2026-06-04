# Knowledge Unit: Psalm Taint Analysis for LLM Injection

## Metadata

- **ID:** KU-038
- **Subdomain:** AI Safety & Security
- **Slug:** psalm-taint-analysis
- **Version:** 1.0.0
- **Maturity:** Proposed (Psalm Plugin #484)
- **Status:** Published

## Executive Summary

Psalm taint analysis for LLM injection would add static analysis detection of tainted LLM output flowing into sensitive operations. Proposed as Psalm Plugin issue #484 for `psalm/psalm-plugin-laravel`, this feature would mark LLM response values as tainted and warn if they reach database queries, file operations, shell execution, or HTTP responses without sanitization.

## Core Concepts

- **Taint tracking**: Mark data originating from untrusted sources (LLM output) as "tainted"
- **Sink detection**: Detect when tainted data flows into security-sensitive operations (SQL queries, shell exec, filesystem)
- **Sanitization validation**: Verify that tainted data passes through a sanitization function before reaching sink
- **LLM-specific taint**: LLM responses are tainted by default — they can be manipulated via prompt injection
- **Psalm plugin**: Static analysis plugin for Laravel that adds taint rules for AI SDK responses

## Mental Models

- **Static analysis for XSS**: Like detecting unescaped user input in Blade templates — catch injection vulnerabilities at compile time, not runtime.
- **Type system for security**: Taint is like a type — "this string is a UserTaintedString" that can't be passed to `DB::query()` without sanitization.

## Internal Mechanics

Proposed implementation:
1. Psalm plugin adds new taint source: `Laravel\Ai\Responses\AiResponse::__toString()` returns `@tainted string`
2. Agent `prompt()`, `stream()`, tool `handle()` outputs are marked as tainted
3. Psalm's existing sink rules catch tainted data flowing to: SQL queries, `eval()`, `system()`, `file_put_contents()`, `unlink()`, HTTP responses
4. Whitelisted sanitization functions clear taint: `strip_tags()`, `htmlspecialchars()`, custom `sanitize_for_db()`
5. Violation: Psalm emits error — "Tainted LLM output flowing to SQL query without sanitization"

## Patterns

- **Sanitization boundary**: Create explicit sanitization functions that clear taint: `function sanitizeForDatabase(string $input): string`
- **Taint-aware middleware**: Guard middleware marks response as clean after validation
- **Explicit trust boundary**: Only after output guarding validation should taint be cleared
- **Tool result sanitization**: Tool `handle()` should sanitize LLM-provided arguments before using them

## Architectural Decisions

- **Decision**: Psalm-based vs. PHPStan-based → Psalm plugin. Reason: Psalm has built-in taint analysis framework; PHPStan lacks native taint support.
- **Decision**: LLM response as auto-tainted vs. explicit taint → Auto-tainted by default. Reason: Developer must explicitly trust/sanitize LLM output — fail-secure by default.
- **Decision**: Taint on response object vs. string → String level (when `__toString` is called). Reason: Most sinks expect strings; response object wrapping would miss many flows.

## Tradeoffs

| Factor | With Taint Analysis | Without |
|--------|-------------------|---------|
| Detection | Compile-time (before deployment) | Runtime only (or never) |
| Coverage | All code paths | Tested code paths only |
| False positives | Possible (valid use flagged) | None (but missed issues) |
| Configuration | Initial setup effort | Zero |
| Security confidence | High | Low |

## Performance Considerations

- Psalm static analysis: adds ~30 seconds to CI pipeline for taint checks
- No runtime performance cost — analysis is static
- Sanitization functions add negligible runtime overhead

## Production Considerations

- Add Psalm taint analysis to CI pipeline — block PRs with taint violations
- Define project-specific sanitization functions and whitelist them in Psalm config
- Create `@psalm-taint-sink` annotations for custom operations that consume LLM output
- Train team on taint analysis — interpret violations correctly (false positives vs. real vulnerabilities)
- Start with baseline violations count, gradually reduce to zero

## Common Mistakes

- Assuming LLM output is safe — LLM responses are tainted by nature (prompt injection)
- Clearing taint without actual sanitization — defeats the purpose
- Ignoring false positives — investigate each before whitelisting
- Only checking direct query sinks — indirect flows (cached responses, queued jobs) also need protection
- Not updating sanitization rules as new sinks are added to codebase

## Failure Modes

- **False negative**: Taint not propagated through complex flow (closures, higher-order functions)
- **False positive**: Legitimate sanitization not recognized — developer whitelists incorrectly
- **Taint evasion**: LLM output manipulated to avoid detection patterns — static analysis can't catch all
- **Plugin incompatibility**: Psalm plugin version out of sync with `laravel/ai` SDK — missed taint sources
- **Configuration gap**: Custom sinks not defined — code paths without coverage

## Ecosystem Usage

- `psalm/psalm-plugin-laravel`: issue #484 proposes LLM taint analysis
- Not yet implemented — still in proposal stage (Tier 3 knowledge)
- Once implemented, will catch: LLM output → SQL query, LLM output → shell command, LLM output → file write
- Complement to runtime security (Guardrail, Aegis) — catch issues before deployment

## Related Knowledge Units

- KU-034: Prompt Injection Defense
- KU-037: Tool Argument Validation
- KU-039: OWASP LLM Top 10 Compliance

## Research Notes

- Psalm taint analysis is a proposed feature, not yet implemented
- Issue #484 on `psalm/psalm-plugin-laravel` GitHub repository
- Python ecosystem has similar tools (Bandit, Semgrep rules for LangChain)
- No PHP static analysis tool currently detects LLM taint flows
- Once implemented, it would be the first defense layer (compile-time) in a defense-in-depth strategy
