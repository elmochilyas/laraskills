---
id: KU-034
title: "Prompt Injection Defense"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/11-ai-safety-security/prompt-injection-defense/04-standardized-knowledge.md"
---

# Prompt Injection Defense

## Overview

Prompt injection is the #1 AI security risk (OWASP LLM01:2025). It exploits the inability of LLMs to distinguish between system instructions and user/data input. The Laravel ecosystem has multiple defense packages (Aegis, Guardrail, AI Guard) but no official Laravel recommendation. Defense strategies combine input sanitization, injection pattern detection, output validation, and least-privilege tool access.

## Core Concepts

- **Direct injection**: User input overrides system instructions (e.g., "Ignore previous instructions and...")
- **Indirect injection**: Malicious instructions embedded in external content (documents, websites) that the LLM processes
- **Injection patterns**: 30+ known patterns including: role override, instruction override, delimiter confusion, token smuggling
- **Semantic firewall**: Middleware that scans prompts for injection patterns before sending to LLM
- **Output validation**: Scan LLM responses for signs of injection success (leaked system prompts, unexpected code)
- **Defense-in-depth**: Multiple layers â€” input sanitization â†’ injection detection â†’ tool validation â†’ output scanning

## When To Use

- Production applications requiring Prompt Injection Defense functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Delimiter isolation**: Wrap user input in unique delimiters (`<user_input>...</user_input>`) â€” instruct LLM to treat delimited content as data, not instructions
- **Instruction reinforcement**: Repeat system instructions at the end of the prompt â€” overrides injected instructions
- **Tool argument validation**: Strict typing, allowed values, max length on tool schemas â€” LLM cannot inject unexpected arguments
- **Read-only tools**: Database tools use read-only connections â€” injection can't modify data
- **Least-privilege tools**: Each tool has minimal scope â€” a support agent doesn't need a "delete user" tool

- **SQL injection for LLMs**: Just as SQL injection exploits the parser's inability to separate code from data, prompt injection exploits the LLM's inability to separate instructions from input.
- **XSS for AI**: Like cross-site scripting â€” untrusted data is interpreted as executable instructions. The LLM is the "browser" that executes injected "scripts."
- **Principle of least privilege**: The LLM should only have the minimum permissions needed. Tools should be scoped, read-only, and validated.

## Architecture Guidelines

- **Decision**: Built-in vs. package security â†’ Laravel AI SDK has zero built-in sanitization. Teams must add security via middleware or community packages (Guardrail, Aegis).
- **Decision**: Pattern-based vs. ML-based detection â†’ Pattern-based (regex, rule) for known attacks; ML-based for novel attacks. Both recommended in production.
- **Decision**: Pre-send vs. post-receive scanning â†’ Both. Pre-send prevents injection payloads from reaching LLM. Post-receive catches successful injections in responses.

## Performance Considerations

- Pattern detection: 5-50ms depending on number of patterns and input length
- Output guarding: 10-100ms for LLM-based response evaluation
- Tool argument validation: <1ms (local validation)
- Total defense overhead: ~20-200ms per request â€” acceptable for most applications

| Defense Layer | Effectiveness | Latency | Maintenance |
|--------------|---------------|---------|-------------|
| Input sanitization | Medium (stops known patterns) | <1ms | Low |
| Pattern detection | High (30+ known patterns) | 5-50ms | Medium (new patterns) |
| Prompt isolation | Medium (LLM-dependent) | 0 | Low |
| Tool validation | High (structural protection) | <1ms | Low |
| Output guarding | Medium (detects post-hoc) | 10-100ms | Medium |
| ML-based detection | Very High (novel patterns) | 50-200ms | High (model maintenance) |

## Security Considerations

- Layer defenses â€” no single layer is sufficient
- Test defenses with adversarial prompts (red teaming)
- Monitor injection detection rate â€” rising rate indicates active attack
- Log all blocked prompts for analysis â€” improve detection patterns based on real attacks
- Implement emergency kill switch â€” disable AI features if injection attack is detected at scale
- Stay current with OWASP LLM Top 10 â€” new attack vectors emerge quarterly

## Common Mistakes

- Relying solely on prompt engineering for injection defense â€” LLMs cannot reliably distinguish instructions from data
- No input sanitization on retrieved documents â€” indirect injection via RAG is the most common attack vector
- Tool schemas without validation â€” LLM can inject arbitrary function arguments
- No output scanning â€” successful injections go undetected until damage is done
- Assuming a managed API (OpenAI, Anthropic) handles injection defense â€” they do not
- Whitelisting instead of blacklisting â€” attackers bypass blacklists with novel patterns

## Anti-Patterns

- **False positive**: Legitimate prompt blocked as injection â€” frustrates users. Tune detection sensitivity.
- **False negative**: Novel injection bypasses pattern detection â€” ML-based detection catches some, but not all
- **Defense bypass via RAG**: Attacker embeds injection in documents that the LLM ingests â€” indirect injection defense is harder than direct
- **Multimodal injection**: Instructions hidden in images bypass text-based pattern detection
- **Tool chain injection**: Injected tool calls trigger destructive operations despite input sanitization

## Examples

The following ecosystem packages provide reference implementations:

- `fr3on/laravel-guardrail`: Prompt injection detection middleware, configurable patterns (Apr 2026)
- `MrPunyapal/laravel-ai-aegis`: Comprehensive security suite â€” injection detection + PII redaction + output guarding (Mar 2026)
- `subhashladumor1/laravel-ai-guard`: Budget enforcement + injection defense
- OWASP LLM Prompt Injection Prevention Cheat Sheet: reference standard
- Psalm plugin #484: Proposed taint analysis for LLM-influenced code paths

## Related Topics

- KU-035: PII Pseudonymization
- KU-036: Output Guarding & Validation
- KU-037: Tool Argument Validation
- KU-038: Psalm Taint Analysis
- KU-039: OWASP LLM Top 10 Compliance

## AI Agent Notes

- When asked about Prompt Injection Defense, first determine the specific use case and requirements.
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

