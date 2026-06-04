# Anti-Patterns: Plan-Aware Throttling for SaaS APIs

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Plan-Aware Throttling |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-PT-01 | Client-Provided Plan Header | Critical | Medium | Low |
| AP-PT-02 | No Default Plan for Unauthenticated | High | Medium | Low |
| AP-PT-03 | Plan Limits Hardcoded | Medium | High | Medium |
| AP-PT-04 | No Rate Limit Headers | Medium | High | Low |
| AP-PT-05 | Plan Usage Not Monitored | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **No Cache for Plan Limits**: Per-request database lookup for plan configuration
- **Generic 429 Without Upgrade Info**: Users don't know how to increase limits
- **Same Burst Capacity for All Plans**: Free and enterprise have identical burst allowances

---

## 1. Client-Provided Plan Header

### Category
Security · Critical

### Description
Trusting a client-provided header (like `X-Plan: enterprise`) to determine the user's rate limit tier instead of resolving the plan server-side.

### Why It Happens
Client headers are easy to read and don't require server-side resolution. Developers may think "we set this header on our frontend, so it's safe." This completely bypasses plan enforcement.

### Warning Signs
- `$request->header('X-Plan')` used for rate limit resolution
- Plan information accepted from client-side headers or parameters
- Users can modify the plan sent with requests
- No server-side plan lookup
- Different plans can be selected by changing a header

### Why Harmful
Any user on the free plan can set `X-Plan: enterprise` and get enterprise-level rate limits. There is no plan enforcement — all users can give themselves unlimited access.

### Real-World Consequences
- Free-tier users spoof enterprise header — get 10000 requests/min
- API abuse: all users bypass rate limits by sending a higher-tier plan
- No plan enforcement — monetization model broken

### Preferred Alternative
Resolve the plan server-side from authenticated user data.

### Refactoring Strategy
1. Remove plan header reading
2. Resolve plan from `$request->user()->subscription->plan` or API key metadata
3. Default to free/strictest plan for unauthenticated users

### Detection Checklist
- [ ] Is plan information taken from client-provided headers?
- [ ] Is plan resolved server-side from user data?
- [ ] Can a user spoof a higher-tier plan?
- [ ] Is there server-side plan enforcement?
- [ ] Has plan spoofing been tested?

### Related Rules/Skills/Trees
- Apply the Strictest Limit When No Plan Is Assigned (05-rules.md)
- Implement Plan-Aware Throttling for Tiered API Access (06-skills.md)
- Plan Resolution Source decision tree (07-decision-trees.md)

---

## 2. No Default Plan for Unauthenticated

### Category
Security · High

### Description
Applying no rate limit (or a very high limit) when the user is not authenticated or has no plan assignment, allowing unlimited API access.

### Why It Happens
Developers focus on authenticated users with known plans. Unauthenticated users or users without plan assignments may not be considered — the system may apply no limit, `null`, or throw an error.

### Warning Signs
- `config("plans.{$user->plan}")` returns `null` for users without a plan
- No fallback to a default plan
- Rate limit check skips users without plans
- Unauthenticated endpoints have no rate limit
- Guest users get unlimited API access

### Why Harmful
Users who are not assigned a plan (new signups, plan cancellations, unauthenticated) can access the API without any rate limits, bypassing the entire throttling system.

### Real-World Consequences
- Bot scrapes public API without authentication — unlimited requests
- User cancels plan — gets unlimited API access (null -> no limit)
- New signup before plan selection — unlimited access

### Preferred Alternative
Default unauthenticated and unassigned users to the strictest (free) plan.

### Refactoring Strategy
1. Add fallback: `$plan = $user->plan ?? 'free'`
2. Unauthenticated requests: default to `'free'` plan limits
3. Cache the default plan lookup

### Detection Checklist
- [ ] Do unauthenticated users have rate limits?
- [ ] Is there a default plan fallback?
- [ ] Can users without plan assignment bypass limits?
- [ ] What happens when `$user->plan` is `null`?

### Related Rules/Skills/Trees
- Apply the Strictest Limit When No Plan Is Assigned (05-rules.md)
- Implement Plan-Aware Throttling for Tiered API Access (06-skills.md)

---

## 3. Plan Limits Hardcoded

### Category
Architecture · Medium

### Description
Hardcoding plan rate limits in controller or middleware code instead of defining them in configuration.

### Why It Happens
The first implementation often hardcodes limits inline: `if ($plan === 'free') { $limit = 100; }`. This works initially but requires code changes to adjust pricing.

