# ECC Anti-Patterns — Scramble vs Scribe Selection

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Scramble vs Scribe Selection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Choosing Based on Hype Instead of Requirements
2. Assuming Auto-Generation Is Always Better
3. No Error Documentation Plan Regardless of Tool Choice
4. Not Evaluating the Full Documentation Pipeline
5. Wrong Tool for API Maturity Stage

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Golden Hammer

---

## Anti-Pattern 1: Choosing Based on Hype Instead of Requirements

### Category
Architecture

### Description
Selecting Scramble or Scribe based on blog posts, social media recommendations, or peer pressure without evaluating the specific requirements of the project — PHP version, type coverage, error documentation needs, output formats, and maintenance budget.

### Why It Happens
Developers read "Scramble is amazing — zero config, auto-docs!" and install it without checking requirements. Or they hear "Scribe is the industry standard" and pick it without considering annotation maintenance overhead. Tool selection is treated as a trivial decision, not an architectural choice.

### Warning Signs
- Tool chosen without documenting evaluation criteria
- No comparison of tool outputs against project requirements
- Team discovers missing features after implementation (e.g., "Scramble doesn't generate Postman collections")
- Tool is replaced within 3 months due to unmet needs
- "Just install Scramble/Scribe, everyone uses it" is the team's rationale
- Requirements like "must support PHP 7.4" or "must generate HTML docs" were never documented

### Why It Is Harmful
The wrong tool creates ongoing friction. A team that needs Postman collections but chose Scramble must build a secondary pipeline. A team with PHP 7.x that chose Scramble cannot install it. A team that needs explicit error documentation but chose Scramble has no error docs. The cost of switching tools later — migrating annotations, rebuilding pipelines, retraining the team — far exceeds the cost of evaluating correctly upfront.

### Real-World Consequences
A team chooses Scramble because "it's the new hot thing." Their API serves enterprise consumers who need a self-contained HTML documentation site they can host internally. Scramble outputs Swagger UI only — no standalone HTML. The team spends two weeks building a custom renderer for the OpenAPI spec to produce HTML, defeating the purpose of zero-config documentation.

### Preferred Alternative
Document evaluation criteria before choosing a tool: PHP version, type coverage, error documentation needs, required output formats, API maturity, and maintenance budget. Evaluate both tools against these criteria before deciding.

### Refactoring Strategy
1. Document the project's documentation requirements explicitly
2. Map each requirement to tool capabilities (see 04-standardized-knowledge.md comparison table)
3. Make a decision matrix with weighted criteria
4. Document the decision with rationale
5. Revisit the decision when requirements change significantly

### Detection Checklist
- [ ] Check if documentation requirements were documented before tool selection
- [ ] Verify the chosen tool meets all documented requirements
- [ ] Compare evaluation criteria against actual project needs
- [ ] Confirm the tool decision is documented with rationale
- [ ] Review whether any requirements are unmet by the current tool

### Related Rules
- Evaluate PHP Version Before Choosing A Tool (05-rules.md)
- Consider Output Format Requirements Before Choosing (05-rules.md)

### Related Skills
- Select Between Scramble and Scribe (06-skills.md)

### Related Decision Trees
- Documentation Tool Selection — Scramble vs Scribe vs Hybrid (07-decision-trees.md)

---

## Anti-Pattern 2: Assuming Auto-Generation Is Always Better

### Category
Architecture

### Description
Choosing Scramble purely because it has "zero annotations" and assuming that less effort always produces better documentation, without considering the gaps that auto-generation leaves — particularly error documentation.

### Why It Happens
"Zero config" is an attractive promise. Scribe's annotation approach sounds like "more work." Teams optimize for the initial setup effort rather than the ongoing quality of documentation output.

### Warning Signs
- "Auto-generated" is the primary selection criterion
- No discussion of error documentation during tool selection
- Team assumes Scramble documents everything automatically
- No plan for handling what Scramble cannot infer (error responses, complex descriptions)
- Team is surprised post-launch that error docs are missing
- "Zero annotations" used as a selling point without qualification

### Why It Is Harmful
Auto-generation is not a binary — it trades complete coverage for reduced effort. Scramble auto-generates request/response schemas but produces zero error documentation. If the team needs comprehensive documentation (including errors), pure Scramble produces an incomplete result. The "zero effort" pitch conceals the work needed to fill the gaps.

### Real-World Consequences
A CTO mandates Scramble for the entire organization because "it's zero config — why would we use anything else?" Six months later, every API in the organization has beautifully auto-generated success documentation and zero error documentation. Every consumer integration with every API fails on the first error response because no error shapes are documented. The organization's APIs collectively produce hundreds of support tickets per month.

