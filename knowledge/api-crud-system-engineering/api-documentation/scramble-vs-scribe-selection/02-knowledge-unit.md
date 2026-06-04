# Scramble vs Scribe Selection

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Scramble vs Scribe Selection
- **Last Updated:** 2026-06-02

---

## Executive Summary

Scramble and Scribe are the two primary OpenAPI documentation generators for Laravel. Both produce OpenAPI specs, but they differ fundamentally in approach: Scramble infers documentation from code (type hints, Form Requests, API Resources) with zero annotations, while Scribe relies on explicit PHPDoc annotations and static analysis. The choice between them significantly impacts documentation workflow, maintenance burden, and output quality.

This KU provides a systematic decision framework for selecting between Scramble and Scribe based on project requirements, team workflow, API complexity, and documentation philosophy. The decision is not binary — hybrid approaches are possible and sometimes optimal.

---

## Core Concepts

### Fundamental Difference

| Dimension | Scramble | Scribe |
|---|---|---|
| Inference method | Compile-time reflection | PHPDoc annotations + static analysis |
| Annotations required | None (zero-config) | Extensive (@bodyParam, @response, @group) |
| Output | OpenAPI 3.1 JSON/YAML, Swagger UI | HTML site, Postman collection, OpenAPI 3.0 |
| Schema source | Form Requests + API Resources | @bodyParam, @response, Form Request inference |
| Error documentation | Not inferred | Manual via @response status= |
| PHP requirement | 8.0+ with type hints | PHP 7.4+ |
| Laravel version | 9.x, 10.x, 11.x | 8.x, 9.x, 10.x, 11.x |
| Maintenance | Low (code-driven) | Medium (annotation-driven) |
| Configuration | Minimal | Extensive (scribe.php) |

### When Scramble Excels
- Code follows Laravel conventions (type-hinted Form Requests, API Resources)
- Team prioritizes low-maintenance documentation
- API is well-typed with PHP 8.0+ type hints
- Error documentation is less critical or handled separately

### When Scribe Excels
- API has complex error responses that must be documented
- Team wants explicit control over documentation content
- Consumers need HTML documentation site or Postman collection
- API serves multiple versions with different documentation
- Project uses PHP 7.x or has legacy type coverage

---

## Mental Models

### Auto-Pilot vs Manual-Control
Scramble is auto-pilot documentation: it works with minimal input but only goes where the code leads. Scribe is manual-control: requires more input but can go anywhere the annotation specifies.

### Schema Source Proximity
Scramble draws schemas from the closest code artifact (Form Request -> request schema, API Resource -> response schema). Scribe draws from annotations that are physically in the controller file but semantically separate from the code.

### Documentation as Compilation vs Documentation as Artifact
Scramble treats documentation as a compilation byproduct — always present, always in sync. Scribe treats documentation as a separate artifact — explicitly generated, explicitly versioned, explicitly maintained.

---

## Internal Mechanics

### Inference Chain Comparison

**Scramble:** Routes -> Controller methods -> Form Request rules() -> OpenAPI schema
                              -> Return types -> API Resource toArray() -> OpenAPI schema

**Scribe:** Routes -> Controller methods -> PHPDoc @bodyParam -> OpenAPI parameter
                              -> PHPDoc @response -> OpenAPI response example
                              -> Form Request inference (optional) -> OpenAPI schema

### Error Documentation
Scramble does not infer error responses. Scribe requires explicit @response status= annotations for each error case. This is the most significant practical difference: Scramble produces complete request/response schemas but no error documentation; Scribe produces whatever errors the developer explicitly documents.

### Output Formats

| Format | Scramble | Scribe |
|---|---|---|
| OpenAPI JSON | Yes (3.1) | Yes (3.0) |
| OpenAPI YAML | Yes (3.1) | Yes (3.0) |
| Swagger UI | Built-in route | N/A |
| HTML doc site | N/A | Full Bootstrap site |
| Postman collection | Via export | Built-in |
| Markdown | Via export | Built-in |

### Configuration Overhead

**Scramble:**
```php
// config/scramble.php (minimal)
return [
    'api' => [
        'title' => 'My API',
        'version' => '1.0.0',
    ],
];
```

