# Knowledge Unit: OWASP LLM Top 10 Compliance

## Metadata

- **ID:** KU-039
- **Subdomain:** AI Safety & Security
- **Slug:** owasp-llm-compliance
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

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

## Mental Models

- **Security checklist for AI**: Like OWASP Top 10 for web applications — a standard framework to ensure you've addressed the most important risks before going to production.
- **Compliance baseline**: Not optional — security auditors and penetration testers will check against OWASP LLM Top 10. Gap = compliance failure.

## Internal Mechanics

Each OWASP LLM risk maps to specific controls in a Laravel AI application. For example:

**LLM01 (Prompt Injection)**:
- Input sanitization middleware on all agent prompts
- Injection pattern detection (30+ patterns)
- Tool argument validation via schema
- Read-only database connections for query tools
- Output scanning for injection success indicators

**LLM06 (Excessive Agency)**:
- Each agent has minimum required tools
- Tools are scoped to authenticated user via constructor injection
- Human-in-the-loop for destructive actions
- `MaxSteps` attribute limits agent iteration count
- Audit log of all tool invocations

## Patterns

- **OWASP-by-default**: Address each OWASP LLM risk during initial architecture, not as afterthought
- **Risk-to-control mapping**: Document each risk → specific control implemented → test that validates it
- **Penetration testing**: Regular red-teaming against OWASP LLM categories
- **Compliance dashboard**: Track coverage of OWASP LLM controls per environment
- **Continuous monitoring**: Alert on gaps — new features may introduce unaddressed risks

## Architectural Decisions

- **Decision**: OWASP LLM 2025 as standard vs. custom framework → OWASP LLM Top 10. Reason: Industry standard, auditor-recognized, community-maintained. Custom framework would lack benchmarking.
- **Decision**: Automated controls vs. manual review → Automated controls for LLM01-08 (technical controls). Manual review for LLM09 (misinformation) and critical decisions.

## Tradeoffs

| Risk | Control Effort | Residual Risk | Cost |
|------|---------------|---------------|------|
| Prompt injection | High (multiple layers) | Medium (novel bypasses) | Medium |
| Data disclosure | Medium (PII scanning) | Low | Low |
| Excessive agency | Low (scoping tools) | Low | Low |
| Misinformation | High (RAG + validation) | Medium | High |
| Supply chain | Low (SBOM) | Low | Low |

## Performance Considerations

- Full OWASP LLM defense stack: ~100-500ms added latency per request
- Most latency from content moderation and LLM-based semantic checks
- Static controls (schema validation, tool scoping) add negligible latency
- Caching and selective enforcement reduce overhead for low-risk requests

## Production Considerations

- Include OWASP LLM Top 10 compliance in security review checklist
- Map each OWASP LLM risk to specific code controls and tests
- Configure per-environment control strictness — dev may have looser controls than production
- Implement automated scanning for OWASP LLM controls in CI/CD pipeline
- Train security team on OWASP LLM Top 10 — different from traditional web app security
- Maintain risk register — track which OWASP LLM risks are addressed and residual risk level

## Common Mistakes

- Only addressing prompt injection (LLM01) and ignoring other 9 risks
- Treating OWASP LLM compliance as checkbox exercise without actual control implementation
- Assuming cloud AI provider handles security — provider handles infrastructure, not application-level risks
- No supply chain security for AI packages (LLM03) — third-party AI packages introduce risk
- Excessive agency (LLM06) — giving agents access to tools they don't need "just in case"
- Not updating controls for new OWASP LLM versions — the framework evolves

## Failure Modes

- **OWASP audit failure**: Missing controls on any of the 10 risks — compliance failure for regulated industries
- **Control bypass**: Novel attack not covered by OWASP LLM standard — supplement with custom controls
- **Risk evolution**: New risks emerge that OWASP LLM hasn't covered — monitor security research
- **Control erosion**: Feature changes remove controls without awareness — include OWASP review in code review process
- **Over-reliance on OWASP**: Standard doesn't cover all possible risks — complement with threat modeling

## Ecosystem Usage

- OWASP LLM Prompt Injection Prevention Cheat Sheet: reference implementation guide
- OWASP LLM Verification Standard: testing methodology for LLM controls
- Community packages (Guardrail, Aegis) map to specific OWASP LLM controls
- Laravel AI application security review checklist should reference OWASP LLM categories
- SOC 2 and ISO 27001 audits increasingly include OWASP LLM controls in scope

## Related Knowledge Units

- KU-034: Prompt Injection Defense
- KU-035: PII Pseudonymization
- KU-036: Output Guarding & Validation
- KU-037: Tool Argument Validation
- KU-038: Psalm Taint Analysis

## Research Notes

- OWASP LLM Top 10 2025 edition reordered and consolidated from 2023 edition
- LLM01 (Prompt Injection) remains #1 for second consecutive edition
- New categories in 2025: LLM08 (Vector/Embedding Weaknesses), OWASP agent-specific guidance
- Munich Re 2026 risk report identifies prompt injection as "major attack vector"
- 73% of production LLM deployments have OWASP LLM gaps in security audits
- OWASP is developing a separate Top 10 for autonomous agent applications
