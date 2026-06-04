---
id: KU-038
title: "Psalm Taint Analysis for LLM Injection"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/11-ai-safety-security/psalm-taint-analysis/04-standardized-knowledge.md"
---

# Psalm Taint Analysis for LLM Injection

## Overview

Psalm taint analysis for LLM injection would add static analysis detection of tainted LLM output flowing into sensitive operations. Proposed as Psalm Plugin issue #484 for `psalm/psalm-plugin-laravel`, this feature would mark LLM response values as tainted and warn if they reach database queries, file operations, shell execution, or HTTP responses without sanitization.

## Core Concepts

- **Taint tracking**: Mark data originating from untrusted sources (LLM output) as "tainted"
- **Sink detection**: Detect when tainted data flows into security-sensitive operations (SQL queries, shell exec, filesystem)
- **Sanitization validation**: Verify that tainted data passes through a sanitization function before reaching sink
- **LLM-specific taint**: LLM responses are tainted by default â€” they can be manipulated via prompt injection
- **Psalm plugin**: Static analysis plugin for Laravel that adds taint rules for AI SDK responses

## When To Use

- Production applications requiring Psalm Taint Analysis for LLM Injection functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Sanitization boundary**: Create explicit sanitization functions that clear taint: `function sanitizeForDatabase(string $input): string`
- **Taint-aware middleware**: Guard middleware marks response as clean after validation
- **Explicit trust boundary**: Only after output guarding validation should taint be cleared
- **Tool result sanitization**: Tool `handle()` should sanitize LLM-provided arguments before using them

- **Static analysis for XSS**: Like detecting unescaped user input in Blade templates â€” catch injection vulnerabilities at compile time, not runtime.
- **Type system for security**: Taint is like a type â€” "this string is a UserTaintedString" that can't be passed to `DB::query()` without sanitization.

## Architecture Guidelines

- **Decision**: Psalm-based vs. PHPStan-based â†’ Psalm plugin. Reason: Psalm has built-in taint analysis framework; PHPStan lacks native taint support.
- **Decision**: LLM response as auto-tainted vs. explicit taint â†’ Auto-tainted by default. Reason: Developer must explicitly trust/sanitize LLM output â€” fail-secure by default.
- **Decision**: Taint on response object vs. string â†’ String level (when `__toString` is called). Reason: Most sinks expect strings; response object wrapping would miss many flows.

## Performance Considerations

- Psalm static analysis: adds ~30 seconds to CI pipeline for taint checks
- No runtime performance cost â€” analysis is static
- Sanitization functions add negligible runtime overhead

| Factor | With Taint Analysis | Without |
|--------|-------------------|---------|
| Detection | Compile-time (before deployment) | Runtime only (or never) |
| Coverage | All code paths | Tested code paths only |
| False positives | Possible (valid use flagged) | None (but missed issues) |
| Configuration | Initial setup effort | Zero |
| Security confidence | High | Low |

## Security Considerations

- Add Psalm taint analysis to CI pipeline â€” block PRs with taint violations
- Define project-specific sanitization functions and whitelist them in Psalm config
- Create `@psalm-taint-sink` annotations for custom operations that consume LLM output
- Train team on taint analysis â€” interpret violations correctly (false positives vs. real vulnerabilities)
- Start with baseline violations count, gradually reduce to zero

## Common Mistakes

- Assuming LLM output is safe â€” LLM responses are tainted by nature (prompt injection)
- Clearing taint without actual sanitization â€” defeats the purpose
- Ignoring false positives â€” investigate each before whitelisting
- Only checking direct query sinks â€” indirect flows (cached responses, queued jobs) also need protection
- Not updating sanitization rules as new sinks are added to codebase

## Anti-Patterns

- **False negative**: Taint not propagated through complex flow (closures, higher-order functions)
- **False positive**: Legitimate sanitization not recognized â€” developer whitelists incorrectly
- **Taint evasion**: LLM output manipulated to avoid detection patterns â€” static analysis can't catch all
- **Plugin incompatibility**: Psalm plugin version out of sync with `laravel/ai` SDK â€” missed taint sources
- **Configuration gap**: Custom sinks not defined â€” code paths without coverage

## Examples

The following ecosystem packages provide reference implementations:

- `psalm/psalm-plugin-laravel`: issue #484 proposes LLM taint analysis
- Not yet implemented â€” still in proposal stage (Tier 3 knowledge)
- Once implemented, will catch: LLM output â†’ SQL query, LLM output â†’ shell command, LLM output â†’ file write
- Complement to runtime security (Guardrail, Aegis) â€” catch issues before deployment

## Related Topics

- KU-034: Prompt Injection Defense
- KU-037: Tool Argument Validation
- KU-039: OWASP LLM Top 10 Compliance

## AI Agent Notes

- When asked about Psalm Taint Analysis for LLM Injection, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

