# Structure Rationale

This folder architecture organizes the Application Architecture Patterns domain into a discoverable, non-overlapping hierarchy that maps to how Laravel developers encounter and reason about architectural decisions. The top-level division follows the natural progression from broad organizational principles (Code Organization Standards) through specific implementation patterns (Layered Architecture, Modular Monolith, Service Layer), to cross-cutting concerns (Communication Patterns, Architecture Governance). Each subdomain groups closely related knowledge units that a developer would typically learn together or reference as a cluster.

The tree is designed to support both linear learning (Foundation → Intermediate → Advanced) and just-in-time reference (a developer looking for "how to enforce module boundaries" finds it under Architecture Governance rather than having to scan multiple subdomains). File names within each KU folder are chosen to be self-explanatory for browsing, with `README.md` at each subdomain level providing an index and summary of the contained KUs.

The structure intentionally avoids deep nesting (max 4 levels: Domain → Subdomain → KU → files) to remain navigable in both IDE file trees and documentation browsers. The KU identifiers (COS-01, LAP-05, etc.) are included in directory names for unambiguous cross-referencing but are secondary to descriptive names.

# Proposed ECC Folder Tree

```
application-architecture-patterns/
├── domain-analysis.md
├── folder-architecture.md
│
├── 01-code-organization-standards/
│   ├── README.md
│   ├── COS-01-default-laravel-structure/
│   │   ├── README.md
│   │   ├── directory-layout-reference.md
│   │   └── strengths-and-limitations.md
│   ├── COS-02-layer-based-organization/
│   │   ├── README.md
│   │   └── when-to-group-by-layer.md
│   ├── COS-03-psr4-autoloading/
│   │   ├── README.md
│   │   └── custom-namespace-mapping.md
│   ├── COS-04-namespace-conventions/
│   │   ├── README.md
│   │   └── directory-to-namespace-rules.md
│   ├── COS-05-feature-based-organization/
│   │   ├── README.md
│   │   └── vertical-slice-structure.md
│   ├── COS-06-domain-based-organization/
│   │   ├── README.md
│   │   └── app-domains-structure.md
│   ├── COS-07-hybrid-approach/
│   │   ├── README.md
│   │   └── domains-inside-defaults.md
│   ├── COS-08-naming-conventions/
│   │   ├── README.md
│   │   └── class-file-directory-rules.md
│   ├── COS-09-when-to-deviate/
│   │   ├── README.md
│   │   └── decision-framework.md
│   ├── COS-10-team-scale-strategies/
│   │   ├── README.md
│   │   └── org-structures-for-10-plus-engineers.md
│   ├── COS-11-monorepo-vs-multirepo/
│   │   ├── README.md
│   │   └── tradeoff-analysis.md
│   └── COS-12-file-placement-decision-trees/
│       ├── README.md
│       └── where-does-this-code-go.md
│
├── 02-layered-architecture-patterns/
│   ├── README.md
│   ├── LAP-01-three-layer-architecture/
│   │   ├── README.md
│   │   └── presentation-business-data-overview.md
│   ├── LAP-02-clean-architecture/
│   │   ├── README.md
│   │   └── four-layer-domain-app-infra-presentation.md
│   ├── LAP-03-hexagonal-architecture/
│   │   ├── README.md
│   │   └── ports-and-adapters-pattern.md
│   ├── LAP-04-dependency-rule/
│   │   ├── README.md
│   │   └── inward-dependency-enforcement.md
│   ├── LAP-05-domain-layer/
│   │   ├── README.md
│   │   └── entities-value-objects-domain-services.md
│   ├── LAP-06-application-layer/
│   │   ├── README.md
│   │   └── use-cases-dtos-orchestration.md
│   ├── LAP-07-infrastructure-layer/
│   │   ├── README.md
│   │   └── eloquent-adapters-external-integrations.md
│   ├── LAP-08-presentation-layer/
│   │   ├── README.md
│   │   └── controllers-requests-resources-routes.md
│   ├── LAP-09-framework-independence/
│   │   ├── README.md
│   │   └── pure-php-domain-in-practice.md
│   ├── LAP-10-domain-entity-mapping/
│   │   ├── README.md
│   │   └── mapping-between-entities-and-eloquent.md
│   ├── LAP-11-transaction-boundaries/
│   │   ├── README.md
│   │   └── where-transactions-belong-in-layers.md
│   ├── LAP-12-incremental-migration/
│   │   ├── README.md
│   │   └── from-mvc-to-layered-architecture.md
│   ├── LAP-13-architecture-tests/
│   │   ├── README.md
│   │   └── pest-phpunit-layer-enforcement.md
│   ├── LAP-14-real-world-tradeoffs/
│   │   ├── README.md
│   │   └── when-clean-architecture-pays-off.md
│   └── LAP-15-octane-compatibility/
│       ├── README.md
│       └── stateful-services-and-persistence.md
│
├── 03-modular-monolith-design/
│   ├── README.md
│   ├── MMD-01-module-vs-microservice/
│   │   ├── README.md
│   │   └── definitions-and-key-differences.md
│   ├── MMD-02-boundary-identification/
│   │   ├── README.md
│   │   └── bounded-context-heuristics.md
│   ├── MMD-03-module-internal-structure/
│   │   ├── README.md
│   │   └── module-convention-templates.md
│   ├── MMD-04-module-registration/
│   │   ├── README.md
│   │   └── discovery-and-registration-mechanisms.md
│   ├── MMD-05-module-autonomy/
│   │   ├── README.md
│   │   └── routes-migrations-tests-per-module.md
│   ├── MMD-06-sync-inter-module-communication/
│   │   ├── README.md
│   │   └── contracts-and-interface-communication.md
│   ├── MMD-07-async-inter-module-communication/
│   │   ├── README.md
│   │   └── event-driven-module-communication.md
│   ├── MMD-08-shared-kernel/
│   │   ├── README.md
│   │   └── what-belongs-in-shared-vs-modules.md
│   ├── MMD-09-module-dependency-management/
│   │   ├── README.md
│   │   └── declaring-and-enforcing-dependencies.md
│   ├── MMD-10-cross-module-data-access/
│   │   ├── README.md
│   │   └── patterns-without-cross-table-joins.md
│   ├── MMD-11-module-extraction-path/
│   │   ├── README.md
│   │   └── from-module-to-independent-service.md
│   ├── MMD-12-isolation-enforcement/
│   │   ├── README.md
│   │   └── linting-ci-violation-detection.md
│   ├── MMD-13-database-schema-ownership/
│   │   ├── README.md
│   │   └── table-naming-schema-per-module.md
│   ├── MMD-14-multi-tenancy/
│   │   ├── README.md
│   │   └── tenant-isolation-in-modular-monolith.md
│   ├── MMD-15-event-sourcing-cqrs/
│   │   ├── README.md
│   │   └── advanced-patterns-in-modular-context.md
│   ├── MMD-16-testing-strategies/
│   │   ├── README.md
│   │   └── testing-module-bounds-and-contracts.md
│   └── MMD-17-modular-vs-microservices-decision/
│       ├── README.md
│       └── decision-framework.md
│
├── 04-service-layer-patterns/
│   ├── README.md
│   ├── SLP-01-service-classes/
│   │   ├── README.md
│   │   └── grouping-operations-by-entity.md
│   ├── SLP-02-action-classes/
│   │   ├── README.md
│   │   └── single-operation-per-class.md
│   ├── SLP-03-controller-thinning/
│   │   ├── README.md
│   │   └── what-to-extract-what-to-keep.md
│   ├── SLP-04-service-action-repository-pyramid/
│   │   ├── README.md
│   │   └── layered-communication-flow.md
│   ├── SLP-05-dto-pattern/
│   │   ├── README.md
│   │   └── structured-data-transfer.md
│   ├── SLP-06-use-case-classes/
│   │   ├── README.md
│   │   └── business-intent-with-dto-contracts.md
│   ├── SLP-07-service-naming-methods/
│   │   ├── README.md
│   │   └── conventions-for-method-design.md
│   ├── SLP-08-action-naming/
│   │   ├── README.md
│   │   └── verb-noun-command-convention.md
│   ├── SLP-09-dependency-injection/
│   │   ├── README.md
│   │   └── injecting-services-actions-repositories.md
│   ├── SLP-10-service-action-usecase-decision/
│   │   ├── README.md
│   │   └── decision-criteria-and-comparison.md
│   ├── SLP-11-transaction-management/
│   │   ├── README.md
│   │   └── where-transactions-belong.md
│   ├── SLP-12-service-binding-strategies/
│   │   ├── README.md
│   │   └── singleton-vs-transient-in-container.md
│   ├── SLP-13-interface-contracts/
│   │   ├── README.md
│   │   └── when-and-why-for-services.md
│   ├── SLP-14-repository-pattern-debate/
│   │   ├── README.md
│   │   └── value-vs-overhead-analysis.md
│   ├── SLP-15-repository-feature-vs-generic/
│   │   ├── README.md
│   │   └── feature-oriented-approach.md
│   ├── SLP-16-query-objects/
│   │   ├── README.md
│   │   └── alternative-to-repositories.md
│   ├── SLP-17-service-layer-testing/
│   │   ├── README.md
│   │   └── test-strategies-for-each-pattern.md
│   ├── SLP-18-anemic-domain-model/
│   │   ├── README.md
│   │   └── avoiding-logicless-service-layers.md
│   └── SLP-19-octane-service-state/
│       ├── README.md
│       └── stateless-service-design.md
│
├── 05-domain-boundaries-bounded-contexts/
│   ├── README.md
│   ├── DBC-01-context-identification/
│   │   ├── README.md
│   │   └── language-teams-data-heuristics.md
│   ├── DBC-02-context-mapping/
│   │   ├── README.md
│   │   └── relationship-patterns-between-contexts.md
│   ├── DBC-03-shared-kernel/
│   │   ├── README.md
│   │   └── minimal-shared-code-design.md
│   ├── DBC-04-anti-corruption-layer/
│   │   ├── README.md
│   │   └── protecting-boundaries-from-legacy.md
│   ├── DBC-05-model-ownership/
│   │   ├── README.md
│   │   └── which-context-owns-which-model.md
│   ├── DBC-06-schema-per-context/
│   │   ├── README.md
│   │   └── database-organization-strategies.md
│   ├── DBC-07-cross-context-queries/
│   │   ├── README.md
│   │   └── querying-without-joining-across-contexts.md
│   ├── DBC-08-evolutionary-boundaries/
│   │   ├── README.md
│   │   └── splitting-contexts-over-time.md
│   ├── DBC-09-team-to-context-mapping/
│   │   ├── README.md
│   │   └── conways-law-in-architecture.md
│   ├── DBC-10-legacy-integration/
│   │   ├── README.md
│   │   └── strangler-fig-and-anti-corruption.md
│   ├── DBC-11-multi-context-transactions/
│   │   ├── README.md
│   │   └── saga-patterns-and-compensating-actions.md
│   └── DBC-12-eventual-consistency/
│       ├── README.md
│       └── managing-consistency-across-bounds.md
│
├── 06-communication-patterns-contracts/
│   ├── README.md
│   ├── CPC-01-interface-contracts/
│   │   ├── README.md
│   │   └── defining-inter-module-contracts.md
│   ├── CPC-02-domain-events-basics/
│   │   ├── README.md
│   │   └── definition-dispatch-handling.md
│   ├── CPC-03-sync-vs-queued-events/
│   │   ├── README.md
│   │   └── when-to-use-each-strategy.md
│   ├── CPC-04-event-design/
│   │   ├── README.md
│   │   └── naming-payloads-versioning-schemas.md
│   ├── CPC-05-message-bus/
│   │   ├── README.md
│   │   └── bus-implementation-and-abstraction.md
│   ├── CPC-06-circuit-breaker/
│   │   ├── README.md
│   │   └── resilience-in-module-communication.md
│   ├── CPC-07-bridge-adapter-pattern/
│   │   ├── README.md
│   │   └── typed-module-communication-bridges.md
│   ├── CPC-08-cqrs-pattern/
│   │   ├── README.md
│   │   └── command-query-separation-strategies.md
│   ├── CPC-09-event-sourcing/
│   │   ├── README.md
│   │   └── architectural-implications-and-tradeoffs.md
│   ├── CPC-10-outbox-pattern/
│   │   ├── README.md
│   │   └── reliable-event-publication.md
│   ├── CPC-11-distributed-tracing/
│   │   ├── README.md
│   │   └── tracing-across-module-boundaries.md
│   └── CPC-12-facade-pattern-risks/
│       ├── README.md
│       └── when-facades-harm-architecture.md
│
└── 07-architecture-enforcement-governance/
    ├── README.md
    ├── AEG-01-architecture-testing/
    │   ├── README.md
    │   └── pest-phpunit-layer-tests.md
    ├── AEG-02-ci-enforcement/
    │   ├── README.md
    │   └── pipeline-checks-for-architecture.md
    ├── AEG-03-static-analysis-rules/
    │   ├── README.md
    │   └── phpstan-psalm-custom-rules.md
    ├── AEG-04-code-review-guardrails/
    │   ├── README.md
    │   └── architectural-review-checklist.md
    ├── AEG-05-import-violation-detection/
    │   ├── README.md
    │   └── automated-boundary-checks.md
    ├── AEG-06-architecture-decision-records/
    │   ├── README.md
    │   └── adr-template-and-examples.md
    ├── AEG-07-team-convention-documentation/
    │   ├── README.md
    │   └── documenting-architectural-rules.md
    ├── AEG-08-drift-detection/
    │   ├── README.md
    │   └── monitoring-architecture-degradation.md
    ├── AEG-09-refactoring-remediation/
    │   ├── README.md
    │   └── fixing-architectural-violations.md
    └── AEG-10-onboarding-documentation/
        ├── README.md
        └── onboarding-new-devs-to-architecture.md
```