### Preferred Alternative
Evaluate tools based on total documentation quality and coverage, not just initial setup effort. Consider the hybrid approach: Scramble for automatic schemas, manual overlay for error docs.

### Refactoring Strategy
1. List what each tool documents automatically vs. what requires manual work
2. Evaluate whether "missing" documentation categories (errors, custom descriptions) are important for the project
3. If they are important, plan how to fill the gaps — post-processing, manual overlays, or choose a hybrid/annotation-based approach
4. Document the expected coverage of the chosen approach
5. Measure documentation completeness after implementation

### Detection Checklist
- [ ] Compare auto-generated coverage vs. complete documentation requirements
- [ ] Identify which documentation categories are missing
- [ ] Verify error documentation exists regardless of tool choice
- [ ] Check if the team has a plan for filling auto-generation gaps
- [ ] Measure documentation completeness after implementation

### Related Rules
- Plan Error Documentation Regardless Of Tool Choice (05-rules.md)
- Consider A Hybrid Approach When Both Tools' Strengths Are Needed (05-rules.md)

### Related Skills
- Select Between Scramble and Scribe (06-skills.md)

### Related Decision Trees
- Documentation Tool Selection — Scramble vs Scribe vs Hybrid (07-decision-trees.md)

---

## Anti-Pattern 3: No Error Documentation Plan Regardless of Tool Choice

### Category
Architecture

### Description
Selecting a documentation tool without defining how error responses will be documented, resulting in zero or incomplete error documentation regardless of which tool is chosen.

### Why It Happens
Error documentation is universally treated as secondary. Teams focus on "what the API returns" (success responses) and neglect "what happens when things go wrong." Both Scramble and Scribe require explicit effort for error docs — Scramble does not infer them at all, and Scribe requires explicit `@response status=4xx` annotations.

### Warning Signs
- No error documentation strategy exists in the project documentation plan
- Tool selection discussion includes no mention of error documentation
- Post-launch review reveals no documented error shapes
- Support tickets cite "how do I handle 422 errors?" as the top question
- Error status codes in the spec have no corresponding schema
- Team says "we'll add errors later" without a plan

### Why It Is Harmful
Regardless of which documentation generator is chosen, error documentation requires explicit effort. Without a plan, it will not happen. Consumers will receive beautifully documented success responses and zero guidance on error handling. The most common consumer support questions will be about undocumented error shapes, and the documentation team will be in a perpetual catch-up mode.

### Real-World Consequences
A team evaluates both Scramble and Scribe and chooses Scribe for its annotation-based error documentation. But they never write any `@response status=4xx` annotations. The generated documentation has only success responses. The team assumed that "Scribe documents errors" meant errors would be auto-documented. The evaluation mentioned error documentation as a Scribe strength, but no actual error annotations were ever created.

### Preferred Alternative
Before choosing a documentation tool, document the error documentation strategy. The strategy should define which error status codes must be documented, how they will be documented (post-processing, annotations, manual components), and who is responsible for maintaining them.

### Refactoring Strategy
1. Define the required error status codes for the API (at minimum 401, 403, 404, 422, 429, 500)
2. Choose the error documentation approach: post-processing for Scramble, `@response status=` annotations for Scribe, or manual OpenAPI components
3. Assign responsibility for error documentation maintenance
4. Add error documentation to the definition of "done" for each endpoint
5. Measure error documentation coverage regularly

### Detection Checklist
- [ ] Check if an error documentation strategy exists
- [ ] Verify every endpoint documents at minimum 422 and 500
- [ ] Confirm the strategy is independent of the tool choice
- [ ] Check who is responsible for maintaining error documentation
- [ ] Review past releases — were errors documented before launch?

### Related Rules
- Plan Error Documentation Regardless Of Tool Choice (05-rules.md)

### Related Skills
- Select Between Scramble and Scribe (06-skills.md)

### Related Decision Trees
- Error Documentation Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Not Evaluating the Full Documentation Pipeline

### Category
Architecture

### Description
Choosing a documentation tool based solely on the generation step (Scramble infers schemas, Scribe uses annotations) without considering the full pipeline: CI integration, output hosting, consumer tools, spec validation, and long-term maintenance.

### Why It Happens
The generation step is the most visible and discussable difference between tools. Teams focus on the 20% of the decision that is easy to compare and ignore the 80% that actually determines success or failure in production.

### Warning Signs
- Tool comparison only discusses generation approach (inference vs annotations)
- No discussion of CI integration, output hosting, or spec validation
- Postman collection generation is discovered as a missing feature after implementation
- No plan for spec validation in CI
- Output format (Swagger UI vs HTML vs OpenAPI file) is not specified
- Team does not know how consumers will access the documentation

