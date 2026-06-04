# Anti-Patterns: Idempotency Key Error Handling

## AP-1: Generic Idempotency Error Codes
**Category**: Design

**Description**: Using a single generic error code (e.g., `IDEMPOTENCY_ERROR`) for all idempotency failure scenarios. Consumers cannot distinguish between a missing key, an expired key, a payload conflict, or a concurrent lock — forcing them to parse error messages programmatically.

**Warning Signs**:
- All idempotency errors return the same error code
- Error code is generic like `IDEMPOTENCY_ERROR` or `INVALID_REQUEST`
- Consumers must parse error message text to determine the issue
- Support tickets ask "what kind of idempotency error?"
- Consumer retry logic works for some errors but not others

**Harms**:
- Consumers cannot implement differentiated retry logic
- Programmatic handling requires brittle message parsing
- Wrong retry strategy leads to repeated failures
- Increased support burden for common idempotency issues

**Real-World Consequence**: An API returns `{ "code": "IDEMPOTENCY_ERROR" }` for all scenarios. A consumer's retry logic treats all errors as "retry with same key." For conflicts (different payload), they retry with the same key and get the same error endlessly. For expired keys, they retry but never generate a new key because they can't distinguish expiration from other errors.

**Preferred Alternative**: Return unique error codes per scenario: `IDEMPOTENCY_KEY_MISSING`, `IDEMPOTENCY_CONFLICT`, `IDEMPOTENCY_EXPIRED`, `IDEMPOTENCY_STORE_UNAVAILABLE`, `CONCURRENT_REQUEST_LOCK`.

**Refactoring Strategy**: Define error code enum or constant class, create custom exception types per scenario, update middleware to throw specific exceptions, add render methods returning structured JSON with unique codes, update documentation with error code reference.

**Detection Checklist**:
- `[ ]` Are there unique error codes for each idempotency scenario?
- `[ ]` Can consumers distinguish conflict from expired from concurrent lock?
- `[ ]` Do error codes follow a consistent namespace?
- `[ ]` Are error codes documented in the API reference?

**Related**: 05-rules.md (Rule 1: Return Unique Error Codes Per Idempotency Scenario), 04-standardized-knowledge.md, 06-skills.md

---

## AP-2: Leaking Stored Payloads in Conflict Responses
**Category**: Security

**Description**: Including the stored request payload or response data in idempotency conflict error responses. An attacker can use conflict responses to extract information about previous requests, potentially exposing PII, credentials, or financial data.

**Warning Signs**:
- Conflict responses include `stored_payload` or `original_request` fields
- Error response shows data from a previous request
- PII or financial data appears in error messages
- Security audit flags idempotency errors as data leakage vector