### Warning Signs
- `if ($user->plan === 'free') { $limit = 100; }` in controllers
- Plan limits defined in middleware logic
- No config file for plan definitions
- Changing limits requires a deployment
- Plan limits scattered across multiple files

### Why Harmful
Adjusting pricing (rate limit changes) requires code changes, testing, and deployment. Plan limits are not visible in a single source of truth. Documentation is difficult because limits exist only in code.

### Real-World Consequences
- Marketing wants to increase free tier from 100 to 200 — requires full deployment
- After deployment, limit change has a bug — 429 errors for everyone
- New developer cannot find where plan limits are defined

### Preferred Alternative
Define plan limits in a config file.

### Refactoring Strategy
1. Create `config/plans.php` with plan-to-limit mappings
2. Replace hardcoded checks with `config("plans.{$plan}.rate_per_minute")`
3. Cache the config

### Detection Checklist
- [ ] Are plan limits defined in configuration?
- [ ] Can limits be changed without deployment?
- [ ] Is there a single source of truth for plan limits?
- [ ] Are hardcoded limits scattered across the codebase?

### Related Rules/Skills/Trees
- Define Rate Limits in a Config File, Not Hardcoded (05-rules.md)
- Implement Plan-Aware Throttling for Tiered API Access (06-skills.md)

---

## 4. No Rate Limit Headers

### Category
Architecture · Medium

### Description
Not returning `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers in API responses.

### Why It Happens
Rate limit headers are not automatically added by all middleware configurations. Developers may not know about them or may consider them optional.

### Warning Signs
- API responses lack `X-RateLimit-*` headers
- Clients have no visibility into their rate limit status
- Users are surprised by 429 errors
- No rate limit information exposed in API docs

### Why Harmful
Clients cannot proactively manage their rate limit usage. They don't know how close they are to the limit, when it will reset, or how many requests remain. 429 errors come as a surprise.

### Real-World Consequences
- Client hits 429 unexpectedly — no warning
- API consumer cannot implement backoff without Retry-After
- Developer users complain: "How many requests do I have left?"

### Preferred Alternative
Include rate limit headers in all API responses.

### Refactoring Strategy
1. Add custom rate limit headers to the 429 response
2. Use the `onLimitReached` callback to add headers to all responses
3. Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

### Detection Checklist
- [ ] Do API responses include rate limit headers?
- [ ] Are `X-RateLimit-Limit` and `X-RateLimit-Remaining` present?
- [ ] Can clients see their remaining quota?
- [ ] Are rate limit headers documented?

### Related Rules/Skills/Trees
- Return Plan Quota Headers in API Responses (05-rules.md)
- Implement Plan-Aware Throttling for Tiered API Access (06-skills.md)

---

## 5. Plan Usage Not Monitored

### Category
Operations · Medium

### Description
Not tracking or monitoring rate limit usage per plan, leaving the team blind to traffic patterns, abuse, and capacity planning needs.

### Why It Happens
Rate limiting is implemented as a security feature, and the team stops there. Monitoring usage patterns per plan is an afterthought.

### Warning Signs
- No dashboards for rate limit usage
- Cannot answer "how many free users hit their limit today?"
- No alerts on plan usage spikes
- Capacity planning has no data on API traffic per plan
- Free-tier abuse goes undetected

### Why Harmful
Without monitoring, the team cannot identify abuse patterns, plan effectiveness, or capacity needs. A single free-tier user making 10,000 requests/day (despite 100/min limits) stays undetected. Plan pricing adjustments are based on guesses, not data.

### Real-World Consequences
- Free-tier abuser uses multiple API keys — undetected for months
- Enterprise plan limits too restrictive for actual usage — customer churn
- Capacity exhausted — no data to justify infrastructure investment

### Preferred Alternative
Track and monitor rate limit usage per plan.

### Refactoring Strategy
1. Log rate limit hits with plan information
2. Create dashboards for per-plan usage
3. Set up alerts for unusual usage patterns
4. Review plan limits regularly based on data

### Detection Checklist
- [ ] Is rate limit usage tracked per plan?
- [ ] Are there dashboards or reports?
- [ ] Can abuse patterns be detected?
- [ ] Is capacity planning informed by usage data?
- [ ] Are plan limits reviewed against actual usage?

### Related Rules/Skills/Trees
- Notify Users When Approaching Plan Limits (05-rules.md)
- Implement Plan-Aware Throttling for Tiered API Access (06-skills.md)