**Scribe:**
```php
// config/scribe.php (extensive)
return [
    'type' => 'laravel',
    'routes' => [
        'groups' => ['api/*'],
    ],
    'auth' => [
        'enabled' => true,
        'in' => 'bearer',
    ],
    'responses' => [
        'callbacks' => [],
    ],
    // ... 50+ configuration options
];
```

---

## Patterns

### Hybrid Approach
Use Scramble for automatic request/response schema generation, then overlay manual error documentation via OpenAPI spec post-processing:

```bash
# Generate base spec with Scramble
php artisan scramble:export > openapi-base.yaml

# Merge error documentation from a hand-written file
yq eval-all '. as $item ireduce ({}; . * $item)' \
  openapi-base.yaml error-docs.yaml > openapi-final.yaml
```

### Scribe with Form Request Inference
Scribe v4+ can infer schemas from Form Requests, reducing annotation overhead while maintaining error documentation control:

```php
// config/scribe.php
'strategies' => [
    'queryParameters' => [
        \Knuckles\Scribe\Extracting\Strategies\QueryParameters\GetFromFormRequest::class,
    ],
    'bodyParameters' => [
        \Knuckles\Scribe\Extracting\Strategies\BodyParameters\GetFromFormRequest::class,
    ],
],
```

### Team-Based Selection
Different teams within the same organization may use different tools based on their API's characteristics:
- Internal CRUD APIs -> Scramble (low ceremony)
- Public-facing APIs with complex error handling -> Scribe (explicit control)

---

## Architectural Decisions

### Decision Factors
1. **PHP version** — PHP 7.x excludes Scramble
2. **Type coverage** — Well-typed code favors Scramble; untyped code favors Scribe
3. **Error documentation** — Extensive error docs required -> Scribe
4. **Output format** — HTML site/Postman required -> Scribe; OpenAPI UI required -> Scramble
5. **Maintenance budget** — Low maintenance -> Scramble
6. **Control requirements** — Full control over docs -> Scribe
7. **Laravel version** — < Laravel 9 may have compatibility issues with Scramble

### Decision Matrix
| Factor | Scramble | Scribe |
|---|---|---|
| PHP 8.0+ typed code | Strong match | Neutral |
| PHP 7.x | Incompatible | Strong match |
| Complex error docs | Weak (manual post-processing) | Strong match |
| HTML documentation | Weak (manual setup) | Strong match |
| Postman collection | Weak (manual export) | Strong match |
| Minimum maintenance | Strong match | Weak match |
| OpenAPI 3.1 required | Strong match | Weak (3.0 only) |
| Multi-language code samples | Weak | Strong |

### Migration Path
Switching from Scribe to Scramble (or vice versa) requires:
1. Generate both specs in parallel for a transition period
2. Compare output and resolve gaps
3. Update CI pipeline to generate the new spec
4. Archive the old tool configuration

---

## Tradeoffs

| Benefit (Scramble) | Cost (Scramble) | Benefit (Scribe) | Cost (Scribe) |
|---|---|---|---|
| Zero annotations to maintain | No error documentation | Full control over error docs | Annotations must be maintained |
| Always in sync with code | Only works with typed code | Works with any PHP version | Schemas can drift from code |
| OpenAPI 3.1 output | Limited output formats | HTML + Postman + OpenAPI | OpenAPI 3.0 only |
| Fast setup (minutes) | Limited configuration | Extensive configuration | Complex setup (hours) |

---

## Performance Considerations

### Generation Speed
- Scramble: 200-500ms (runtime) or cached
- Scribe (extract mode): 5-15 seconds per generation
- Scribe (call mode): 30-60 seconds per generation

### Development Workflow Impact
Scramble regenerates on every request in development — no manual command needed. Scribe requires `php artisan scribe:generate` after every code change. Scramble's live-reload workflow is faster for rapid iteration.

---

## Production Considerations

### CI Integration
Both tools integrate with CI. Scramble generates faster but produces less output. Scribe generates slower but produces deployable HTML docs and Postman collections.

