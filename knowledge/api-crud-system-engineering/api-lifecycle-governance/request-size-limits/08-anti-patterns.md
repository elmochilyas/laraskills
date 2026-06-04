# Anti-Patterns: Request Size Limits

## AP-1: Innermost Limit Stricter Than Outermost
**Category**: Performance

**Description**: Configuring a stricter size limit at an inner layer (PHP or Laravel) than the outermost layer (nginx). Requests pass nginx successfully but are rejected by PHP or Laravel, wasting server resources processing requests that will be rejected.

**Warning Signs**:
- nginx `client_max_body_size` is larger than PHP `post_max_size`
- Requests pass nginx health checks but return 413 from Laravel
- Server CPU/memory usage is high from processing requests eventually rejected
- Oversized request logs show nginx accepted but Laravel rejected

**Harms**:
- Wasted server resources processing doomed requests
- Confusing error responses (nginx allows, application rejects)
- Inconsistent behavior across different infrastructure layers
- Higher resource costs without benefit

**Real-World Consequence**: nginx `client_max_body_size = 50M` allows a 30MB upload request through. PHP `post_max_size = 10M` rejects it after buffering the entire 30MB into memory. The request consumed 30MB of PHP worker memory, nginx bandwidth, and processing time — all for a request that was always going to be rejected.

**Preferred Alternative**: Configure the strictest limit at nginx (outermost layer), with equal or more permissive limits at PHP and Laravel. The layered approach should be: nginx <= PHP <= Laravel.

**Refactoring Strategy**: Audit all infrastructure layer configurations, ensure nginx limit is the smallest value, set PHP limit equal to or greater than nginx, set Laravel middleware limit equal to or greater than PHP.

**Detection Checklist**:
- `[ ]` Is nginx `client_max_body_size` the strictest limit?
- `[ ]` Is PHP `post_max_size` >= nginx `client_max_body_size`?
- `[ ]` Are requests passing nginx but rejected by Laravel?
- `[ ]` Are oversized requests logged with the rejecting layer?

**Related**: 05-rules.md (Rule 1: Enforce Strictest Limit at Outermost Layer), 04-standardized-knowledge.md, 07-decision-trees.md

---

## AP-2: Single Limit for All Endpoints
**Category**: Architecture

**Description**: Using the same request size limit for all endpoints regardless of their purpose. File upload endpoints with 50MB requirements use the same limit as JSON mutation endpoints with 100KB payloads, either blocking uploads or allowing oversized JSON abuse.

**Warning Signs**:
- File upload endpoints and JSON mutation endpoints share the same limit
- Upload limit is low (blocking legitimate file uploads)
- JSON mutation limit is high (allowing oversized payload abuse)
- Single `client_max_body_size` for all routes
- No endpoint-specific override mechanism

**Harms**:
- Upload endpoints reject legitimate large files
- JSON mutation endpoints vulnerable to oversized payload DoS
- Cannot differentiate limits for different use cases
- Single limit is either too restrictive for uploads or too permissive for mutations

**Real-World Consequence**: A single 50 MB body limit applies to all endpoints. An attacker sends 50 MB JSON payloads to `POST /users` repeatedly. Each request consumes 50 MB of PHP memory. At 20 concurrent requests, the server runs out of memory and crashes. All legitimate traffic is lost.

**Preferred Alternative**: Configure endpoint-specific overrides: higher limits for file upload endpoints, lower limits for JSON mutation endpoints, appropriate limits for bulk endpoints.

**Refactoring Strategy**: Create middleware that accepts per-endpoint size limits, categorize endpoints (mutation, upload, bulk, read), set appropriate limits per category, document limits in API reference.

**Detection Checklist**:
- `[ ]` Do file upload endpoints have higher limits than mutation endpoints?
- `[ ]` Is there a single limit shared across all endpoints?
- `[ ]` Are larger JSON payloads being sent to non-upload endpoints?
- `[ ]` Is memory usage correlated with request body sizes?

**Related**: 05-rules.md (Rule 6: Configure Endpoint-Specific Overrides for Uploads), 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: No Consumer Feedback on Limits (Bare 413)
**Category**: Design

**Description**: Returning a bare HTTP 413 Payload Too Large response without indicating the current limit, the actual request size, or how to increase the limit. Consumers have no actionable information and must contact support or search documentation.

**Warning Signs**:
- 413 response contains no body or minimal body
- No `X-Content-Length-Limit` header on responses
- Support tickets asking "what is the request size limit?"
- Consumers repeatedly hit 413 trying to guess the limit
- Error response: just `abort(413)`

**Harms**:
- Consumer has no path to resolution
- Support ticket created for simple limit question
- Integration delayed while consumer searches for limit info
- Consumer cannot programmatically handle oversize (no limit value)
- Stuck at 413 until manual intervention

**Real-World Consequence**: A consumer sends an 11 MB request, receives a bare 413 with no body. They don't know the limit is 10 MB, whether it's 1 MB or 100 MB. They file a support ticket asking "what's the limit?" The support team responds 2 days later. The consumer adjusts and succeeds. This cycle repeats for every new consumer.

**Preferred Alternative**: Return 413 with structured JSON containing the current limit, actual request size, and upgrade instructions. Include `X-Content-Length-Limit` header on all responses.

**Refactoring Strategy**: Add structured error response to 413 handling, include `limit` and `actual_size` fields, add `X-Content-Length-Limit` header middleware, document limits in developer portal, provide upgrade path for larger limits.

**Detection Checklist**:
- `[ ]` Do 413 responses include limit and actual size?
- `[ ]` Is there an upgrade path mentioned in 413 responses?
- `[ ]` Is `X-Content-Length-Limit` header present on responses?
- `[ ]` Are support tickets related to request size limits common?

