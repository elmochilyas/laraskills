# Decision Trees: Authentication Test Patterns

## Tree 1: Auth Test Scenario Selection

```
What authentication mechanism does the endpoint use?
├── Sanctum Token Auth
│   ├── Test missing token → GET with no Authorization header → assert 401
│   ├── Test invalid token → GET with Authorization: Bearer invalid-token → assert 401
│   ├── Test expired token → Create expired token → GET with it → assert 401
│   ├── Test valid token → Create valid token → GET with it → assert 200
│   ├── Test insufficient ability → Create token with wrong ability → assert 403
│   └── Test token revocation → Revoke token → GET with it → assert 401
├── Sanctum SPA Cookie Auth
│   ├── Test unauthenticated → GET without session → assert 401 (with Accept header)
│   ├── Test CSRF → GET /sanctum/csrf-cookie → assert 204
│   ├── Test login → POST /login with credentials → assert 204
│   └── Test logout → POST /logout → assert 204 + subsequent GET assert 401
└── Passport Token Auth
    ├── Test missing token → assert 401
    ├── Test invalid/expired token → assert 401
    ├── Test valid token → assert 200
    └── Test scope → assert 403 if scope missing → assert 200 if scope present
```

## Tree 2: actingAs vs Manual Token

```
What type of authentication are you simulating?
├── Session/cookie-based → Use actingAs($user) — authenticates via session
├── Token-based with Sanctum
│   ├── Default ability is sufficient → actingAs($user) or actingAs($user, ['ability'])
│   └── Specific token abilities needed → Manually create token, pass in header
└── Passport token → Passport::actingAs($user) or Passport::actingAsClient()
```

## Tree 3: Token Revocation Verification

```
What happens when a revoked token is used?
├── Token deleted from database → 401 — "unauthenticated"
├── Token marked as revoked (not deleted) → 401 — "token revoked"
├── Token expired → 401 — "token expired"
└── No revocation mechanism → Implement one — cannot test what doesn't exist
```
