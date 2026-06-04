# Skill: Design Authorization Error Responses

## Purpose
Return consistent 403 error responses for authenticated users attempting actions they don't have permission to perform, with descriptive error codes identifying the specific permission or role gap.

## When To Use
- Any API with role-based or permission-based authorization
- When distinguishing between missing auth (401) and insufficient permissions (403)
- For APIs with fine-grained authorization (multiple roles, policies, gates)

## When NOT To Use
- APIs with no authorization requirements
- When 401/403 distinction is not relevant (internal-only tools)
- When authorization is handled entirely at the gateway level

## Prerequisites
- Authorization guard setup
- Error code taxonomy entries

## Inputs
- Permission/role definitions
- Policy gate configurations

## Workflow
1. Map `AuthorizationException` and `AccessDeniedHttpException` in exception handler
2. Return 403 with error code identifying the specific permission or role — never 401 for authorization failures
3. Include the required permission or role in the error response detail
4. Use distinct codes per authorization domain — `USER.AUTH_FORBIDDEN`, `USER.AUTH_MISSING_ROLE`
5. Never expose the full permission list or user's permission set in the response
6. Log authorization failures with user ID, required permission, and attempted action
7. Test authorization error responses per policy/gate for every user role

## Validation Checklist
- [ ] 403 returned for authorization failures, never 401
- [ ] Domain-specific error codes used per permission type
- [ ] Required permission included in error detail
- [ ] No stack traces in 403 responses
- [ ] Authorization failure logged with user and action context
- [ ] Tests verify 403 for unauthorized users per endpoint

## Common Failures
- Returning 401 instead of 403 — confuses auth with authorization
- Generic error message — no indication of which permission was missing
- Exposing user's full permission set — information disclosure
- Not logging authorization failures — can't detect access pattern abuse

## Decision Points
- Permission code vs role code — permission code for granular, role code for coarse
- Detail inclusion — include required permission, exclude user's full permissions
- Log level — warning for expected denials, critical for unexpected authorization failures

## Performance Considerations
- Authorization failure path is not performance-sensitive
- Policy/gate resolution happens before the exception — no additional cost

## Security Considerations
- Never expose user's full permission set in error response
- Never distinguish "resource doesn't exist" from "no permission to access resource" for hidden resources
- Log authorization failures for audit and abuse detection
- Ensure 403 works with hidden resources (same response for missing and forbidden)

## Related Rules
- Return 403 for Authorization Failures, Not 401
- Use Domain-Specific Authorization Error Codes
- Include Required Permission in Error Detail
- Never Expose Full Permission Set
- Log Authorization Failures with Context

## Related Skills
- Authentication Error Responses — 401 vs 403 distinction
- Standardized Error Envelope — the envelope for authorization responses
- Exception-to-Code Mapping — mapping AuthorizationException

## Success Criteria
- 403 returned for all authorization failures
- Error code identifies which specific permission was missing
- Authorization failures logged for audit trail
- No permission set leakage in responses
- Hidden resources return same response for missing and forbidden