# response-format-decision-framework
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** response-format-decision-framework  
**Difficulty Level:** Advanced  
**Last Updated:** 2026-06-02

## Executive Summary
The response-format-decision-framework provides a systematic approach to choosing between envelope, bare-body, JSON:API, and RFC 9457 problem detail formats for API responses. Each format optimizes for different constraints: client diversity, payload efficiency, specification compliance, and error clarity. The decision framework maps API characteristics (public vs. private, consumer types, bandwidth constraints, tooling ecosystem) to the appropriate response format.

## Core Concepts
- **Format Selection Dimensions**: Key decision axes include consumer diversity (many client types vs. few), bandwidth sensitivity, metadata requirements, and ecosystem compatibility.
- **Envelope Format**: Best for public APIs with diverse consumers. Provides structural consistency at the cost of payload overhead.
- **Bare-Body Format**: Best for internal/BFF APIs where consumers are known. Optimizes payload size at the cost of extensibility.
- **JSON:API Format**: Best for APIs requiring specification compliance, client-side tooling, or compound documents. Strict format, high consistency, steep learning curve.
- **RFC 9457 Format**: Best for error responses. Standardized problem details structure that HTTP libraries and API gateways can parse generically.
- **Hybrid Approaches**: Common patterns include JSON:API for resource endpoints, RFC 9457 for errors, and envelope for collection metadata.

## Mental Models
- **Tool Selection**: Response format is a tool, not a religion. Choose the tool based on the job (endpoint type, consumer, bandwidth).
- **Format Spectrum**: Response formats exist on a spectrum from maximal structure (JSON:API) to minimal structure (bare-body). The decision framework places the API on this spectrum.
- **Consumer Contract**: The response format IS the primary contract with consumers. Changing format requires version negotiation or a breaking version bump.

## Internal Mechanics
- **Deterministic Selection**: The format selection should be deterministic per endpoint, not dynamic. A given endpoint should always use the same format for the same version.
- **Format Negotiation**: Accept headers or query parameters can negotiate format. `Accept: application/vnd.api+json` for JSON:API, `Accept: application/problem+json` for RFC 9457.
- **Version-Locked Format**: Response format is typically locked to API version. V1 uses envelope, V2 uses JSON:API.
- **Middleware Format Selection**: A middleware layer can intercept responses and transform them into the selected format, decoupling format from controller logic.
- **Adapter Pattern**: Resource adapters transform internal representations into the target format. One internal model, multiple format adapters.

## Patterns
- **Format Per Endpoint Category**: Resource endpoints use JSON:API, action endpoints use envelope, errors use RFC 9457.
- **Gateway Transformation**: Microservices internally use bare-body. API gateway transforms to JSON:API for external consumers.
- **Version Upgrade Format Shift**: V1 launches with simple envelope. V2 upgrades to JSON:API. V3 supports both via content negotiation.
- **RFC 9457 for All Errors**: Regardless of the success response format, always format errors as RFC 9457 problem details. This gives consumers a single error parsing path.
- **Format-Documented API Profile**: Document the chosen format(s) in an API profile document that consumers read to understand response structure.

## Architectural Decisions
- **Single Format vs. Multi-Format**: Single format is simpler but may not fit all use cases. Multi-format requires content negotiation and adapter infrastructure.
- **Format Complexity Budget**: JSON:API has the highest implementation complexity but the richest client tooling. Assess whether the team can maintain specification compliance.
- **Bare-Body Upgrade Path**: Starting with bare-body is easy but upgrading to envelope later requires client changes. Consider starting with envelope and optimizing later.
- **Error Format Independence**: Error format can differ from success format. RFC 9457 errors + JSON:API resources is a common and defendable combination.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Right format per use case optimizes UX | Format switching adds complexity | Middleware or adapters needed for multi-format |
| JSON:API compliance unlocks rich tooling (ember, orbit) | Strict format constraints slow iteration | Changes to response shape require spec review |
| RFC 9457 errors improve machine readability | Non-standard error formats confuse API gateways | Problem Details is not universally supported in older clients |
| Bare-body minimizes bandwidth | Bare-body lacks extensibility | Adding metadata becomes breaking change |
| Envelope provides consistency | Envelope carries constant overhead | Every response pays the wrapper tax |

