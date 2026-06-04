# Request Size Limits

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Request size limits govern the maximum allowed size for API request bodies, file uploads, and query strings. Limits are enforced at multiple layers (nginx, PHP, Laravel) to prevent resource exhaustion, ensure fair use, and protect against denial-of-service attacks. Proper configuration requires coordination across infrastructure and application levels.

## Core Concepts
- **Body Size Limit:** Maximum size of the HTTP request body (for JSON, form data, etc.).
- **Upload Size Limit:** Maximum size for file uploads, typically larger than body limit.
- **Query String Limit:** Maximum length of the URL query string.
- **Header Size Limit:** Maximum size of individual HTTP headers and total header size.
- **Multi-Layer Enforcement:** Limits are configured at nginx (gateway), PHP (runtime), and Laravel (application) levels.
- **413 Payload Too Large:** The standard HTTP response code for request size violations.
- **Chunked Transfer Encoding:** Large requests can be streamed in chunks — limits still apply.

## Mental Models
- **Airport Baggage Allowance:** Your suitcase (request body) must be under the weight limit (body size). If it's over, you must repack (split request) or pay extra (pre-approved larger limit). Overweight bags are checked at multiple points — curbside (nginx), check-in (PHP), and gate (Laravel).
- **Pipe Diameter:** The pipe (server) can only handle a certain volume of water (data) per second. If you try to force more through, it backs up (413 error). Different pipes in series (nginx → PHP → Laravel) all have their own diameters.

## Internal Mechanics
1. **nginx Layer:** `client_max_body_size` directive — rejects oversized requests before they reach the application.
2. **PHP Layer:** `upload_max_filesize` and `post_max_size` in `php.ini` — limits request body and file uploads.
3. **Laravel Layer:** Custom middleware or validation rules enforce business-specific limits (e.g., "max 10 MB for product images").
4. **Error Response:** When a limit is exceeded, a `413 Payload Too Large` response is returned with details about the limit.
5. **Error Logging:** The violation is logged with consumer details for monitoring and abuse detection.
6. **Negotiation:** Some endpoints may allow larger limits via pre-approval or consumer tier.

## Patterns
- **Tiered Limits:** Free tier = 1 MB body limit; Pro tier = 10 MB; Enterprise tier = 50 MB.
- **Endpoint-Specific Limits:** File upload endpoints have higher limits; JSON mutation endpoints have lower limits.
- **Informational Headers:** Include `X-Content-Length-Limit` header in responses to inform consumers of the limit.
- **Graceful Rejection:** Return `413` with a clear error message, the current limit, and instructions for increasing it.
- **Streaming Validation:** For large payloads, validate size while streaming (don't buffer entire request before rejection).

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Body size limit | 1MB / 10MB / 100MB | 10MB default; 50MB for uploads | Balances typical payloads with protection |
| Enforcement layer | nginx only / PHP only / All layers | All layers (nginx > PHP > Laravel) | Defense-in-depth; each layer filters different violation types |
| Error format | Plain text / Structured JSON | Structured JSON | Consistent with API error format |
| Limit override | Config file / Database / Per-endpoint | Per-endpoint via Laravel middleware | Flexible for different use cases |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Large vs small limits | Large limits support legitimate use cases but increase DoS risk and memory usage |
| Single vs multi-layer enforcement | Single layer is simpler; multi-layer provides defense-in-depth |
| Fixed vs tiered limits | Fixed limits are simple; tiered limits allow monetization of large payloads |

## Performance Considerations
- nginx rejects oversized requests at the TCP level — minimal resource cost.
- PHP allocating `post_max_size` memory per request: larger limits increase memory pressure per worker.
- Streaming large uploads to disk (not memory) reduces per-request memory footprint.
- Validation at nginx level prevents wasted application processing on obviously-invalid requests.

## Production Considerations
- **Monitoring:** Track request size distribution; alert on requests exceeding 80% of the limit.
- **Logging:** Log all 413 responses with consumer ID, actual size, and endpoint.
- **Backup:** Configuration is in IaC — no separate backup.
- **Rollback:** Revert limit changes by reverting the config change; test in staging first.
- **Testing:** Load test with payloads at 100%, 110%, and 200% of the limit to verify enforcement.

## Common Mistakes
- Setting limits too low for legitimate use cases (returning 413 for normal operations).
- Setting limits too high (memory exhaustion during peak traffic).
- Configuring limits inconsistently across layers (e.g., nginx allows 10MB but PHP allows 2MB).
- Not updating limits when business requirements change (e.g., new feature adds file uploads).
- Forgetting that limit configuration differs between environments (dev may need higher limits for testing).

## Failure Modes
- **Memory Exhaustion:** A legitimate 50MB upload causes PHP worker memory exhaustion. Mitigation: streaming uploads to disk.
- **Inconsistent Limits:** nginx rejects at 10MB but Laravel accepts up to 50MB → confused consumers. Mitigation: enforce the lowest common denominator.
- **Chunked Transfer Bypass:** Consumer sends many small chunks that accumulate to exceed the limit. Mitigation: enforce cumulative size limits.
- **Limit Change Outage:** Reducing limits in production breaks existing consumers. Mitigation: announce limit changes; monitor for 413 spikes.

## Ecosystem Usage
- **Stripe:** 10MB request body limit; file upload endpoints have separate, larger limits.
- **GitHub API:** 100MB file size limit for content uploads; 5MB for JSON request bodies.
- **AWS API Gateway:** 10MB integration request payload limit; 29KB for headers.

## Related Knowledge Units

### Prerequisites
- [Rate Limit Tier Design](ku-15-rate-limit-tier-design)
- [CORS Policy Governance](ku-13-cors-policy-governance)

### Related Topics
- [Bulk Operation Design](ku-09-bulk-operation-design)
- [API Usage Tracking](ku-16-api-usage-tracking)

### Advanced Follow-up Topics
- Streaming request validation
- Dynamic size limits based on consumer tier
- Request size analytics for capacity planning

## Research Notes

### Source Analysis
nginx documentation recommends `client_max_body_size` as the first line of defense. The best practice is to set this at the gateway level and use PHP/Laravel settings for fine-grained control.

### Key Insight
The most common request size issue is not about absolute limits but **inconsistent limits across layers**. A request rejected by nginx after passing PHP is a confusing consumer experience. The solution is to enforce the strictest limit at the outermost layer (nginx) and relax inward.

### Version-Specific Notes
- Laravel 11.x: `php.ini` settings (`upload_max_filesize`, `post_max_size`) must be larger than nginx `client_max_body_size`.
- PHP 8.4: `INI` settings are per-request — larger limits increase per-worker memory; use `memory_limit` as a safety net.