### Documentation Hosting
Scramble outputs a spec that needs a viewer (Swagger UI, Redoc). Scribe outputs a self-contained HTML site that can be deployed independently.

### Consumer Experience
Scribe's HTML site with multi-language code samples is more consumer-friendly than Scramble's Swagger UI. For public APIs, Scribe generally provides a better documentation experience out of the box.

---

## Common Mistakes

### Choosing Based on Hype, Not Requirements
Why it happens: A blog post recommends Scramble. Why it's harmful: The project needs Postman collections and HTML docs, which Scramble does not provide natively. Better approach: Evaluate based on project requirements, not popularity.

### Assuming Auto-Generation Is Always Better
Why it happens: "Zero annotations" sounds appealing. Why it's harmful: Error documentation is completely missing. Better approach: Verify that auto-generation covers all documentation needs.

### Underestimating Annotation Maintenance
Why it happens: Initial setup is fast. Why it's harmful: Over time, annotations drift from code, requiring ongoing maintenance. Better approach: Budget for documentation maintenance regardless of tool choice.

### Not Evaluating the Full Pipeline
Why it happens: Tool comparison focuses on the generation step. Why it's harmful: CI integration, output hosting, and consumer tools are equally important. Better approach: Evaluate the end-to-end documentation pipeline.

---

## Failure Modes

### Wrong Tool for the Project
Project needs HTML docs + Postman but chose Scramble. Failure mode: Team spends months building workarounds for missing features. Mitigation: Evaluate output format requirements before choosing.

### Migration Cost After Wrong Choice
Team chose Scribe for a rapidly iterating API and struggles with annotation maintenance. Failure mode: Docs are always out of date; team stops updating annotations. Mitigation: Choose Scramble for fast-iterating APIs; Scribe for stable APIs.

### Incomplete Documentation Due to Tool Limitation
Scramble does not document errors; team did not add manual error docs. Failure mode: Consumers have no error documentation. Mitigation: Add error documentation strategy regardless of tool choice.

---

## Ecosystem Usage

### Greenfield Laravel API Projects
New Laravel API projects (Laravel 11, PHP 8.2+) increasingly choose Scramble as the default due to its zero-config setup and alignment with modern Laravel conventions.

### Enterprise Laravel APIs
Enterprise APIs with complex business logic, extensive error handling, and multi-version support tend to prefer Scribe for its explicit control and comprehensive output.

### API-First Laravel Projects
Projects where the API specification is designed before implementation (schema-first) benefit from neither tool directly — they write the OpenAPI spec manually and use codegen to scaffold Laravel controllers.

---

## Related Knowledge Units

### Prerequisites
- Endpoint Documentation Content — Understanding what documentation is needed
- OpenAPI Spec Generation — Understanding the output format

### Related Topics
- Scramble Integration — Detailed Scramble mechanics
- Scribe Integration — Detailed Scribe mechanics
- Documentation CI Validation — CI pipeline regardless of tool choice

### Advanced Follow-up Topics
- Hybrid Scramble + Scribe Workflow — Combining both tools for optimal coverage
- Post-Processing OpenAPI Specs — Enriching generated specs with manual content
- Custom Documentation Strategy — Building a documentation pipeline from scratch

---

## Research Notes

### Source Analysis
- Scramble GitHub: https://github.com/dedoc/scramble — Type-inference-based doc generator
- Scribe GitHub: https://github.com/knuckleswtf/scribe — Annotation-based doc generator
- Laravel News comparisons (2024-2025) — Community articles comparing both tools

### Key Insight
The optimal choice depends on whether the team treats documentation as a byproduct of coding (Scramble) or as a separate artifact (Scribe). Neither philosophy is universally correct — they suit different team cultures, project types, and consumer requirements.

### Version-Specific Notes
- Scramble v0.12+: Stable for Laravel 10/11 with Form Request and API Resource inference
- Scribe v4.5+: Stable for Laravel 9/10/11 with improved Form Request inference
- As of 2026: Both tools are actively maintained with growing feature parity
- Future trend: Scramble adding more manual annotation options; Scribe adding more inference capabilities