# Domain → Subdomain Mapping

| Domain | Subdomain | Primary Focus |
|--------|-----------|---------------|
| Application Architecture Patterns | Code Organization Standards | Where files go and how they're named |
| Application Architecture Patterns | Layered Architecture Patterns | Horizontal separation of concerns with dependency rules |
| Application Architecture Patterns | Modular Monolith Design | Domain-aligned module boundaries within single deployment |
| Application Architecture Patterns | Service Layer Patterns | Business logic extraction from controllers into classes |
| Application Architecture Patterns | Domain Boundaries and Bounded Contexts | Identifying and maintaining seams between business domains |
| Application Architecture Patterns | Communication Patterns and Contracts | How architectural components talk to each other |
| Application Architecture Patterns | Architecture Enforcement and Governance | Ensuring architectural decisions persist over time |

# Future Growth Considerations

1. **Subdomain extraction boundaries**: If the Service Layer Patterns subdomain grows beyond ~20 KUs, consider extracting Repository Pattern (SLP-14, SLP-15) and DTO/Use Case patterns (SLP-05, SLP-06) into their own sibling subdomains. Similarly, if CQRS continues to grow within Communication Patterns, it may warrant its own subdomain.

2. **Package-specific subdomains**: As the number of architecture-scaffolding packages grows (Modulate, laravel-brick, etc.), consider a `08-package-comparison-guides/` subdomain that catalogs each package's approach to module boundaries, discovery, and enforcement rather than repeating this within every KU.

