# Skill: Select Between Scramble and Scribe

## Purpose
Evaluate and select the appropriate OpenAPI documentation generator (Scramble or Scribe) for a Laravel API based on PHP version, type coverage, error documentation needs, output format requirements, and API maturity.

## When To Use
- Starting a new Laravel API project
- Deciding between documentation generation tools
- Evaluating whether to switch documentation tools
- Planning documentation strategy for an existing API

## When NOT To Use
- APIs with established documentation tools already working well
- Projects where documentation tool choice is already decided and fixed
- APIs documented entirely through hand-written OpenAPI specs

## Prerequisites
- Understanding of OpenAPI spec generation
- Knowledge of Laravel project PHP version and type coverage
- List of required documentation output formats

## Inputs
- PHP version (7.x or 8.0+)
- Type hint coverage in controllers, Form Requests, API Resources
- Required output formats (Swagger UI, HTML docs, Postman collections)
- Error documentation requirements
- API maturity stage (rapid iteration vs stable)

## Workflow
1. Check PHP version: Scramble requires PHP 8.0+ with type hints; Scribe works with PHP 7.4+
2. Evaluate type coverage: Scramble benefits from well-typed Form Requests and API Resources
3. Assess error documentation needs: plan error doc strategy regardless of tool choice
4. List required output formats: Scramble outputs OpenAPI 3.1 + Swagger UI; Scribe outputs HTML site + Postman collection + OpenAPI 3.0
5. Evaluate API maturity: Scramble for fast-iterating APIs (zero annotation maintenance); Scribe for stable APIs (explicit control)
6. Consider hybrid approach: Scramble for auto-generated request/response schemas + manual error doc overlay via spec post-processing
7. Document the decision with rationale and any exceptions for future reference

## Validation Checklist
- [ ] PHP version compatibility verified
- [ ] Type hint coverage assessed
- [ ] Error documentation strategy defined
- [ ] Required output formats listed and matched to tool capabilities
- [ ] API maturity considered in selection
- [ ] Hybrid approach evaluated if both tools' strengths are needed
- [ ] Decision documented with rationale

## Common Failures
- Choosing based on hype not requirements
- Assuming auto-generation is always better — error documentation is completely missing
- Underestimating annotation maintenance burden with Scribe
- Not evaluating the full pipeline (CI integration, output hosting, consumer tools)
- No error documentation plan regardless of tool choice

## Decision Points
- PHP version: 8.0+ with types → Scramble viable; 7.x → Scribe required
- Output format: Swagger UI / OpenAPI 3.1 → Scramble; HTML docs / Postman → Scribe
- API maturity: rapid iteration → Scramble; stable → Scribe
- Error doc needs: Scramble requires post-processing; Scribe requires annotations
- Hybrid: Scramble for schemas + YAML overlay for error docs

## Performance Considerations
- Scramble generation: 200-500ms runtime or cached; live-reload in development
- Scribe extract mode: 5-15s; call mode: 30-60s
- Scramble regenerates on every dev request; Scribe requires manual command

## Security Considerations
- Both tools expose API surface — protect access regardless of tool choice
- Scramble's built-in Swagger UI route requires explicit protection
- Review auto-generated specs before publishing regardless of generation approach

## Related Rules
- Evaluate PHP Version Before Choosing A Tool
- Choose Scramble For Fast-Iterating APIs, Scribe For Stable APIs
- Plan Error Documentation Regardless Of Tool Choice
- Consider Output Format Requirements Before Choosing
- Consider A Hybrid Approach When Both Tools' Strengths Are Needed

## Related Skills
- Integrate Scramble
- Integrate Scribe
- Validate Documentation in CI

## Success Criteria
- Tool selection matches PHP version, type coverage, and API maturity
- Required output formats are producible by chosen tool
- Error documentation strategy exists independent of tool choice
- Hybrid approach considered and either adopted or explicitly rejected with rationale
- Decision is documented for future reference
