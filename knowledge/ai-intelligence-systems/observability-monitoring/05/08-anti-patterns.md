# Anti-Patterns: Budget Management

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-05 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Observability & Monitoring |
| **Type** | Governance |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Budget as Surprise](#1-budget-as-surprise)
2. [Hard Budgets Everywhere](#2-hard-budgets-everywhere)
3. [No Emergency Override](#3-no-emergency-override)
4. [Stale Budgets](#4-stale-budgets)
5. [One Budget to Rule Them All](#5-one-budget-to-rule-them-all)

---

## 1. Budget as Surprise

### Category
User Experience Failure

### Description
Failing to proactively communicate budget status to users, so they only discover they've exceeded their budget when requests start being blocked. No warnings at 50%, 80%, or 90% usage. No self-service dashboard showing current spend vs. budget. The first indication of a problem is a 429 error.

### Why It Happens
- Focus on enforcement over communication: the hard block is considered sufficient
- No budget visibility infrastructure (everyone sees their own spend)
- Product oversight: budget features are treated as backend concerns
- Fear that showing budget data encourages users to "game" the system

### Warning Signs
- Users first learn about budget limits when they are blocked
- Customer support receives "why am I blocked?" tickets that are budget-related
- No budget status is visible in the application UI
- No proactive notifications at usage thresholds
- Budget block responses have no information about current usage

### Why Harmful
- Frustrating user experience: blocks feel arbitrary
- Users cannot proactively manage consumption
- Support team is burdened with budget-related inquiries
- Enterprise users cannot audit their usage against contracts
- Blocks during critical workflows cause work disruption

### Real-World Consequences
- API customer's batch processing job fails at 95% completion due to budget block
- User submits support ticket asking why they're blocked, discovers budget limit existed
- Enterprise customer cannot reconcile invoice against their usage
- Customer churn due to unexpected service interruption

### Preferred Alternative
Provide proactive budget visibility. Display budget status in the application UI or API responses. Send notifications at 50%, 80%, 90%, and 100% of budget usage. Include current spend and reset date in block responses.

### Refactoring Strategy
1. Add budget status to API response headers: `X-Budget-Limit`, `X-Budget-Spent`, `X-Budget-Reset`
2. Build a self-service budget dashboard showing current vs. limit
3. Implement email/in-app notifications at usage thresholds
4. Include budget context in 429 responses: what limit was hit, current spend, reset time
5. Add budget forecasting: "at current rate, you'll exhaust your budget in 3 days"

### Detection Checklist
- [ ] Users can see their budget status before being blocked
- [ ] Notifications fire at 50%, 80%, 90% usage
- [ ] Block responses include budget context
- [ ] Self-service budget dashboard exists

### Related Rules/Skills/Trees
- Skill: Implement Budget Management
- Rule: Alert early and often

---

## 2. Hard Budgets Everywhere

### Category
Overshooting Enforcement

### Description
Applying hard (blocking) budgets to every dimension and budget type, including internal tools, debugging endpoints, and non-critical features where soft budgets (alerts without blocking) would be more appropriate. Hard budgets everywhere create a brittle system where routine operations can be blocked.

### Why It Happens
- One-size-fits-all budget policy applied globally
- Risk aversion: hard budgets are "safer" than soft budgets
- No classification of budget types by criticality
- Simple implementation: all budgets use the same enforcement code
- No stakeholder input on budget enforcement requirements

### Warning Signs
- All budgets are hard budgets (no soft budgets exist)
- Internal tooling and admin endpoints have hard budgets
- Debugging and testing endpoints can block production access
- Budget policies don't distinguish between critical and non-critical paths
- Legitimate operations get blocked by non-critical budget limits

### Why Harmful
- Routine operations are blocked by budgets that should only alert
- Hard budgets on non-critical paths create unnecessary friction
- System resilience decreases: more failure points from budget blocks
- Users and admins cannot perform essential tasks due to budget limits
- Emergency debugging blocked by budget enforcement

### Real-World Consequences
- Admin dashboard cannot load because it exceeds a hard budget
- Internal analytics queries blocked, preventing cost analysis
- Debug endpoint blocked during incident response
- Developer's test requests blocked by same budgets as production

### Preferred Alternative
Classify budgets by criticality. Use hard budgets for external-facing, cost-critical paths (API endpoints, user-facing AI features). Use soft budgets for internal tools, admin features, and debugging endpoints. Soft budgets alert but don't block.

### Refactoring Strategy
1. Classify all budget dimensions by criticality and cost risk
2. Map criticality to enforcement type: high → hard, medium → soft, low → soft
3. Implement budget type configuration (is_hard: true/false)
4. Add emergency bypass for hard budgets on critical internal paths
5. Review and adjust classification quarterly

### Detection Checklist
- [ ] Budget types are classified (hard vs. soft)
- [ ] Internal tools use soft budgets
- [ ] Admin endpoints have soft budgets or higher limits
- [ ] Budget enforcement type is configurable per dimension

### Related Rules/Skills/Trees
- Skill: Implement Budget Management

---

## 3. No Emergency Override

### Category
Operational Rigidity

### Description
Having no mechanism to override budget limits when a legitimate business need exceeds the configured budget. When a customer needs increased capacity, an internal project requires additional spend, or a time-sensitive initiative demands more budget, the only option is a code change and deployment.

### Why It Happens
- Budget is treated as a hard technical constraint, not a business policy
- No approval workflow designed for budget overrides
- Compliance concerns: overrides could bypass cost controls
- Engineering focus: building enforcement, not exception handling
- "Budget is budget" mentality

### Warning Signs
- No API or UI for requesting budget increases
- Budget increases require code changes and deployments
- No manual override capability for support staff
- Enterprise customers must wait for next sprint to get budget increases
- Budget override requests are handled ad-hoc via database queries

### Why Harmful
- Revenue opportunities lost because budget cannot be temporarily increased
- Customer churn due to inflexible budget policies
- Support and sales teams cannot close deals because budget increases take weeks
- Emergency situations (traffic spikes, security incidents) cannot get additional budget
- Ops team resorts to manual database edits to override budgets

### Real-World Consequences
- Customer's campaign launch blocked because budget increase requires next sprint
- Sales team loses deal because enterprise budget cannot be adjusted for POC
- Security incident response delayed because additional budget requires approval
- Operations team manually edits Redis counters to unblock users

### Preferred Alternative
Implement a budget override system with approval workflows. Allow authorized users (support, sales, admin) to temporarily or permanently increase budgets. Log all overrides for audit. Implement time-limited overrides for emergency situations.

### Refactoring Strategy
1. Create a budget override API: `POST /api/budgets/{id}/override`
2. Implement approval workflow for high-value overrides
3. Support time-limited overrides: "increase budget by 50% for 7 days"
4. Add override audit log: who approved, why, how much, until when
5. Create self-service budget increase for low-risk adjustments

### Detection Checklist
- [ ] Budget override mechanism exists (API or UI)
- [ ] Approval workflow is defined for overrides
- [ ] Overrides are time-limited (for temporary needs)
- [ ] Override audit trail exists

### Related Rules/Skills/Trees
- Skill: Implement Budget Management

---

## 4. Stale Budgets

### Category
Configuration Rot

### Description
Setting budgets once during initial configuration and never reviewing or adjusting them. As usage patterns grow, features evolve, and costs change, budgets that were appropriate at creation become either too restrictive (blocking legitimate growth) or too generous (failing to control costs).

### Why It Happens
- "Set it and forget it" mentality
- No budget review cadence or ownership
- Budgets are hardcoded or buried in configuration files
- No automated alerts for budget utilization trends
- Team priorities shift away from cost management

### Warning Signs
- Budgets haven't been reviewed in 6+ months
- Budget utilization is consistently below 20% or hitting 100% every month
- Feature usage has grown or changed significantly since budgets were set
- No one on the team owns budget review
- No automated analysis of budget appropriateness

### Why Harmful
- Budgets that are too low block legitimate business growth
- Budgets that are too high fail to control costs
- Inconsistent budget accuracy across features and teams
- No alignment between budget and actual usage patterns
- Budgets lose credibility as meaningful constraints

### Real-World Consequences
- Feature with 5x user growth hits budget limits set during beta
- Team consistently spends 15% of budget because original estimates were inflated
- Quarterly budget review reveals 60% of budgets are misaligned with actual usage
- New feature launch blocked by budget that was set for a different purpose

### Preferred Alternative
Establish a quarterly budget review cadence. Monitor budget utilization trends and flag budgets that are consistently under or over utilized. Automate budget adjustment recommendations based on trailing 3-month average usage.

### Refactoring Strategy
1. Assign budget ownership to feature or team leads
2. Implement quarterly budget review process in the team calendar
3. Add automated budget alerts: "budget utilization below 30% for 3 months" or "at 100% for 2 consecutive months"
4. Build budget adjustment recommendations from usage trends
5. Document budget review outcomes and rationale

### Detection Checklist
- [ ] Budget review cadence exists (quarterly)
- [ ] Budget utilization trends are monitored
- [ ] Stale budget alerts are configured
- [ ] Budget ownership is assigned to individuals

### Related Rules/Skills/Trees
- Skill: Implement Budget Management

---

## 5. One Budget to Rule Them All

### Category
Granularity Failure

### Description
Using a single global budget for all AI spend across all features, teams, environments, and users. A single user's runaway agent or one feature's growth can exhaust the entire budget, blocking all AI features for all users. No differentiation between critical and non-critical features, or between different team allocations.

### Why It Happens
- Initial simplicity: one budget is easy to implement
- Centralized cost management: single account, single budget
- No multi-feature or multi-team cost allocation initially
- Technical debt: budget system wasn't designed for dimensions
- "Total cost is all that matters" mindset

### Warning Signs
- One Redis counter tracks all AI spend
- All users and features contribute to the same budget
- One user's heavy usage blocks all other users
- No per-feature or per-team budget visibility
- Cannot answer "what does feature X cost" because budget is global

### Why Harmful
- One user's abuse or heavy usage blocks all other users
- Critical features are blocked by non-critical feature usage
- No cost accountability per team or per feature
- Cannot implement different budget tiers for different user plans
- Single point of failure: budget exhaustion is system-wide

### Real-World Consequences
- Chat feature blocked because batch processing consumed the shared budget
- One customer's heavy API usage blocks all other customers (multi-tenant)
- Marketing team's campaign exhausts budget allocated for customer support AI
- Cannot offer different limits for free vs. paid users

### Preferred Alternative
Implement multi-dimensional budgets: per feature, per team, per environment, per user tier. Use hierarchical budgets: global total with per-dimension sub-budgets. A feature-budget exhaustion blocks only that feature, not all AI usage.

### Refactoring Strategy
1. Define budget dimensions: feature, team, environment, user tier
2. Implement per-dimension budget counters
3. Create budget hierarchy: global → feature → user tier
4. Migrate from single Redis key to dimension-keyed keys
5. Add per-dimension budget dashboards

### Detection Checklist
- [ ] Budgets are defined per feature (not just global)
- [ ] Per-user or per-tier budgets exist
- [ ] One dimension's budget exhaustion doesn't block others
- [ ] Budget dashboards show per-dimension breakdowns

### Related Rules/Skills/Trees
- Skill: Implement Budget Management
- Decision Tree: Implementation Approach