**Related**: 05-rules.md (Rule 3: Return 413 with Limit Info and Upgrade Path, Rule 7: Include X-Content-Length-Limit Header), 04-standardized-knowledge.md, 07-decision-trees.md

---

## AP-4: Buffering Entire Body Before Size Validation
**Category**: Performance

**Description**: Reading the entire request body into memory before checking whether it exceeds the size limit. A 50 MB request consumes 50 MB of memory just to be rejected, creating a memory-based DoS vulnerability.

**Warning Signs**:
- Size validation reads entire body before checking
- Memory usage correlates with largest request body size
- nginx is not configured for size limits (all validation at PHP level)
- PHP memory limit is close to maximum expected request size
- Under concurrent requests, memory exhaustion occurs

**Harms**:
- Memory exhaustion under concurrent large requests
- DoS vulnerability — attacker sends many large requests to exhaust memory
- OOM kills affect all concurrent requests, not just the oversized one
- Server capacity planning must account for worst-case buffering

**Real-World Consequence**: A Laravel API validates request size in middleware using `strlen($request->getContent())`. An attacker sends 20 concurrent POST requests with 50 MB payloads each. The server buffers all 20 requests (1 GB total) into PHP worker memory. The server runs out of memory and the OOM killer terminates processes, affecting all running applications.

**Preferred Alternative**: Enforce size limits at nginx during streaming (reject at TCP level before body is read). PHP upload limits also enforce during streaming. Never buffer the entire body before size validation.

**Refactoring Strategy**: Configure nginx `client_max_body_size` as primary size enforcement, use PHP `upload_max_filesize` and `post_max_size` as secondary layer, remove application-level size validation that buffers entire body (rely on infrastructure layers).

**Detection Checklist**:
- `[ ]` Is nginx rejecting oversized requests at TCP level?
- `[ ]` Does application code check size using `getContent()` or similar buffering?
- `[ ]` Is memory usage stable under concurrent large requests?
- `[ ]` Are there OOM incidents correlated with large request sizes?

**Related**: 05-rules.md (Rule 4: Enforce Limit During Streaming, Not After Buffering), 04-standardized-knowledge.md, 06-skills.md

---

## AP-5: Single Tier Limit for All Consumers
**Category**: Scalability

**Description**: Applying the same request size limit to all consumers regardless of their tier. Free-tier consumers can send large payloads (resource abuse), while enterprise consumers with legitimate large payload needs are blocked.

**Warning Signs**:
- Same limit applies to free and enterprise consumers
- Free-tier consumers sending large file uploads
- Enterprise consumers hitting limits on legitimate operations
- No consumer tier information in size limit logic
- Revenue-impacting limitations for paying customers

**Harms**:
- Free-tier abuse with large payloads
- Enterprise consumers blocked — revenue impact
- Resource allocation not aligned with business value
- Cannot monetize higher limits as upgrade incentive

**Real-World Consequence**: A single 10 MB body limit applies to all tiers. A free-tier consumer uploads 10 MB CSV files every minute, consuming significant server resources. An enterprise customer needs to upload 20 MB product catalogs but is blocked at 10 MB. The enterprise customer churns to a competitor with tiered limits.

**Preferred Alternative**: Implement tiered limits per consumer: Free (1 MB body, 5 MB upload), Pro (10 MB body, 50 MB upload), Enterprise (50 MB body, 200 MB upload).

**Refactoring Strategy**: Add consumer tier resolution to request pipeline, create tier-specific limit configuration, implement middleware that reads consumer tier and applies appropriate limit, document tier limits in developer portal.

**Detection Checklist**:
- `[ ]` Are there different limits per consumer tier?
- `[ ]` Are free-tier consumers sending large payloads?
- `[ ]` Are enterprise consumers blocked by standard limits?
- `[ ]` Is there documentation of tier-specific limits?

**Related**: 05-rules.md (Rule 2: Use Tiered Limits Per Consumer), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-6: Logging Oversized Request Payloads
**Category**: Security

**Description**: Logging the content of oversized requests when they are rejected. The payload may contain PII, credentials, financial data, or malicious content. Logging it creates a data breach, consumes storage, and may violate compliance requirements.

**Warning Signs**:
- Log entries contain full request body of oversized requests
- PII or sensitive data visible in application logs
- Log storage grows significantly from oversized request bodies
- Compliance audit flags payload logging
- Support team can see consumer data in logs

**Harms**:
- PII exposure through logs
- Regulatory non-compliance (GDPR, PCI)
- Storage costs for logged payloads
- Attackers could force large payload logging to exhaust disk space
- Sensitive data in log aggregation systems

**Real-World Consequence**: A Laravel middleware logs oversized requests with `Log::warning('Oversized request', ['payload' => $request->getContent()])`. A consumer accidentally sends a file containing customer PII (names, emails, phone numbers) that exceeds the size limit. The entire file content is logged. Log retention is 90 days. The PII data is stored in clear text across multiple log shards.

**Preferred Alternative**: Log oversized request attempts with consumer ID, endpoint, and actual size — never the request payload content.

**Refactoring Strategy**: Search codebase for oversized request logging, replace payload content with metadata only (consumer_id, endpoint, actual_size, limit), add log scrubbing to remove any accidentally logged payloads, verify in security review.

**Detection Checklist**:
- `[ ]` Are oversized request payloads ever logged?
- `[ ]` Do logs contain consumer ID, endpoint, and size only?
- `[ ]` Is there log scrubbing for accidentally captured payloads?
- `[ ]` Has a security audit flagged request body logging?

**Related**: 05-rules.md (Rule 5: Log Oversized Requests Without Payload Content), 04-standardized-knowledge.md, 06-skills.md