3. **Decision framework consolidation**: Several subdomains have decision framework KUs (COS-09, SLP-10, MMD-17, SLP-14). If these accumulate, a consolidated `08-architectural-decision-framework/` subdomain with cross-cutting decision trees may reduce duplication.

4. **Octane as a cross-cutting concern**: Octane compatibility currently appears as LAP-15 and SLP-19. If Octane-specific architectural guidance grows significantly, consider a dedicated subdomain for Octane-native architecture patterns.

5. **Multi-tenancy depth**: Currently represented as MMD-14 within modular monolith. If multi-tenancy strategies for Laravel architecture merit deeper coverage, consider splitting into a child domain or separate entry in the ECC master registry.

6. **Architecture migration patterns**: The incremental migration KUs (LAP-12, AEG-09, DBC-08) address moving between architectural states. If migration guidance becomes a primary use case, a dedicated `architecture-migration-playbooks` subdomain could capture before/after state mappings and step-by-step transition strategies.

7. **AI-assisted architecture tooling**: As AI code generation improves, new KUs around "architecture-preserving prompts" and "generated code boundary validation" may emerge under the Architecture Enforcement subdomain.

8. **Directory growth limits**: At ~100 KU directories, this tree is near the upper limit for comfortable IDE browsing. If future research adds significant new KUs, consider consolidating less granular subdomains (e.g., merging Communication Patterns into Modular Monolith and Domain Boundaries) to maintain navigability.
