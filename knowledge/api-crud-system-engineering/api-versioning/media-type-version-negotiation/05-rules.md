# Rules: Media Type Version Negotiation

## Rule: Use Middleware for Version Negotiation
- **Condition:** When implementing media type version negotiation
- **Action:** Create dedicated middleware to parse Accept headers, resolve version, and set request attributes. Keep negotiation logic out of controllers.
- **Consequence:** Negotiation is centralized; controllers focus on business logic.
- **Enforcement:** Architecture review ensures negotiation is in middleware, not controllers.

## Rule: Include Vary: Accept In Responses
- **Condition:** When using Accept header for version negotiation
- **Action:** Set `Vary: Accept` header on all responses from version-negotiated endpoints. Include all headers that influence content selection.
- **Consequence:** Caching infrastructure correctly differentiates responses by version.
- **Enforcement:** Automated response header tests verify Vary header presence.

## Rule: Fall Back to Latest for Generic Accept
- **Condition:** When client sends generic Accept header (application/json, */*)
- **Action:** Resolve to the latest stable version. Document this behavior in API documentation.
- **Consequence:** Clients that don't manage Accept headers still receive a working response.
- **Enforcement:** Integration tests verify generic Accept resolves to latest version.

## Rule: Return 406 for Unsupported Media Types
- **Condition:** When client requests an unsupported version or media type
- **Action:** Return HTTP 406 Not Acceptable with a body listing supported versions and a Link header to documentation.
- **Consequence:** Clients receive clear, actionable error instead of silent fallback.
- **Enforcement:** Tests verify 406 response for unsupported Accept values.

## Rule: Respond With Negotiated Version In Content-Type
- **Condition:** When responding to a negotiated request
- **Action:** Set response `Content-Type` header to match the negotiated version, including the version parameter.
- **Consequence:** Client can verify which version it received.
- **Enforcement:** Integration tests verify Content-Type matches requested version.

## Rule: Attach Resolved Version to Request Attributes
- **Condition:** After version negotiation is complete
- **Action:** Store the resolved version as a request attribute: `$request->attributes->set('api_version', $version)`.
- **Consequence:** Controllers and downstream code access the version without reparsing headers.
- **Enforcement:** Middleware tests verify request attribute is set correctly.
