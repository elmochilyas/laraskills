# Anti-Patterns — Authorization Error Responses

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Authorization Error Responses |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Inconsistent 403/404 Strategy | High | Medium | Code review: same resource returns 403 on one endpoint, 404 on another |
| Exposing Permission Hierarchy | High | Medium | Code review: response lists user's current roles or missing permissions |
| Message-Based Permission Hints | Medium | Medium | Code review: "You need the admin role" in message string |
| Returning 401 for Denied Users | High | Medium | Code review: authenticated-but-denied returns 401 |
| Catch-All 403 with No Detail | Medium | Medium | Code review: 403 with no context about what was denied |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| AuthorizationException Unmapped | `AuthorizationException` falls through to generic 500 | 500 error for auth failures, inconsistent with error handling design |
| Spatie UnauthorizedException Not Mapped | Package-specific exception not caught by default handler | Falls through to generic handling, wrong status code |
| Overly Specific Detail | `required_permission: 'posts.update.others'` reveals too much | Attacker learns which specific permission to escalate |

---

## Anti-Pattern Details

### AP-AZR-01: Inconsistent 403/404 Strategy

**Description**: Some endpoints return 403 Forbidden when a user lacks access to a resource, while others return 404 Not Found for the same resource type. Attackers can map which resources exist by comparing response codes. Legitimate clients receive different error shapes for the same scenario depending on which endpoint they hit.

**Root Cause**: Per-endpoint decision making without a team-wide strategy. Each developer chooses 403 or 404 based on personal preference. No convention exists.

**Impact**:
- Attackers can enumerate resources by comparing 403 vs 404 responses
- Clients cannot write consistent error handling (some resources show "not found," others show "forbidden")
- Debugging is confusing: "I can access this resource on endpoint A but not on endpoint B"
- Security audit finds inconsistent access control response patterns

**Detection**:
- Code review: some controllers return 403, others return 404 for the same resource type
- Penetration testing: different status codes for the same resource access attempt via different endpoints
- Developer inconsistency: "Should I return 403 or 404 for this?"

**Solution**:
- Choose one strategy per resource type and document it
- Option A: Always return 403 (honest — resource exists but access denied)
- Option B: Always return 404 (security-focused — hide resource existence)
- Apply the chosen strategy consistently across all endpoints for that resource type
- Document the decision in the project's architecture guide

**Example**:
```php
// BEFORE: Inconsistent strategy
class UserPostController
{
    public function show(int $postId): JsonResponse
    {
        $post = Post::findOrFail($postId);
        if ($post->user_id !== auth()->id()) {
            return response()->json(['error' => 'Not found'], 404); // ❌ 404
        }
    }
}
class AdminPostController
{
    public function show(int $postId): JsonResponse
    {
        $post = Post::findOrFail($postId);
        if (!auth()->user()->isAdmin()) {
            return response()->json(['error' => 'Forbidden'], 403); // ❌ 403
        }
    }
}

// AFTER: Consistent strategy (always 403)
class PostController
{
    public function show(int $postId): JsonResponse
    {
        $this->authorize('view', Post::findOrFail($postId));
        // ...
    }
}
```

---

### AP-AZR-02: Exposing Permission Hierarchy

**Description**: The 403 error response includes the user's current roles or permissions alongside what was required. "You have role 'viewer', need 'editor'" — this tells an attacker not only which permission they need, but also what permissions they currently have. This information can be used to plan privilege escalation attacks.

**Root Cause**: Helpfulness. The developer wants to provide actionable information so users can request the correct access level.

**Impact**:
- Permission enumeration: attacker learns the full RBAC structure
- Privilege escalation planning: attacker knows which permissions are valuable
- User's current permissions are exposed (privacy concern for sensitive roles)
- Social engineering: attacker knows which role to impersonate

**Detection**:
- Code review: 403 response includes `current_permissions`, `user_role`, `user_permissions`
- Code review: response lists permissions the user is missing
- Penetration testing: 403 response reveals role/permission structure

**Solution**:
- Only include `required_permission` in the response (what is needed, not what is missing)
- Never include the user's current roles, permissions, or features
- Use opaque `required_permission` values that don't map directly to code internals
- If role information must be communicated, use an error code, not a description

**Example**:
```php
// BEFORE: Exposing permission hierarchy
return response()->json([
    'error' => [
        'code' => 'USER.AUTH_FORBIDDEN',
        'message' => 'Insufficient permissions.',
        'detail' => [
            'current_role' => 'viewer',         // ❌ exposes user's role
            'required_role' => 'editor',         // ❌ exposes hierarchy
            'your_permissions' => ['read'],      // ❌ exposes full context
            'required_permissions' => ['write'], // ❌ exposes target permissions
        ],
    ],
], 403);

// AFTER: Minimal, safe detail
return response()->json([
    'error' => [
        'code' => 'USER.AUTH_INSUFFICIENT_ROLE',
        'message' => 'You do not have permission to perform this action.',
        'detail' => [
            'required_permission' => 'post.update', // ✅ only what's needed
        ],
    ],
], 403);
```

---

### AP-AZR-03: Returning 401 for Denied Users

**Description**: An authenticated user who lacks permission to access a resource receives an HTTP 401 Unauthorized instead of 403 Forbidden. The client interprets this as an authentication failure and may attempt to re-authenticate or refresh tokens, entering a loop where authentication succeeds but the endpoint still returns 401.

**Root Cause**: Confusion between authentication and authorization. The developer treats "not allowed" as "not authenticated."

**Impact**:
- Clients enter re-authentication loops: authenticated → 401 → re-auth → 401 → ...
- Token refresh logic fires unnecessarily for authorization failures
- Client-side user experience: repeated login prompts for missing permissions
- Security monitoring: authorization denials are invisible (lost in auth failure noise)

**Detection**:
- Code review: `AuthorizationException` mapped to 401 response
- Code review: authorization middleware returns 401 for policy denials
- Bug reports: "I keep getting logged out when I try to access a feature I don't have access to"

**Solution**:
- Map `AuthorizationException` to 403, never 401
- The distinction is clear: 401 = "identify yourself," 403 = "you're identified but not allowed"
- Validate authentication status before authorization checks

**Example**:
```php
// BEFORE: 401 for denied users
public function render(AuthorizationException $e, Request $request): JsonResponse
{
    return response()->json([
        'error' => ['code' => 'USER.AUTH_UNAUTHENTICATED', 'message' => 'Not authenticated.', 'status' => 401],
    ], 401); // ❌ should be 403
}

// AFTER: 403 for denied users
public function render(AuthorizationException $e, Request $request): JsonResponse
{
    return response()->json([
        'error' => ['code' => 'USER.AUTH_FORBIDDEN', 'message' => 'Insufficient permissions.', 'status' => 403],
    ], 403); // ✅ correct status
}
```
