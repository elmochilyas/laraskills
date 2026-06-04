# Knowledge Unit: Prompt Injection Defense

## Metadata

- **ID:** KU-034
- **Subdomain:** AI Safety & Security
- **Slug:** prompt-injection-defense
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Prompt injection is the #1 AI security risk (OWASP LLM01:2025). It exploits the inability of LLMs to distinguish between system instructions and user/data input. The Laravel ecosystem has multiple defense packages (Aegis, Guardrail, AI Guard) but no official Laravel recommendation. Defense strategies combine input sanitization, injection pattern detection, output validation, and least-privilege tool access.

## Core Concepts

- **Direct injection**: User input overrides system instructions (e.g., "Ignore previous instructions and...")
- **Indirect injection**: Malicious instructions embedded in external content (documents, websites) that the LLM processes
- **Injection patterns**: 30+ known patterns including: role override, instruction override, delimiter confusion, token smuggling
- **Semantic firewall**: Middleware that scans prompts for injection patterns before sending to LLM
- **Output validation**: Scan LLM responses for signs of injection success (leaked system prompts, unexpected code)
- **Defense-in-depth**: Multiple layers — input sanitization → injection detection → tool validation → output scanning

## Mental Models

- **SQL injection for LLMs**: Just as SQL injection exploits the parser's inability to separate code from data, prompt injection exploits the LLM's inability to separate instructions from input.
- **XSS for AI**: Like cross-site scripting — untrusted data is interpreted as executable instructions. The LLM is the "browser" that executes injected "scripts."
- **Principle of least privilege**: The LLM should only have the minimum permissions needed. Tools should be scoped, read-only, and validated.

## Internal Mechanics

Injection attack surface:
1. User prompt → LLM (direct injection)
2. Retrieved documents → context → LLM (indirect injection via RAG)
3. Tool outputs → LLM (indirect injection via tool results)
4. Images → LLM (multimodal injection)

Defense layers:
1. **Input sanitization**: Strip known injection patterns, delimiters, control characters from user input
2. **Pattern detection**: Regex/ML-based detection of 30+ injection patterns (role override, instruction bleed, delimiter attack)
3. **Prompt isolation**: Clearly delimit system instructions from user input in prompt template
4. **Tool validation**: Validate tool arguments against strict schema — reject unexpected input
5. **Output guarding**: Scan LLM responses for PII leakage, system prompt fragments, executable code
6. **Audit logging**: Log all prompts and responses for post-hoc injection analysis

## Patterns

- **Delimiter isolation**: Wrap user input in unique delimiters (`<user_input>...</user_input>`) — instruct LLM to treat delimited content as data, not instructions
- **Instruction reinforcement**: Repeat system instructions at the end of the prompt — overrides injected instructions
- **Tool argument validation**: Strict typing, allowed values, max length on tool schemas — LLM cannot inject unexpected arguments
- **Read-only tools**: Database tools use read-only connections — injection can't modify data
- **Least-privilege tools**: Each tool has minimal scope — a support agent doesn't need a "delete user" tool

## Architectural Decisions

- **Decision**: Built-in vs. package security → Laravel AI SDK has zero built-in sanitization. Teams must add security via middleware or community packages (Guardrail, Aegis).
- **Decision**: Pattern-based vs. ML-based detection → Pattern-based (regex, rule) for known attacks; ML-based for novel attacks. Both recommended in production.
- **Decision**: Pre-send vs. post-receive scanning → Both. Pre-send prevents injection payloads from reaching LLM. Post-receive catches successful injections in responses.

## Tradeoffs

| Defense Layer | Effectiveness | Latency | Maintenance |
|--------------|---------------|---------|-------------|
| Input sanitization | Medium (stops known patterns) | <1ms | Low |
| Pattern detection | High (30+ known patterns) | 5-50ms | Medium (new patterns) |
| Prompt isolation | Medium (LLM-dependent) | 0 | Low |
| Tool validation | High (structural protection) | <1ms | Low |
| Output guarding | Medium (detects post-hoc) | 10-100ms | Medium |
| ML-based detection | Very High (novel patterns) | 50-200ms | High (model maintenance) |

## Performance Considerations

- Pattern detection: 5-50ms depending on number of patterns and input length
- Output guarding: 10-100ms for LLM-based response evaluation
- Tool argument validation: <1ms (local validation)
- Total defense overhead: ~20-200ms per request — acceptable for most applications

## Production Considerations

- Layer defenses — no single layer is sufficient
- Test defenses with adversarial prompts (red teaming)
- Monitor injection detection rate — rising rate indicates active attack
- Log all blocked prompts for analysis — improve detection patterns based on real attacks
- Implement emergency kill switch — disable AI features if injection attack is detected at scale
- Stay current with OWASP LLM Top 10 — new attack vectors emerge quarterly

## Common Mistakes

- Relying solely on prompt engineering for injection defense — LLMs cannot reliably distinguish instructions from data
- No input sanitization on retrieved documents — indirect injection via RAG is the most common attack vector
- Tool schemas without validation — LLM can inject arbitrary function arguments
- No output scanning — successful injections go undetected until damage is done
- Assuming a managed API (OpenAI, Anthropic) handles injection defense — they do not
- Whitelisting instead of blacklisting — attackers bypass blacklists with novel patterns

## Failure Modes

- **False positive**: Legitimate prompt blocked as injection — frustrates users. Tune detection sensitivity.
- **False negative**: Novel injection bypasses pattern detection — ML-based detection catches some, but not all
- **Defense bypass via RAG**: Attacker embeds injection in documents that the LLM ingests — indirect injection defense is harder than direct
- **Multimodal injection**: Instructions hidden in images bypass text-based pattern detection
- **Tool chain injection**: Injected tool calls trigger destructive operations despite input sanitization

## Ecosystem Usage

- `fr3on/laravel-guardrail`: Prompt injection detection middleware, configurable patterns (Apr 2026)
- `MrPunyapal/laravel-ai-aegis`: Comprehensive security suite — injection detection + PII redaction + output guarding (Mar 2026)
- `subhashladumor1/laravel-ai-guard`: Budget enforcement + injection defense
- OWASP LLM Prompt Injection Prevention Cheat Sheet: reference standard
- Psalm plugin #484: Proposed taint analysis for LLM-influenced code paths

## Related Knowledge Units

- KU-035: PII Pseudonymization
- KU-036: Output Guarding & Validation
- KU-037: Tool Argument Validation
- KU-038: Psalm Taint Analysis
- KU-039: OWASP LLM Top 10 Compliance

## Research Notes

- OWASP LLM01:2025 ranks prompt injection as the #1 risk for the second consecutive year
- 73% of production AI deployments have prompt injection vulnerabilities (2026 audit data)
- Laravel AI SDK has zero built-in injection defense — all security is community-package or custom
- No standardized benchmark compares Aegis vs Guardrail efficacy (identified knowledge gap)
- Microsoft's defense-in-depth strategy for indirect prompt injection is the industry reference model
