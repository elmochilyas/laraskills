# Folder Architecture: Governance & Compliance Engineering

## Structure Rationale

This folder architecture organizes the Governance & Compliance Engineering domain into a discoverable, non-overlapping hierarchy that maps to how Laravel developers encounter and reason about compliance and regulatory concerns. The top-level division follows the natural progression from core compliance foundations (audit trails, GDPR) through specific enforcement mechanisms (access control, policy-as-code), to cross-cutting concerns (data sovereignty, SLA management, multi-tenant compliance).

The tree is designed to support both linear learning (Foundation → Intermediate → Advanced) and just-in-time reference (a developer looking for "how to implement data retention" finds it under Data Retention rather than having to scan multiple subdomains). File names within each KU folder are chosen to be self-explanatory for browsing, with each KU directory containing `04-standardized-knowledge.md` as the canonical knowledge document.

The structure intentionally avoids deep nesting (max 4 levels: Domain → Subdomain → KU → files) to remain navigable in both IDE file trees and documentation browsers.

## Proposed ECC Folder Tree

```
governance-compliance-engineering/
├── domain-analysis.md
├── folder-architecture.md
│
├── access-control-authorization/
│   ├── laravel-gates-policies/
│   │   └── 04-standardized-knowledge.md
│   ├── spatie-permission/
│   │   └── 04-standardized-knowledge.md
│   └── opa-openpolicyagent/
│       └── 04-standardized-knowledge.md
│
├── audit-trails-activity-logging/
│   ├── spatie-activitylog-v5/
│   │   └── 04-standardized-knowledge.md
│   ├── laravel-audit-chain/
│   │   └── 04-standardized-knowledge.md
│   ├── dineshstack-audit/
│   │   └── 04-standardized-knowledge.md
│   ├── williamug-audited/
│   │   └── 04-standardized-knowledge.md
│   ├── iamfarhad-audit-log/
│   │   └── 04-standardized-knowledge.md
│   ├── beakaudit-audit-logging/
│   │   └── 04-standardized-knowledge.md
│   ├── ss-ipg-auditable/
│   │   └── 04-standardized-knowledge.md
│   └── bradietilley-audit-logs/
│       └── 04-standardized-knowledge.md
│
├── compliance-automation-policy-as-code/
│   ├── cicd-policy-gates/
│   │   └── 04-standardized-knowledge.md
│   ├── evidence-collection-automation/
│   │   └── 04-standardized-knowledge.md
│   ├── unified-control-mapping/
│   │   └── 04-standardized-knowledge.md
│   └── compliance-attestation-pdf/
│       └── 04-standardized-knowledge.md
│
├── data-classification-sovereignty/
│   ├── three-tier-classification/
│   │   └── 04-standardized-knowledge.md
│   └── byok-hyok-encryption/
│       └── 04-standardized-knowledge.md
│
├── data-retention-anonymization/
│   ├── laravel-prunable-trait/
│   │   └── 04-standardized-knowledge.md
│   ├── retainable-contract-pattern/
│   │   └── 04-standardized-knowledge.md
│   └── laravel-data-scrubber/
│       └── 04-standardized-knowledge.md
│
├── feature-flag-governance/
│   ├── laravel-pennant/
│   │   └── 04-standardized-knowledge.md
│   ├── launchdarkly/
│   │   └── 04-standardized-knowledge.md
│   ├── growthbook/
│   │   └── 04-standardized-knowledge.md
│   ├── unleash/
│   │   └── 04-standardized-knowledge.md
│   └── configcat/
│       └── 04-standardized-knowledge.md
│
├── gdpr-regulatory-compliance/
│   ├── rylxes-laravel-gdpr/
│   │   └── 04-standardized-knowledge.md
│   ├── laravel-ai-act-compliance/
│   │   └── 04-standardized-knowledge.md
│   ├── dialect-gdpr-compliance/
│   │   └── 04-standardized-knowledge.md
│   ├── soved-laravel-gdpr/
│   │   └── 04-standardized-knowledge.md
│   ├── sellinnate-gdpr-consent/
│   │   └── 04-standardized-knowledge.md
│   └── foothing-gdpr-consent/
│       └── 04-standardized-knowledge.md
│
├── multi-region-multi-tenant-compliance/
│   ├── isolation-strategies/
│   │   └── 04-standardized-knowledge.md
│   └── data-residency-tenants/
│       └── 04-standardized-knowledge.md
│
├── owasp-compliance/
│   ├── owasp-top-10-2025/
│   │   └── 04-standardized-knowledge.md
│   ├── security-headers/
│   │   └── 04-standardized-knowledge.md
│   └── laravel-security-hardening/
│       └── 04-standardized-knowledge.md
│
└── sla-management/
    ├── escalated-laravel/
    │   └── 04-standardized-knowledge.md
    ├── laravel-service-desk/
    │   └── 04-standardized-knowledge.md
    ├── queue-autoscale-sla/
    │   └── 04-standardized-knowledge.md
    └── sla-timer/
        └── 04-standardized-knowledge.md
```

## Domain → Subdomain Mapping

| Domain | Subdomain | Primary Focus |
|--------|-----------|---------------|
| Governance & Compliance Engineering | Access Control & Authorization | Laravel gates, Spatie permissions, OPA/Rego policy engines |
| Governance & Compliance Engineering | Audit Trails & Activity Logging | Immutable audit logs, chain verification, activity tracking packages |
| Governance & Compliance Engineering | Compliance Automation & Policy-as-Code | CI/CD policy gates, evidence collection, control mapping, attestation |
| Governance & Compliance Engineering | Data Classification & Sovereignty | Tiered classification, BYOK/HYOK encryption, region enforcement |
| Governance & Compliance Engineering | Data Retention & Anonymization | Pruning, anonymization, PII scrubbing, retention scheduling |
| Governance & Compliance Engineering | Feature Flag Governance | Pennant, LaunchDarkly, flag lifecycle management, stale detection |
| Governance & Compliance Engineering | GDPR & Regulatory Compliance | DSAR, consent management, erasure workflows, AI Act compliance |
| Governance & Compliance Engineering | Multi-Region & Multi-Tenant Compliance | Isolation strategies, data residency, cross-jurisdiction rules |
| Governance & Compliance Engineering | OWASP Compliance | OWASP Top 10, security headers, Laravel hardening |
| Governance & Compliance Engineering | SLA Management | Breach detection, escalation, service desk integration, SLA timers |

## Future Growth Considerations

1. **Subdomain extraction boundaries**: If the Audit Trails subdomain grows beyond ~15 KUs, consider splitting package-specific KUs (Spatie, Audit Chain, etc.) into tool-specific subdirectories under a common parent.

2. **AI compliance expansion**: As AI Act and AI governance requirements evolve, consider extracting AI-specific compliance KUs into a dedicated `ai-governance-compliance/` subdomain.

3. **Cross-domain integration**: Multi-tenant compliance naturally intersects with both the Multi-Tenancy patterns in Application Architecture and the Data Storage domains. Consider establishing cross-reference conventions rather than duplicating content.

4. **Real-time compliance monitoring**: As real-time compliance monitoring tools emerge (e.g., continuous control monitoring), consider adding a `continuous-compliance-monitoring/` subdomain.

5. **Zero-trust architecture**: Zero-trust security patterns increasingly overlap with compliance requirements. Consider whether a `zero-trust-compliance/` subdomain or cross-domain reference to Security & Identity Engineering is more appropriate.
