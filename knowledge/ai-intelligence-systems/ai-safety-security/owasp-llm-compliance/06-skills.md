# Skills

## Skill 1: Conduct OWASP LLM Top 10 security review with supply chain verification

### Purpose
Implement OWASP LLM Top 10 (2025) compliance across all 10 risk categories for Laravel AI applications, with pinned checksum-verified AI dependencies, security reviews at every dependency update, and defense-in-depth guardrails for the highest-priority risk: prompt injection.

### When To Use
- Use when deploying AI features to production with security compliance requirements
- Use when preparing for security audit or penetration testing of AI system
- Use when integrating third-party AI packages or provider SDKs
- Use when updating AI dependencies (provider SDK, gateway, guard libraries)
- Use when building AI features for regulated industries (healthcare, finance, legal)

### When NOT To Use
- Do NOT use for experimental or prototype AI projects with no real data
- Do NOT use when AI dependencies are not updated (security review not needed)
- Do NOT use when the application has no AI security requirements

### Prerequisites
- Understanding of all 10 OWASP LLM risk categories
- AI dependency inventory (provider SDKs, gateway packages, guard libraries)
- Dependency pinning with checksum verification (composer.lock)
- Security review checklist templated for AI dependencies
- Vulnerability scanning tools (composer audit, Dependabot, Snyk)

### Inputs
- OWASP LLM Top 10 (2025) framework documentation
- AI dependency list with versions and checksums
- Current security controls inventory (middleware, guards, access controls)
- Planned dependency update details

### Workflow
1. Map each OWASP LLM category to specific controls in the application:
   - LLM01 Prompt Injection: Input sanitization, injection detection, tool validation, output guarding
   - LLM02 Sensitive Information Disclosure: PII pseudonymization, output guarding, context filtering
   - LLM03 Supply Chain: AI-BOM/SBOM, dependency pinning, hash verification
   - LLM04 Data/Model Poisoning: Cryptographic verification of RAG documents, zero-trust context
   - LLM05 Improper Output Handling: Treat all LLM output as hostile, sandbox execution
   - LLM06 Excessive Agency: Least-privilege tools, JIT ephemeral tokens, human-in-the-loop
   - LLM07 System Prompt Leakage: Output guard detection, prompt hardening
   - LLM08 Vector/TopK Weakness: Secure embedding storage, access controls on vector DB
   - LLM09 Misinformation: Factual consistency checks, confidence scoring
   - LLM10 Unbounded Consumption: Budget enforcement, rate limiting, cost tracking
2. Pin all AI dependencies to exact versions with checksum verification in composer.lock
3. Schedule OWASP-focused security reviews at every major dependency update
4. Maintain an AI Bill of Materials (AI-BOM/SBOM) listing all AI dependencies
5. Run `composer audit` in CI to detect known vulnerabilities
6. Implement penetration testing for prompt injection (red-team the AI features)
7. Document compliance evidence for each OWASP category
8. Review and update security controls quarterly

### Validation Checklist
- [ ] All 10 OWASP LLM categories are addressed with specific controls
- [ ] AI dependencies are pinned to exact versions with checksum verification
- [ ] Security review is scheduled for every major dependency update
- [ ] AI-BOM/SBOM is maintained and version-controlled
- [ ] composer audit runs in CI and fails on known vulnerabilities
- [ ] Prompt injection penetration testing is completed
- [ ] PII pseudonymization is implemented for sensitive data
- [ ] Least-privilege tool access is enforced for all agents
- [ ] Budget enforcement prevents unbounded consumption
- [ ] Compliance evidence is documented for each category
- [ ] Quarterly review schedule is established

### Common Failures
- **LLM01 bypass**: No injection detection — most common and highest-risk failure
- **LLM03 ignored**: Unpinned dependency auto-updates to malicious version
- **LLM05 overlooked**: LLM output used directly in SQL queries or shell commands
- **LLM06 unchecked**: Agent has access to delete data without human-in-the-loop
- **LLM10 unaddressed**: No budget limits — agent loop exhausts monthly budget in minutes
- **Stale compliance**: Security review only at initial deploy, not at dependency updates

### Decision Points
- **Compliance depth**: Full OWASP compliance vs. minimal for low-risk applications
- **Review frequency**: Per dependency update vs. quarterly — more frequent for fast-moving AI ecosystem
- **Pentest approach**: Automated (LLM red-teaming tools) vs. manual (security consultant)
- **SBOM detail**: Full AI-BOM (all model, data, and dependency artifacts) vs. dependency-only

### Performance Considerations
- Security controls add latency: injection detection (5-50ms), PII scanning (5-500ms), output guarding (10-500ms)
- Batch compliance checks can run asynchronously (not in request path)
- SBOM generation is a CI task, not a runtime concern
- Dependency audit adds 10-30s to CI pipeline

### Security Considerations
- Supply chain attacks on AI packages are increasing — pinned checksums are essential
- SBOM should not expose internal vulnerabilities in public documents
- OWASP compliance documentation should be treated as confidential
- Penetration test findings should be tracked and remediated with priority
- Security controls should be tested after every dependency update

### Related Rules
- R1: Conduct OWASP LLM-specific security reviews at every major dependency update
- R2: Implement supply chain security for AI dependencies via pinned checksum-verified downloads

### Related Skills
- Implement prompt injection defense with semantic firewalls
- Implement multi-stage output guarding with programmatic post-processing
- Configure PII pseudonymization for AI prompts and responses
- Implement tool argument validation with strict schemas
- Implement budget enforcement with pre-flight cost estimation

### Success Criteria
- All 10 OWASP LLM categories have documented, implemented controls
- AI dependencies are pinned with checksum verification and audited in CI
- Security reviews are conducted before every major dependency update
- Penetration testing for prompt injection passes (no critical findings)
- SBOM/AI-BOM is maintained and reviewed quarterly
- No security incidents related to OWASP LLM categories
- Compliance documentation is ready for security audit at any time