### Why It Is Harmful
A tool that generates beautiful documentation but cannot be integrated into CI, validated, or hosted appropriately will fail in production. The generation step is only the beginning. If the spec cannot be validated in CI, it will drift from the code. If the output format does not match consumer needs, they cannot use it. If the docs cannot be hosted securely, the full API surface is exposed.

### Real-World Consequences
A team chooses Scramble because its inference approach is superior. But Scramble outputs only Swagger UI — no standalone HTML docs. The team's consumers are enterprise clients who need downloadable HTML documentation they can host on their intranet. The team must build a custom pipeline to convert the OpenAPI spec to HTML, adding weeks of work and ongoing maintenance.

### Preferred Alternative
Evaluate the full documentation pipeline before choosing a tool: generation → validation → CI integration → output hosting → consumer access → maintenance.

### Refactoring Strategy
1. Document the complete documentation pipeline steps
2. For each step, list the requirements and evaluate each tool's capabilities
3. Include CI integration (does the tool have a CI-friendly generation command?)
4. Include output hosting (can the output be served from a CDN? Does it need authentication?)
5. Include consumer tools (Swagger UI, Postman, HTML sites, SDK generation)
6. Include long-term maintenance (how does the tool handle changes? What breaks?)

### Detection Checklist
- [ ] Document all pipeline steps before tool selection
- [ ] Verify the chosen tool supports every pipeline step
- [ ] Check CI integration for spec generation and validation
- [ ] Confirm output hosting matches consumer needs
- [ ] Review maintenance requirements for the chosen tool

### Related Rules
- Consider Output Format Requirements Before Choosing (05-rules.md)

### Related Skills
- Select Between Scramble and Scribe (06-skills.md)

### Related Decision Trees
- Documentation Tool Selection — Scramble vs Scribe vs Hybrid (07-decision-trees.md)

---

## Anti-Pattern 5: Wrong Tool for API Maturity Stage

### Category
Architecture

### Description
Using Scramble for a stable, consumer-facing API that needs fine-grained documentation control, or using Scribe for a rapidly iterating API where annotation maintenance overhead slows development.

### Why It Happens
The tool chosen during the initial project setup is assumed to be correct forever. Teams do not revisit the decision as the API matures from rapid iteration to stable release. The tool that was perfect for prototyping may be wrong for production.

### Warning Signs
- Stable API with Scribe annotations that are rarely updated (drift)
- Rapidly iterating API where 30% of sprint velocity goes to annotation maintenance
- Scribe annotations contain `@bodyParam` and `@response` for endpoints that no longer exist
- Scramble-generated docs lack the precision needed for enterprise consumer-facing documentation
- Team expresses frustration with the documentation tool but has not reconsidered the choice
- No discussion of tool lifecycle — when to switch

### Why It Is Harmful
Using Scramble for a stable API means giving up fine-grained control over documentation content. Using Scribe for a rapid-iteration API means constant annotation updates that slow development. Both scenarios create ongoing friction that reduces documentation quality and increases maintenance burden.

### Real-World Consequences
A startup launches with Scribe for its rapidly evolving v1 API. Each sprint, 30% of development time is spent updating PHPDoc annotations for changed endpoints. The team's velocity drops significantly. Meanwhile, a large enterprise API that has been stable for 2 years uses Scramble. Enterprise consumers request custom documentation with specific error code descriptions, request/response examples for specific scenarios, and multi-language code samples. Scramble cannot produce these without extensive post-processing.

### Preferred Alternative
Match the tool to the API's maturity stage: Scramble for fast-iterating APIs under active development; Scribe or hybrid for stable APIs with established consumers requiring fine-grained documentation control.

### Refactoring Strategy
1. Assess the current API maturity stage
2. Evaluate whether the current tool is appropriate for that stage
3. If a tool switch is needed, run both tools in parallel during a transition period
4. Migrate annotations gradually for Scribe-to-Scramble or add post-processing for Scramble-to-Scribe
5. Document the decision and set a calendar reminder to re-evaluate when the API maturity changes

### Detection Checklist
- [ ] Assess current API maturity (rapid iteration vs stable)
- [ ] Evaluate whether the current tool matches the maturity stage
- [ ] Check annotation maintenance overhead as a percentage of sprint velocity
- [ ] Verify documentation meets consumer expectations for the current stage
- [ ] Set a re-evaluation date for when API maturity changes

### Related Rules
- Choose Scramble For Fast-Iterating APIs, Scribe For Stable APIs (05-rules.md)
- Consider A Hybrid Approach When Both Tools' Strengths Are Needed (05-rules.md)

### Related Skills
- Select Between Scramble and Scribe (06-skills.md)

### Related Decision Trees
- Documentation Tool Selection — Scramble vs Scribe vs Hybrid (07-decision-trees.md)

---

