# Skill: Implement Bare Body Response Design

## Purpose
Design responses without envelope wrapper for bandwidth-constrained or internal APIs: return data directly without `data`/`meta`/`errors` wrapping, with Content-Type header and status code.

## When To Use
- Internal microservice APIs (both sides controlled)
- Bandwidth-optimized endpoints (mobile, IoT)
- Bulk data endpoints reducing payload overhead

## When NOT To Use
- Public APIs with diverse consumers
- APIs where envelope consistency is required
- APIs where clients parse generically

## Prerequisites
- Response structure decisions
- Consumer profiling

## Inputs
- Bare response specification per endpoint

## Workflow
1. Configure `withoutWrapping()` in API Resource or return raw response
2. Return data directly: `return $data` instead of `return response()->json(['data' => $data])`
3. Set appropriate HTTP status code and Content-Type header
4. Use status code and headers for metadata — not envelope wrapper
5. Return 200 with body for successful GET
6. Return 201 with body for successful POST
7. Return 204 with no body for successful DELETE
8. Return error response with error body and appropriate 4xx/5xx
9. Document bare response format per endpoint
10. Ensure consumers understand non-envelope format

## Validation Checklist
- [ ] No `data`/`meta`/`errors` wrapper keys
- [ ] Data returned directly as JSON body
- [ ] Status codes indicate success/failure
- [ ] Content-Type header present
- [ ] 4xx/5xx include error body
- [ ] Bare format documented
- [ ] Consumers configured for bare format

## Related Skills
- Envelope Response Design
- Response Format Decision Framework
- Data Wrapping Configuration
