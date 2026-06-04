# Phase 5: Rules — Scramble vs Scribe Selection

## Evaluate PHP Version Before Choosing A Tool
---
## Category
Architecture
---
## Rule
Choose Scramble only if the project runs PHP 8.0+ with consistent type hints. Choose Scribe if the project runs PHP 7.x or has incomplete type coverage.
---
## Reason
Scramble requires PHP 8.0+ reflection and type system features to infer schemas. On PHP 7.x, Scramble cannot run. Scribe works with PHP 7.4+ and does not depend on type hints, making it the only viable option for legacy projects.
---
## Bad Example
```bash
# PHP 7.4 project installs Scramble
composer require dedoc/scramble  # Fails: requires PHP 8.0+
```
---
## Good Example
```bash
# PHP 7.4 project — use Scribe
composer require knuckleswtf/scribe

# PHP 8.2+ with type hints — Scramble is viable
composer require dedoc/scramble
```
---
## Exceptions
PHP 8.0+ projects with zero type hints; Scramble provides no benefit over Scribe in that case.
---
## Consequences Of Violation
Installation failure; or tool chosen without considering the codebase's ability to support its inference approach.
---

## Choose Scramble For Fast-Iterating APIs, Scribe For Stable APIs
---
## Category
Architecture
---
## Rule
Use Scramble for APIs under active development where endpoints change weekly and annotation maintenance overhead would block iteration. Use Scribe for stable APIs with established consumers where explicit control over documentation content is required.
---
## Reason
Scramble's zero-annotation approach means documentation updates automatically when code changes — no separate maintenance step. Scribe's annotation approach requires updating doc blocks for every change, creating friction during rapid iteration. The trade-off is Scramble has less control; Scribe has more maintenance.
---
## Bad Example
A rapidly evolving v2 API uses Scribe. Every sprint, 50% of the sprint's capacity is spent updating PHPDoc annotations to match new endpoints.
---
## Good Example
Rapidly evolving API → Scramble (auto-docs, no annotation maintenance). Stable GA API → Scribe (fine-grained control over every endpoint's documentation).
---
## Exceptions
Stable APIs with zero need for custom documentation content; Scramble's simplicity still wins.
---
## Consequences Of Violation
Annotation maintenance overhead slows development velocity; or auto-generated docs lack needed precision for stable consumer-facing APIs.
---

## Plan Error Documentation Regardless Of Tool Choice
---
## Category
Architecture
---
## Rule
Before choosing either tool, document how error responses will be documented. Neither tool auto-documents errors comprehensively.
---
## Reason
Error documentation is the most common blind spot in tool selection. Scramble documents zero errors. Scribe documents only errors explicitly annotated with `@response status=4xx`. If no error documentation plan exists, consumers will have no documented error shapes regardless of which tool is chosen.
---
## Bad Example
Team chooses Scramble because it's "zero config." They discover after launch that none of their error responses are documented. Consumers cannot handle API errors.
---
## Good Example
Team evaluates both tools: "We will use Scramble for request/response schemas and overlay error documentation via OpenAPI post-processing with `yq merge`." Error documentation plan exists independently of tool choice.
---
## Exceptions
APIs that return only 200/201 responses with no error states (theoretically impossible; document at minimum 500).
---
## Consequences Of Violation
No documented error responses regardless of tool; consumers cannot build error handling; support volume increases.
---

## Consider Output Format Requirements Before Choosing
---
## Category
Architecture
---
## Rule
Match the tool to the required output formats: choose Scramble for Swagger UI / OpenAPI 3.1; choose Scribe for self-contained HTML sites, Postman collections, or OpenAPI 3.0.
---
## Reason
Scramble outputs OpenAPI 3.1 JSON/YAML + Swagger UI. Scribe outputs a self-contained HTML documentation site, Postman collection, and OpenAPI 3.0 spec. Choosing a tool that cannot produce the required output format forces a second documentation pipeline.
---
## Bad Example
```bash
# Team needs Postman collections but chose Scramble
composer require dedoc/scramble
# Now they need a separate pipeline to convert OpenAPI to Postman
```
---
## Good Example
```bash
# Team needs Postman collections + OpenAPI spec → Scribe
composer require knuckleswtf/scribe
# Built-in: openapi.yaml + collection.json + HTML site
```
---
## Exceptions
Output format can be generated from OpenAPI spec regardless of tool (e.g., `openapi-to-postman` for Postman). Evaluate whether the additional pipeline step is acceptable.
---
## Consequences Of Violation
Required documentation format is not produced; a secondary generation pipeline must be built and maintained.
---

## Consider A Hybrid Approach When Both Tools' Strengths Are Needed
---
## Category
Architecture
---
## Rule
Use Scramble for automatic request/response schema generation and overlay manually authored error documentation and custom content via OpenAPI spec post-processing with `yq` or similar.
---
## Reason
Neither tool alone provides both zero-maintenance schema generation and comprehensive error documentation. A hybrid approach uses Scramble where it excels (inference from Form Requests/API Resources) and supplements its weaknesses (error docs, custom descriptions) via spec post-processing.
---
## Bad Example
Team abandons Scramble entirely because it doesn't document errors, switching to fully manual Scribe annotations — losing all the zero-config benefit.
---
## Good Example
```bash
# 1. Generate base spec with Scramble
php artisan scramble:generate
# 2. Overlay hand-written error components
yq eval-all 'select(fileIndex==0) * select(fileIndex==1)' \
  openapi.yaml error-overlay.yaml > openapi-final.yaml
```
---
## Exceptions
Very small APIs (under 10 endpoints) where full Scribe annotation maintenance is still low effort.
---
## Consequences Of Violation
Either schema drift (if using pure Scribe) or missing error documentation (if using pure Scramble).
---
