# Skill: Identify Module Boundaries Using Bounded Context Heuristics

## Purpose
Discover natural module boundaries by analyzing language divergence, change frequency, team ownership, and business capabilities. Use event storming with domain experts to validate boundaries before implementation.

## When To Use
- Designing a new modular monolith
- Refactoring an existing monolith into modules
- Evaluating whether current module boundaries are correct

## When NOT To Use
- Single-domain application where all concepts are tightly coupled
- Prototype where module boundaries are not yet discoverable

## Prerequisites
- Team with access to domain experts
- Understanding of bounded context concept
- Existing codebase or domain documentation to analyze

## Inputs
- Domain expert availability
- Existing domain documentation or codebase
- Current language/terminology across the business
- Change history from version control

## Workflow
1. **Facilitate an event storming workshop with domain experts and developers.** Map business events on a timeline (e.g., "Order Placed" → "Payment Received" → "Invoice Generated"). Group events by business capability. Natural groupings reveal bounded contexts.

2. **Identify language divergence.** Find terms that mean different things in different contexts (e.g., "Customer" in Billing vs Support). Language divergence is the clearest boundary signal. Document each term with its context-specific definition.

3. **Apply change-frequency analysis.** Analyze git history: do concepts change together for the same reasons? Concepts that change independently belong in different modules. Concepts that always change together belong in the same module.

4. **Start with broad boundaries (3-5 modules most teams).** Begin with broad modules and split as divergence emerges. Merging modules is significantly harder than splitting them.

5. **Use business domain names, not technical layer names.** Name modules by business domain (Billing, Catalog, Inventory), not by technical layer (API, Admin, Database). Technical boundaries don't align with business ownership.

6. **Avoid database-driven boundaries.** Determine boundaries from business analysis, not existing table relationships. Tables reflect historical design, not necessarily current business domains.

7. **Document boundary rationale in an ADR.** Include context name, owned concepts, exposed interfaces, dependencies, and rationale. This prevents future erosion of the boundary.

## Validation Checklist
- [ ] Module boundaries are based on business domains, not technical layers
- [ ] Language divergence between modules is documented
- [ ] Event storming was conducted with domain experts
- [ ] Change-frequency analysis supports boundary decisions
- [ ] Module count is appropriate for team size (3-5 for teams of 3-5)
- [ ] Boundary rationale is documented in an ADR
- [ ] Start broad, split later principle is followed

## Common Failures
- **Technical boundaries instead of business boundaries.** Creating modules by layer (API, Admin) instead of business domain.
- **Database-driven boundaries.** Using existing tables as module boundaries instead of business analysis.
- **Too fine-grained from start.** 15 modules for a 3-developer team creates excessive overhead.

## Decision Points
- **Broad vs narrow initial boundaries?** Start broader and split later. Narrow boundaries are harder to merge than broad ones are to split.
- **Event storming vs code analysis?** Event storming for new projects; code analysis + event storming for existing codebases.

## Performance Considerations
- More modules = more inter-module communication overhead.
- Very fine-grained modules (10+ for one database) create cross-module query overhead.

## Security Considerations
- Module boundaries don't provide security isolation — authentication still applies globally.
- Security boundaries should follow module boundaries where data sensitivity differs.

## Related Rules
- Rule: Language Divergence as Primary Signal (MMD-02/05-rules.md)
- Rule: Start Broad, Split Later (MMD-02/05-rules.md)
- Rule: Business Domain Boundaries, Not Technical (MMD-02/05-rules.md)
- Rule: Avoid Database-Driven Boundaries (MMD-02/05-rules.md)
- Rule: Document Boundary Rationale in ADRs (MMD-02/05-rules.md)
- Rule: Limit Module Count by Team Size (MMD-02/05-rules.md)
- Rule: Event Storming for Discovery (MMD-02/05-rules.md)
- Rule: Validate with Change-Frequency Analysis (MMD-02/05-rules.md)

## Related Skills
- Decide Between Modular Monolith and Microservices (MMD-01/06-skills.md)
- Implement Module Internal Structure (MMD-03/06-skills.md)
- Configure Module Registration (MMD-04/06-skills.md)
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Map Context Boundaries (DBC-02/06-skills.md)

## Success Criteria
- Module boundaries are based on business domains and language divergence.
- Each boundary has documented rationale in an ADR.
- Module count is proportional to team size.
- Event storming or equivalent discovery method was used with domain experts.