## Performance Considerations
- **JSON:API Serialization Cost**: Compound documents with included resources serialize more data per request than envelope or bare-body.
- **RFC 9457 vs. Custom Errors**: RFC 9457 adds the `type` URI field to every error, increasing response size slightly but providing machine-readable error taxonomy.
- **Format Negotiation Overhead**: Supporting multiple formats via content negotiation adds response-time branching. Pre-compute format strategy at route registration time.
- **Serialization Caching**: Caching formatted responses per format variant multiplies cache storage. Cache the internal representation and format at the edge.

## Production Considerations
- **Format Migration Strategy**: Migrating from one format to another requires a version bump or a transition period where both formats are supported simultaneously.
- **Load Balancer Compatibility**: Some load balancers and API gateways may modify response bodies. Test format compliance end-to-end.
- **Monitoring Format Compliance**: Automated tests should assert that every endpoint returns the correct format for its version and content-type negotiation.
- **Format Documentation**: Each format variant should be documented with examples. OpenAPI supports multiple response schemas per status code.
- **Client Onboarding**: Provide format-specific client libraries or SDKs to reduce consumer friction with the chosen format.

## Common Mistakes
- **Inconsistent Format Per Endpoint**: Using envelope for users endpoint but bare-body for posts endpoint. Document and enforce a consistent policy.
- **Over-Engineering with JSON:API**: Using JSON:API for a simple 3-endpoint API. The specification overhead outweighs the benefits for small APIs.
- **Bare-Body at Public API**: Exposing bare-body to unknown third-party clients. The lack of extensibility creates future breaking changes.
- **Custom Error Format**: Using `{ "error": "message" }` instead of RFC 9457. Gateways and HTTP libraries cannot parse custom error structures automatically.
- **Format via Dynamic Detection**: Trying to detect client capabilities at runtime to choose format leads to untestable, unpredictable behavior.

## Failure Modes
- **Silent Format Fallback**: Content negotiation with no matching format returns a default format but without notifying the consumer. The client gets unexpected structure.
- **Format Mismatch on Error**: Success responses use JSON:API but errors use a custom format. Error handling code must parse two different structures.
- **Partial JSON:API Compliance**: Claiming JSON:API compliance but omitting required fields (type, id) causes client-side validation failures.
- **RFC 9457 Without Type URI**: Omitting the `type` field from RFC 9457 makes the error non-compliant and breaks machine classification.

## Ecosystem Usage
- **Laravel Framework**: No built-in multi-format support. Developers implement format selection manually or via packages.
- **Laravel JSON:API (`laravel-json-api`)**: Provides full JSON:API format implementation with content negotiation.
- **Spatie/laravel-json-api-paginate**: Wraps paginated responses in JSON:API-compatible structure.
- **Fractal (deprecated)**: The now-deprecated Fractal library provided format transformation (JSON:API, envelope, bare-body) via serializer classes.
- **API Platform (Symfony)**: Has built-in format negotiation for JSON-LD, JSON:API, HAL, and plain JSON.
- **Laravel Nova**: Uses a custom envelope format, not JSON:API. Nova's frontend expects this specific format.

## Related Knowledge Units
### Prerequisites
- envelope-response-design
- bare-body-response-design
- data-wrapping-configuration

### Related Topics
- json-api-resource-structure
- rfc-9457-problem-details

### Advanced Follow-up Topics
- response-versioning
- json-api-compound-documents

---

## Research Notes

### Source Analysis
- `Illuminate\Http\Resources\Json\JsonResource` — base format implementation
- `Illuminate\Http\Resources\Json\ResourceResponse` — envelope generation
- JSON:API Specification (jsonapi.org) — standard resource format
- IETF RFC 9457 (formerly RFC 7807) — problem details for HTTP APIs
- `laravel-json-api` package — full JSON:API implementation
- `Spatie\LaravelQueryBuilder` — sparse fieldset and include support

### Key Insight
There is no single best response format — the decision framework maps API characteristics (consumer diversity, bandwidth constraints, tooling ecosystem) to format choices, and the most mature APIs typically use different formats for different concerns: JSON:API for resources, RFC 9457 for errors, envelope for collections.

### Version-Specific Notes
- Laravel 10/11/12/13: No native multi-format support — all implementations are manual or package-driven
- Content negotiation via `Accept` header consistent across versions
- RFC 7807 superseded by RFC 9457 in 2023 — `application/problem+json` media type unchanged
- JSON:API 1.1 (2022) added optional `meta` on relationship objects — supported by `laravel-json-api` v5+
