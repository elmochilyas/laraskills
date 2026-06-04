# Rules: Query String Versioning

## Rule: Default to Latest When Query Parameter Is Missing
- **Condition:** When handling requests without a version query parameter
- **Action:** Resolve to the latest stable version. Never return an error for missing version.
- **Consequence:** Unversioned requests always succeed; new consumers don't need to know about versioning to get started.
- **Enforcement:** Integration tests verify requests without `?version=` return 200, not 400.

## Rule: Validate Query Parameter Format Strictly
- **Condition:** When parsing the version query parameter
- **Action:** Accept only integer major versions. Reject minor versions (2.0, 2.1) and non-numeric values.
- **Consequence:** Consistent version interpretation; no ambiguity about minor version boundaries.
- **Enforcement:** Middleware tests verify rejection of non-integer and minor version values.

## Rule: Return 400 for Unrecognized Version Format
- **Condition:** When query parameter contains an invalid version
- **Action:** Return HTTP 400 Bad Request with a message explaining valid version format.
- **Consequence:** Clients receive actionable error information.
- **Enforcement:** Tests verify 400 response for invalid version values.

## Rule: Return X-Api-Version Header With the Actual Version Used
- **Condition:** On every versioned response
- **Action:** Set `X-Api-Version` header to the resolved version number (explicit or default).
- **Consequence:** Clients always know which version they received.
- **Enforcement:** Automated header assertion tests verify X-Api-Version is present on all versioned endpoints.

## Rule: Log Explicit Version Requests For Analytics
- **Condition:** When a client explicitly provides the version parameter
- **Action:** Log the request with version information for usage tracking and deprecation decisions.
- **Consequence:** Data-driven version management; teams know which versions are in use.
- **Enforcement:** Monitoring dashboard tracks explicit version request ratios.

## Rule: Reject Non-Numeric Version Parameters
- **Condition:** When version parameter contains non-numeric characters
- **Action:** Validate parameter with `is_numeric()` and int cast. Reject letters, symbols, and SQL injection patterns.
- **Consequence:** Prevents injection and type confusion.
- **Enforcement:** Security tests verify non-numeric parameters are rejected.
