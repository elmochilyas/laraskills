# Skill: Decide Whether to Introduce a DTO for a Data Flow

## Purpose

Evaluate a data flow against the 2-3 layer threshold and ceremony budget to determine whether a DTO provides value — or whether a validated array, FormRequest, or API Resource is the appropriate tool.

## When To Use

- Starting a new feature — decide whether a DTO is needed
- Reviewing a pull request that introduces a new DTO — verify it meets the threshold
- Refactoring — identify existing DTOs that add ceremony without value and could be removed
- Establishing team conventions — create shared understanding of when DTOs are appropriate

## When NOT To Use

- The DTO already exists and is actively used across multiple entry points — it has proven its value
- The data flow involves a public package API — DTOs are always justified for typed API contracts
- The team has an established "always DTO" policy enforced by static analysis

## Prerequisites

- Understanding of the data flow: entry points, layers crossed, service method signatures
- Count of data fields and transformation requirements
- Understanding of the ceremony budget concept

## Inputs

- Data flow description: where data originates (HTTP, CLI, queue), how many layers it crosses, how many entry points exist
- Current implementation (if refactoring): validated array, FormRequest, or existing DTO
- Service method signature that receives the data
- Future roadmap: expected additional entry points or consumers

## Workflow

1. Count the application layers the data crosses (controller, service, action, repository):
   - 1-2 layers: array/FormRequest is sufficient — no DTO needed
   - 2-3+ layers: DTO is recommended
2. Count the entry points (HTTP endpoint, CLI command, queue job):
   - 1 entry point: validated array is sufficient initially
   - 2+ entry points: DTO guarantees consistent data contract
3. Assess field count and transformation requirements:
   - < 3 fields with no transformation: DTO adds ceremony without value
   - 3+ fields or any transformation (rename, type cast, flatten): DTO adds value
4. Check if the FormRequest validated keys already match what the service needs:
   - Exact match with no transformation: skip the DTO — it would be an "Echo Chamber"
   - Different key names, types, or structure: DTO provides valuable decoupling
5. Check if the output is for HTTP response:
   - HTTP-only output: use API Resources instead of DTOs
   - Non-HTTP output (CLI, export, email): DTO with `toArray()` is appropriate
6. Document the decision: if skipping a DTO where complexity would suggest one, add a code comment explaining why
7. If the threshold is met, follow the DTO Fundamentals and Construction Patterns skills to create the DTO
8. If the threshold is not met, use `$request->validated()` directly in the service

## Validation Checklist

- [ ] The 2-3 layer threshold is met before introducing a DTO
- [ ] DTO transforms/renames fields — it does not just mirror FormRequest keys
- [ ] Team convention makes DTOs opt-in, not required for every controller
- [ ] API responses use API Resources, not DTOs
- [ ] Migration path exists: start without DTOs, add when a second entry point appears
- [ ] Rationale is documented when DTOs are intentionally skipped for complex operations

## Common Failures

- **DTO-as-optional-additive**: Assuming a DTO is "always good" regardless of complexity. Apply the threshold.
- **Team dogma**: "Every controller action must have a DTO" creates ceremony for simple CRUD. Let the complexity of the data flow govern.
- **Premature DTO proliferation**: Creating DTOs for every entity before service code exists. Let DTOs emerge from service needs.
- **Echo chamber DTO**: DTO mirrors FormRequest keys exactly with no transformation. Provides no decoupling benefit.
- **DTO for HTTP response shaping**: Using DTOs to format API responses when API Resources are the correct tool.

## Decision Points

- **DTO vs validated array**: Use validated array when data crosses 1-2 layers with a single entry point. Add DTO when a second entry point appears or data crosses 3+ layers.
- **DTO vs API Resource**: DTOs for internal data flow and non-HTTP output. API Resources for HTTP response shaping (built-in conditionals, pagination, authorization).
- **DTO vs Value Object**: DTOs for layer crossing. VOs for domain concepts with invariants. A DTO can contain VOs as properties.
- **Start with or without DTO**: Start without DTO for new features. Add DTO when the need is proven (second entry point, field-related bug).

## Performance Considerations

- DTOs add zero meaningful overhead for typical cases
- For batch processing (10,000+ DTOs): ~50ms construction vs ~10ms for arrays — consider arrays in hot paths
- DTO ceremony cost is in maintenance (files, tests, imports), not runtime

## Security Considerations

- FormRequest validated data (`validated()`) strips unvalidated fields — provides a security boundary even without a DTO
- When skipping DTOs, ensure the service layer does not accept raw `$request->all()` — always use validated data
- DTOs add an additional layer of protection against mass-assignment, but validated arrays are already safe

## Related Rules

- Rule 1: Apply the 2-3 Layer Threshold Before Introducing a DTO
- Rule 2: Skip DTOs That Mirror FormRequest Keys Exactly with No Transformation
- Rule 3: Make DTOs Opt-In, Not Default — Avoid Team Dogma
- Rule 4: Start Without DTOs and Introduce Them When a Second Entry Point Appears
- Rule 5: Use API Resources, Not DTOs, for HTTP Response Shaping
- Rule 6: Document the Rationale When Intentionally Skipping a DTO for a Complex Operation
- Rule 7: Avoid DTO Churn During Rapid Prototyping and MVP Phases

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- DTO vs Form Request: Bridge FormRequest to DTO
- DTO vs Value Object: Introduce a Value Object with Constructor Invariants

## Success Criteria

- DTOs are only introduced when the 2-3 layer threshold is met
- No DTO exists that mirrors FormRequest keys exactly without transformation
- API responses use API Resources, not DTOs
- Simple CRUD operations use `$request->validated()` without DTOs
- Rationale is documented when DTOs are intentionally skipped for complex operations
- Team has a shared understanding of when DTOs provide value vs when they add ceremony