**Harms**:
- PII exposure (previous request data leaked via errors)
- Regulatory non-compliance (GDPR, PCI)
- Cross-consumer data leakage (Consumer A sees Consumer B's request data)
- Attack vector for information extraction

**Real-World Consequence**: An API returns the stored request payload in conflict error responses: `{ "error": { "code": "IDEMPOTENCY_CONFLICT", "stored_payload": { "credit_card": "4111-1111-1111-1111", "cvv": "123" } } }`. An attacker sends requests with guessed idempotency keys and reads conflict responses to extract previous consumers' payment data.

**Preferred Alternative**: Never include stored request payload or response data in conflict error responses. Return only the error code, a generic message, and resolution guidance.

**Refactoring Strategy**: Remove any stored payload fields from error response serialization, add automated test verifying no payload in conflict responses, review all idempotency error rendering code for data leakage, add security scan for PII in error responses.

**Detection Checklist**:
- `[ ]` Do conflict responses contain any stored data?
- `[ ]` Can previous request data be inferred from error messages?
- `[ ]` Are idempotency errors reviewed for data leakage?
- `[ ]` Is there a test verifying no payload in conflict responses?

**Related**: 05-rules.md (Rule 4: Never Include Stored Payload in Conflict Error Responses), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-3: Missing Retry-After on Concurrent Lock Responses
**Category**: Reliability

**Description**: Returning HTTP 409 for concurrent lock without a `Retry-After` header. Consumers retry immediately upon receiving the error, creating a retry storm that exacerbates contention and may prevent any request from ever succeeding.

**Warning Signs**:
- CONCURRENT_REQUEST_LOCK responses lack Retry-After header
- Same request repeatedly gets concurrent lock errors
- Redis lock contention spikes during concurrent request bursts
- Metrics show high retry rates for concurrent lock errors
- Consumer retry loops produce no successful operations

**Harms**:
- Retry storm exacerbates lock contention
- Neither request may complete successfully
- Redis load spikes due to repeated lock checks
- Consumer retry loops waste resources on both sides
- Eventual consumer timeout with no successful operation

**Real-World Consequence**: A bulk import sends 500 concurrent requests with the same idempotency key (network layer retry). The first request acquires the lock. The remaining 499 receive `CONCURRENT_REQUEST_LOCK` without `Retry-After`. All 499 retry immediately, creating 499 simultaneous lock checks. Redis CPU spikes, lock contention increases, and the first request takes 30 seconds to complete under the load.

**Preferred Alternative**: Include `Retry-After` header (default 500ms-1 second) on all CONCURRENT_REQUEST_LOCK responses to coordinate consumer backoff.

**Refactoring Strategy**: Add `Retry-After: 1` header to concurrent lock response, document recommended retry interval, add exponential backoff recommendation in resolution field, monitor concurrent lock retry rates.

**Detection Checklist**:
- `[ ]` Do CONCURRENT_REQUEST_LOCK responses include Retry-After header?
- `[ ]` Are there retry storms observed with concurrent locks?
- `[ ]` Do consumers respect the Retry-After recommendation?
- `[ ]` Is there an alert for high concurrent lock rates?

**Related**: 05-rules.md (Rule 3: Include Retry-After Header on Concurrent Lock Responses), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-4: No Resolution Guidance in Errors
**Category**: Maintainability

**Description**: Returning idempotency errors that describe what went wrong but provide no guidance on what the consumer should do to resolve it. Consumers must search documentation or contact support to determine the correct action.

**Warning Signs**:
- Error messages say "Idempotency key expired" but not what to do
- Support tickets ask "What does this error mean and how do I fix it?"
- Error documentation is required for basic troubleshooting
- Consumers repeatedly ask the same idempotency error questions
- Integration timelines are extended by error interpretation delays

**Harms**:
- Increased support burden for common errors
- Consumer frustration and slower integration
- Incorrect retry logic (consumer guesses wrong action)
- Documentation must cover what error messages should already say

**Real-World Consequence**: A consumer receives `{ "error": { "code": "IDEMPOTENCY_EXPIRED", "message": "Idempotency key has expired." } }`. The developer doesn't know whether to retry with the same key, generate a new key, or contact support. They file a support ticket, wait 24 hours for a response, and learn the answer was "generate a new key."

**Preferred Alternative**: Include a `resolution` field in every idempotency error response explaining the concrete action the consumer should take.

**Refactoring Strategy**: Add `resolution` field to all idempotency error response schemas, define resolution text per error scenario, update documentation to reference error formats, verify resolution guidance is actionable (not generic like "contact support").

**Detection Checklist**:
- `[ ]` Do all idempotency errors include resolution guidance?
- `[ ]` Is the resolution guidance specific and actionable?
- `[ ]` Do error-related support tickets correlate with missing resolution fields?
- `[ ]` Are error responses documented in the API reference?

**Related**: 05-rules.md (Rule 5: Provide Resolution Steps in Every Error Response), 04-standardized-knowledge.md, 06-skills.md

---

## AP-5: Full Idempotency Keys in Logs
**Category**: Security

**Description**: Logging full idempotency keys in application logs, error tracking systems, or metrics. Idempotency keys can be used as correlation identifiers and may enable request tracking across services, creating a PII-adjacent data leak.

**Warning Signs**:
- Log entries contain full idempotency key values
- Error tracking issues include key as context data
- Metrics are tagged with idempotency key values
- Log retention policies don't account for key data sensitivity
- Security audit flags keys in logs

**Harms**:
- PII-adjacent data leakage in logs
- Consumer activity trackable via leaked keys
- Compliance violations (GDPR right to deletion may apply)
- Keys can be used to correlate consumer requests across time
- Log retention extends key lifetime beyond intended TTL

**Real-World Consequence**: A team logs full idempotency keys for debugging: `Log::info('Processing idempotency key', ['key' => $key])`. Log retention is 90 days. An attacker gains access to the log system and extracts all idempotency keys from the last 3 months. They can now track every consumer's request patterns and timestamps, violating consumer privacy expectations.

**Preferred Alternative**: Log only the consumer prefix portion of idempotency keys (e.g., `acct_123` from `acct_123:uuid`). Never write full keys to logs, metrics, or error tracking.

**Refactoring Strategy**: Search codebase for idempotency key log statements, replace full key with prefix only, add log scrubbing middleware to redact full keys, verify in log review that full keys are not written.

**Detection Checklist**:
- `[ ]` Are full idempotency keys present in logs?
- `[ ]` Are only key prefixes logged?
- `[ ]` Is there log scrubbing for idempotency keys?
- `[ ]` Are metrics free of full key values?

**Related**: 05-rules.md (Rule 6: Log Key Prefixes, Not Full Keys), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: Wrong HTTP Status Codes for Idempotency Errors
**Category**: Design

**Description**: Using HTTP 400 Bad Request for all idempotency errors regardless of the specific scenario. Consumers cannot build correct retry logic because status-code-based middleware treats conflicts, expired keys, and missing keys identically.

**Warning Signs**:
- All idempotency errors return 400 Bad Request
- Missing key, invalid key, conflict, and expired all return the same status
- Consumers cannot distinguish "retry with new key" from "don't retry"
- Status-code-based client libraries treat all idempotency errors as client errors
- Error handling middleware cannot differentiate between scenarios

**Harms**:
- Consumers cannot implement correct retry logic
- Status-code-based retry libraries work incorrectly
- 409 semantics (conflict requires resolution) are lost
- Expired keys treated same as invalid keys — different consumer actions needed
- Integration friction for standardized HTTP clients

**Real-World Consequence**: An API returns 400 for all idempotency errors. A consumer's HTTP client is configured to retry on 5xx but not 4xx. The consumer's payment request with an expired key returns 400 and is not retried. The payment fails but the consumer doesn't know to generate a new key and retry.

**Preferred Alternative**: Use semantically correct HTTP status codes: 409 Conflict for payload conflicts and concurrent locks, 422 Unprocessable Entity for missing or invalid keys, 503 Service Unavailable for store outages.

**Refactoring Strategy**: Review all idempotency error paths, map each error type to correct status code, update exception classes to set appropriate status, add automated tests verifying status codes per error scenario.

**Detection Checklist**:
- `[ ]` Are 409, 422, and 503 used correctly for idempotency errors?
- `[ ]` Are conflicts (different payload) returning 409?
- `[ ]` Are missing/invalid keys returning 422?
- `[ ]` Is store unavailability returning 503?

**Related**: 05-rules.md (Rule 2: Use HTTP 409 for Payload Conflicts, 422 for Validation Errors), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md
