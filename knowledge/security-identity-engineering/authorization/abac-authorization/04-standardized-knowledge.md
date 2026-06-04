# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | ABAC (Attribute-Based Access Control) |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Attribute-Based Access Control (ABAC) evaluates authorization based on attributes of the user, resource, action, and environment. Unlike RBAC (which checks roles), ABAC evaluates policies against attribute conditions: user department = "finance" AND resource amount < 10000 AND time of day = business hours. ABAC is more flexible than RBAC but requires a policy evaluation engine. In Laravel, ABAC can be implemented via custom Policy logic, external PDPs (Policy Decision Points) like Permit.io, or custom attribute evaluation services.

---

## Core Concepts

- **Attributes**: Subject (user role, department, clearance), Resource (type, owner, sensitivity), Action (read, write, delete), Environment (time, location, device).
- **PDP (Policy Decision Point)**: The system that evaluates attributes against policies and returns a permit/deny decision.
- **PEP (Policy Enforcement Point)**: Your Laravel application that intercepts requests and asks the PDP for a decision.
- **Policy Rules**: Condition → effect. `if user.department == resource.department AND action == 'read' then permit`.
- **Policy Combination**: When multiple policies match, combine results (deny-overrides, permit-overrides, first-applicable).

---

## When To Use

- Complex authorization beyond simple role/permission checks
- Multi-dimensional access control (department + location + time + resource type)
- Regulatory compliance requiring attribute-based controls
- Organizations using external authorization services (Permit.io, OPA)

## When NOT To Use

- Simple role-based authorization (RBAC with Spatie is simpler and sufficient)
- Applications with static, well-defined permissions
- When the overhead of policy evaluation is not justified
- Small teams where RBAC complexity is acceptable

---

## Best Practices

- **Start with RBAC, Add ABAC Where Needed**: Use RBAC for 80% of authorization. Add ABAC for edge cases requiring attribute evaluation.
- **Externalize Policy Decisions**: Use an external PDP (Permit.io, OPA) for ABAC policies — keeps policy logic separate from application code.
- **Cache PDP Decisions**: PDP evaluations may involve network calls. Cache decisions with appropriate TTL.
- **Audit Attribute Evaluations**: Log ABAC decisions (attributes evaluated, policy matched, decision) for compliance.
- **Test Policies Thoroughly**: ABAC policies can interact in unexpected ways. Test all policy combinations.

---

## Architecture Guidelines

- Laravel acts as PEP: intercepts requests via middleware/Gates → evaluates attributes → calls PDP → enforces decision
- PDP can be external (Permit.io API) or internal (custom service evaluating policies)
- Attribute context: collect user, resource, action, and environment attributes at request time
- Policy-as-code: write policies in a declarative format (Rego for OPA, Permit.io policy language)
- Policy combination strategy: deny-overrides (most secure) or permit-overrides (least restrictive)

---

## Performance Considerations

- PDP evaluation adds latency — external PDP: 10-100ms HTTP call; local PDP: 1-5ms
- Attribute collection: gather all context before PDP call — minimize PDP calls
- Cache PDP decisions per user+resource+action combination
- Batch PDP evaluations when possible (single request may need multiple decisions)

---

## Security Considerations

- **Attribute Integrity**: Attributes must come from trusted sources (server-side, not user-provided). Validate/resolve at the PEP.
- **Default Deny**: If no policy matches, the default should be deny.
- **PDP Availability**: External PDP failure should default to deny (fail closed), not permit (fail open).
- **Policy Management**: Policies should be version-controlled and reviewed. Unauthorized policy changes can expose data.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| ABAC for simple permission checks | Over-engineering | Unnecessary complexity for role-based needs | Start with RBAC; add ABAC for complex cases only |
| Trusting client-provided attributes | Convenience | Users can forge attributes | Always resolve attributes server-side |
| No PDP availability fallback | Assuming PDP always responds | Application downtime when PDP is down | Fail closed — deny when PDP unavailable |
| Not caching PDP decisions | Performance concern | Each request evaluates PDP 10+ times | Cache decisions with user+resource+action key |

---

## Anti-Patterns

- **Implementing a full PDP in application code**: Use dedicated policy engines (OPA, Permit.io)
- **ABAC without RBAC foundation**: ABAC should layer on top of RBAC, not replace it
- **Policies scattered across controllers**: Centralize in a PDP or service

---

## Examples

**Attribute collection (PEP):**
```php
// Gate or Policy asks for ABAC evaluation
class DocumentPolicy
{
    public function view(User $user, Document $document): bool
    {
        $decision = app(AbacService::class)->evaluate([
            'user' => [
                'department' => $user->department,
                'clearance' => $user->clearance_level,
            ],
            'resource' => [
                'type' => 'document',
                'classification' => $document->classification,
                'department' => $document->department_id,
            ],
            'action' => 'read',
            'environment' => [
                'ip_country' => request()->ip_country,
                'time_of_day' => now()->hour,
            ],
        ]);

        return $decision === 'permit';
    }
}
```

**PDP evaluation (using Permit.io example):**
```php
$permit = new \Permit\Permit(env('PERMIT_API_KEY'));

$decision = $permit->check([
    'user' => $user->email,
    'action' => 'read',
    'resource' => 'document:' . $document->id,
    'context' => [
        'time' => now()->hour,
        'department' => $user->department,
    ],
]);
```

---

## Related Topics

- RBAC design
- Spatie laravel-permission
- ReBAC (Relationship-Based Access Control)
- External PDP integration (Permit.io, OPA)

---

## AI Agent Notes

- ABAC is maturing in the Laravel ecosystem but lacks a canonical implementation. Evaluate vendor lock-in with external PDPs.
- Recommend RBAC-first, ABAC-later approach. Start with Spatie permissions; add ABAC only for complex attribute-based rules.
- External PDPs (Permit.io) are more mature than custom implementations.

---

## Verification

- [ ] ABAC need justified (cannot be solved with RBAC alone)
- [ ] Attributes collected server-side (not from client request)
- [ ] PDP evaluation has timeout and fail-closed fallback
- [ ] PDP decisions cached (user+resource+action key)
- [ ] ABAC decisions logged for audit
- [ ] Default deny when no policy matches
- [ ] Policies version-controlled and reviewed
- [ ] RBAC foundation exists for simple permission checks
