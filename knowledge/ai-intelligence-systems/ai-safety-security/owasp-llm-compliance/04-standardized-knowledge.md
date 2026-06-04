---
id: KU-039
title: "OWASP LLM Top 10 Compliance"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/11-ai-safety-security/owasp-llm-compliance/04-standardized-knowledge.md"
---

# OWASP LLM Top 10 Compliance

## Overview

The OWASP Top 10 for LLM Applications (2025 edition) is the primary security framework for AI-powered applications. It covers 10 risk categories from prompt injection to model theft. Laravel AI applications must address all 10 risks, with prompt injection (LLM01) being the highest priority. Compliance requires defense-in-depth across input validation, access control, output guarding, and observability.

## Core Concepts

- **LLM01: Prompt Injection**: Attacker input overrides system instructions. Mitigation: input sanitization, injection detection, least-privilege tools
- **LLM02: Sensitive Information Disclosure**: Model leaks PII or secrets. Mitigation: PII pseudonymization, output guarding, context filtering
- **LLM03: Supply Chain**: Compromised third-party models or packages. Mitigation: AI-BOM/SBOM, dependency pinning, package hash verification
- **LLM04: Data and Model Poisoning**: Attacker corrupts training data or RAG context. Mitigation: cryptographic verification of datasets, zero-trust for RAG documents
- **LLM05: Improper Output Handling**: Blindly executing model output. Mitigation: treat all LLM output as hostile, sandbox execution
- **LLM06: Excessive Agency**: Giving AI too many permissions. Mitigation: least-privilege, JIT ephemeral tokens, human-in-the-loop
- **LLM07: System Prompt Leakage**: Exposing prompts containing backend logic. Mitigation: keep secrets out of prompts, context filtering
- **LLM08: Vector and Embedding Weaknesses**: Exploiting semantic search/RAG architectures. Mitigation: strict namespace segregation in vector DBs
- **LLM09: Misinformation**: Blindly trusting AI hallucinations. Mitigation: RAG grounding, citation verification, human review
- **LLM10: Model Theft**: Unauthorized access to model weights or API. Mitigation: API key rotation, rate limiting, access audits

## When To Use

- Production applications requiring OWASP LLM Top 10 Compliance functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **OWASP-by-default**: Address each OWASP LLM risk during initial architecture, not as afterthought
- **Risk-to-control mapping**: Document each risk â†’ specific control implemented â†’ test that validates it
- **Penetration testing**: Regular red-teaming against OWASP LLM categories
- **Compliance dashboard**: Track coverage of OWASP LLM controls per environment
- **Continuous monitoring**: Alert on gaps â€” new features may introduce unaddressed risks

- **Security checklist for AI**: Like OWASP Top 10 for web applications â€” a standard framework to ensure you've addressed the most important risks before going to production.
- **Compliance baseline**: Not optional â€” security auditors and penetration testers will check against OWASP LLM Top 10. Gap = compliance failure.

## Architecture Guidelines

- **Decision**: OWASP LLM 2025 as standard vs. custom framework â†’ OWASP LLM Top 10. Reason: Industry standard, auditor-recognized, community-maintained. Custom framework would lack benchmarking.
- **Decision**: Automated controls vs. manual review â†’ Automated controls for LLM01-08 (technical controls). Manual review for LLM09 (misinformation) and critical decisions.

## Performance Considerations

- Full OWASP LLM defense stack: ~100-500ms added latency per request
- Most latency from content moderation and LLM-based semantic checks
- Static controls (schema validation, tool scoping) add negligible latency
- Caching and selective enforcement reduce overhead for low-risk requests

| Risk | Control Effort | Residual Risk | Cost |
|------|---------------|---------------|------|
| Prompt injection | High (multiple layers) | Medium (novel bypasses) | Medium |
| Data disclosure | Medium (PII scanning) | Low | Low |
| Excessive agency | Low (scoping tools) | Low | Low |
| Misinformation | High (RAG + validation) | Medium | High |
| Supply chain | Low (SBOM) | Low | Low |

## Security Considerations

- Include OWASP LLM Top 10 compliance in security review checklist
- Map each OWASP LLM risk to specific code controls and tests
- Configure per-environment control strictness â€” dev may have looser controls than production
- Implement automated scanning for OWASP LLM controls in CI/CD pipeline
- Train security team on OWASP LLM Top 10 â€” different from traditional web app security
- Maintain risk register â€” track which OWASP LLM risks are addressed and residual risk level

## Common Mistakes

- Only addressing prompt injection (LLM01) and ignoring other 9 risks
- Treating OWASP LLM compliance as checkbox exercise without actual control implementation
- Assuming cloud AI provider handles security â€” provider handles infrastructure, not application-level risks
- No supply chain security for AI packages (LLM03) â€” third-party AI packages introduce risk
- Excessive agency (LLM06) â€” giving agents access to tools they don't need "just in case"
- Not updating controls for new OWASP LLM versions â€” the framework evolves

## Anti-Patterns

- **OWASP audit failure**: Missing controls on any of the 10 risks â€” compliance failure for regulated industries
- **Control bypass**: Novel attack not covered by OWASP LLM standard â€” supplement with custom controls
- **Risk evolution**: New risks emerge that OWASP LLM hasn't covered â€” monitor security research
- **Control erosion**: Feature changes remove controls without awareness â€” include OWASP review in code review process
- **Over-reliance on OWASP**: Standard doesn't cover all possible risks â€” complement with threat modeling

## Examples

The following ecosystem packages provide reference implementations:

- OWASP LLM Prompt Injection Prevention Cheat Sheet: reference implementation guide
- OWASP LLM Verification Standard: testing methodology for LLM controls
- Community packages (Guardrail, Aegis) map to specific OWASP LLM controls
- Laravel AI application security review checklist should reference OWASP LLM categories
- SOC 2 and ISO 27001 audits increasingly include OWASP LLM controls in scope

## Related Topics

- KU-034: Prompt Injection Defense
- KU-035: PII Pseudonymization
- KU-036: Output Guarding & Validation
- KU-037: Tool Argument Validation
- KU-038: Psalm Taint Analysis

## AI Agent Notes

- When asked about OWASP LLM Top 10 Compliance, first determine the specific use case and requirements.
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

