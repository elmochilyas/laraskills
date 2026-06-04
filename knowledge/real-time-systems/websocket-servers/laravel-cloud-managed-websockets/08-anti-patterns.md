# Anti-Patterns: Laravel Cloud Managed WebSockets

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit | Laravel Cloud Managed WebSockets |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-LCM-01 | Assuming Managed WebSockets Means No Broadcasting Knowledge Needed | High | High | Medium |
| AP-LCM-02 | Not Planning for Migration Off Laravel Cloud | High | Medium | High |
| AP-LCM-03 | Ignoring Pricing Model Differences from Self-Hosted | High | High | Low |
| AP-LCM-04 | Not Monitoring Connection Limits | High | Medium | Low |
| AP-LCM-05 | Overlooking Geographic Latency | Medium | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **Not testing geographic latency for global user bases**: Single-region default may cause high latency
- **Assuming unlimited connections on base plan**: Connection caps require monitoring and proactive upgrades
- **Forgetting auth logic is still the application's responsibility**: Managed WebSocket infrastructure ≠ managed auth

---

## 1. Assuming Managed WebSockets Means No Broadcasting Knowledge Needed

### Category
Knowledge · Operations

### Description
Believing that Laravel Cloud's managed WebSocket infrastructure eliminates the need to understand Laravel's broadcasting fundamentals (channels, authorization, Echo, events), leading to broken or insecure real-time features.

### Why It Happens
Laravel Cloud markets "managed WebSockets" as zero-infrastructure real-time. Developers interpret this as zero-knowledge too. They skip learning about channel authorization, Echo configuration, event broadcasting, and the Pusher protocol. When features don't work, they don't know where to start debugging.

### Warning Signs
- No channel authorization logic configured (`routes/channels.php` is empty)
- Echo is not installed or misconfigured on the frontend
- Events don't implement `ShouldBroadcast` interface
- Broadcasting configuration defaults are unchanged from installation
- Developers ask "why aren't my events showing up?" without basic broadcasting knowledge

### Why Harmful
Laravel Cloud manages the WebSocket infrastructure (Reverb clusters, scaling, TLS). But the application layer — channel authorization, event classes, Echo client configuration, authentication — remains the developer's responsibility. Without understanding these fundamentals, real-time features either don't work or are insecure.

### Real-World Consequences
- Private channels deliver events to unauthorized users — security breach
- Presence channels don't show online users — missing auth
- Events broadcast but aren't received — Echo misconfigured
- Development blocked by basic broadcasting issues
- Team must learn broadcasting fundamentals from scratch while in production

### Preferred Alternative
Understand Laravel broadcasting fundamentals before relying on managed infrastructure. Channels, auth, Echo, and events are the same regardless of infrastructure.

### Refactoring Strategy
1. Read the Laravel broadcasting documentation as a team
2. Configure `routes/channels.php` with proper authorization callbacks
3. Ensure events implement `ShouldBroadcast` and `ShouldBroadcastNow` where appropriate
4. Install and configure Echo on the frontend with correct connection parameters
5. Test with a simple public channel first, then add auth for private/presence channels
6. Verify channel authorization via `/broadcasting/auth` endpoint

### Detection Checklist
- [ ] Is `routes/channels.php` configured with auth callbacks?
- [ ] Do events implement `ShouldBroadcast` interface?
- [ ] Is Echo installed and configured on the frontend?
- [ ] Is channel authorization working for private channels?
- [ ] Can the team explain how broadcasting works end-to-end?

### Related Rules/Skills/Trees
- Understand Broadcasting Fundamentals Before Using Managed Infrastructure (05-rules.md)
- Configure Laravel Cloud Managed WebSockets (06-skills.md)
- Laravel Broadcasting Architecture Overview (06-skills.md)

---

## 2. Not Planning for Migration Off Laravel Cloud

### Category
Architecture · Strategy

### Description
Committing to Laravel Cloud's managed WebSockets without a documented migration plan, creating platform lock-in where migrating to self-hosted Reverb or another provider requires significant rework.

### Why It Happens
Laravel Cloud is the official Laravel platform — teams trust it and assume they'll never need to migrate. Migration planning seems like unnecessary overhead when the platform is working well. The abstraction layer (standard broadcasting code) provides some portability, but operational knowledge and configuration are platform-specific.

### Warning Signs
- No migration documentation exists
- Application uses Laravel Cloud-specific broadcasting features
- Deployment scripts and infrastructure rely on Laravel Cloud APIs
- Team has no experience with self-hosted Reverb configuration
- Question "how would we migrate?" cannot be answered

### Why Harmful
When pricing changes, features are deprecated, or the application outgrows the platform, the team cannot migrate quickly. The migration requires learning self-hosted Reverb, configuring Supervisor, setting up Nginx reverse proxy, and testing WebSocket infrastructure — all under time pressure.

### Real-World Consequences
- Laravel Cloud price increase: cannot migrate, must accept the cost
- Laravel Cloud deprecates a feature: application loses functionality
- Application needs custom Reverb config not exposed by Laravel Cloud: blocked
- Emergency migration required after platform decision changes
- Migration takes 2 weeks of dedicated work — delayed feature development

### Preferred Alternative
Document a migration plan from Laravel Cloud to self-hosted Reverb. Use standard broadcasting code that works on any backend. Periodically test the migration plan.

### Refactoring Strategy
1. Document the steps to migrate from Laravel Cloud to self-hosted Reverb
2. Use standard broadcasting code (events, channels, Echo) — avoid platform-specific features
3. Document Reverb configuration: Supervisor, Nginx, environment variables
4. Set up a self-hosted Reverb instance in staging to test compatibility
5. Run a trial migration from Laravel Cloud to self-hosted in a non-production environment
6. Review and update the migration plan quarterly

### Detection Checklist
- [ ] Is there a documented migration plan to self-hosted Reverb?
- [ ] Are any broadcasting features Laravel Cloud-specific?
- [ ] Has a trial migration been performed?
- [ ] Does the team know how to configure self-hosted Reverb?
- [ ] Could the application migrate within a week if needed?

### Related Rules/Skills/Trees
- Document Migration Plan from Managed to Self-Hosted (05-rules.md)
- Configure Laravel Cloud Managed WebSockets (06-skills.md)
- Reverb Installation and Configuration (06-skills.md)

---

## 3. Ignoring Pricing Model Differences from Self-Hosted

### Category
Cost · Planning

### Description
Choosing Laravel Cloud's managed WebSockets without modeling usage-based costs against self-hosted alternatives, leading to unexpected charges at scale.

### Why It Happens
Laravel Cloud's pricing is connection- and bandwidth-based. Self-hosted Reverb has fixed server costs. For small applications, Laravel Cloud is cheaper. As connections grow, the usage-based model eventually exceeds fixed-cost self-hosting. Without modeling both scenarios, the team is surprised by the inflection point.

### Warning Signs
- No cost projection model exists for WebSocket infrastructure
- Team cannot articulate the break-even point vs self-hosted Reverb
- Monthly WebSocket costs are growing faster than expected
- Budget discussions include "WebSocket costs are too high"
- No cost monitoring on connection counts or bandwidth usage

### Why Harmful
Usage-based costs scale with success — more users means higher costs. At high connection counts, the monthly bill can exceed server costs by 5-10x. Without cost modeling, the team experiences "bill shock" and must either accept the high cost or undertake an emergency migration.

### Real-World Consequences
- At 50K concurrent connections, Laravel Cloud costs exceed self-hosted by 3x
- Monthly bill grew 300% over 6 months with user growth
- Emergency migration to self-hosted Reverb planned under budget pressure
- Cost monitoring retroactively added after budget overrun
- Executive questioning: "Why are infrastructure costs growing faster than revenue?"

### Preferred Alternative
Model costs for both Laravel Cloud and self-hosted Reverb at projected connection counts. Switch to self-hosted when the break-even point is reached.

### Refactoring Strategy
1. Estimate concurrent connection counts at current and projected scale
2. Model Laravel Cloud costs: connections × cost-per-connection + bandwidth
3. Model self-hosted Reverb costs: server instance(s) × monthly cost
4. Identify the break-even point where self-hosted becomes cheaper
5. Set up monitoring on connection counts and bandwidth
6. Plan migration to self-hosted when approaching the break-even point

### Detection Checklist
- [ ] Is there a cost projection model for WebSocket infrastructure?
- [ ] Are connection counts and bandwidth monitored?
- [ ] Is the break-even point vs self-hosted identified?
- [ ] Is there a budget for WebSocket costs?
- [ ] Has cost growth been projected with user growth?

### Related Rules/Skills/Trees
- Model Costs for Managed vs Self-Hosted WebSockets (05-rules.md)
- Configure Laravel Cloud Managed WebSockets (06-skills.md)
- WebSocket Infrastructure Cost Analysis (06-skills.md)

---

## 4. Not Monitoring Connection Limits

### Category
Operations · Reliability

### Description
Failing to monitor WebSocket connection counts against Laravel Cloud plan limits, causing users to be unable to connect when the limit is reached.

### Why It Happens
Laravel Cloud plans have connection caps per tier. Developers assume the default limit is sufficient or don't know about the cap. The first sign of a problem is users reporting they cannot connect — no proactive monitoring alerts on approaching the limit.

### Warning Signs
- Connection count is not displayed in any dashboard
- No alert threshold configured for 80% of plan limit
- Users report being unable to connect intermittently
- Laravel Cloud dashboard shows connection count at or near plan limit
- No plan upgrade history or capacity planning documents

### Why Harmful
When the connection limit is reached, new WebSocket connections are rejected. Users cannot receive real-time updates — notifications, live data, chat messages — until existing connections drop. For customer-facing applications, this means users lose access to core functionality.

### Real-World Consequences
- Peak usage hits connection cap — 500 users cannot connect
- Real-time features silently fail as users are throttled
- Customer support flooded with "app is not working" reports
- Emergency plan upgrade during peak hours
- User trust eroded by unreliable real-time features

### Preferred Alternative
Monitor connection usage against plan limits. Set proactive alerts at 80% capacity. Upgrade the plan before the limit is reached.

### Refactoring Strategy
1. Configure monitoring on Laravel Cloud's connection count metric
2. Set an alert at 80% of the plan's connection limit
3. Create a capacity planning document with projected connection growth
4. Schedule monthly reviews of connection usage vs plan limits
5. Upgrade the plan proactively when usage approaches 80%
6. Document the upgrade procedure and expected lead time

### Detection Checklist
- [ ] Is connection usage monitored against plan limits?
- [ ] Are there alerts at 80% capacity?
- [ ] Has the team been surprised by connection limit issues?
- [ ] Is there a capacity planning document?
- [ ] Is the plan upgrade procedure documented?

### Related Rules/Skills/Trees
- Monitor WebSocket Connection Limits (05-rules.md)
- Configure Laravel Cloud Managed WebSockets (06-skills.md)
- Capacity Planning for WebSocket Infrastructure (06-skills.md)

---

## 5. Overlooking Geographic Latency

### Category
Performance · User Experience

### Description
Assuming Laravel Cloud's default region provides acceptable latency for a globally distributed user base, delivering poor real-time performance to users far from the deployment region.

### Why It Happens
Laravel Cloud may default to a single region. Developers test from their local region where latency is low. The impact on global users is invisible until user complaints or analytics reveal high connection latency.

### Warning Signs
- Application has users in multiple continents
- No multi-region deployment configured in Laravel Cloud
- Users report slow real-time updates from specific geographic regions
- WebSocket connection times vary significantly by region
- P99 latency for WebSocket events is >500ms

### Why Harmful
Real-time features are sensitive to latency — a 300ms vs 50ms delay is noticeable. Users far from the deployment region experience delayed notifications, slow chat message delivery, and laggy collaborative features. For a global application, this creates a tiered user experience based on geography.

### Real-World Consequences
- Users in Asia experience 400ms delay vs 50ms for US users
- Real-time collaboration feels sluggish for non-US team members
- Competitive disadvantage in growth markets with poor latency
- User complaints: "Why are notifications delayed on my phone?"
- Application analytics show high regional bounce rates

### Preferred Alternative
Deploy to multiple regions or verify that Laravel Cloud's edge distribution meets global latency requirements. Test latency from target geographic regions before launch.

### Refactoring Strategy
1. Identify the geographic distribution of users from analytics
2. Test WebSocket connection latency from key regions
3. If latency exceeds acceptable thresholds, enable multi-region deployment
4. For Laravel Cloud, verify if multi-region or edge delivery is supported
5. If not, consider Ably (global edge network) for multi-region needs
6. Document the latency requirements and testing results

### Detection Checklist
- [ ] Where are the application's users geographically located?
- [ ] Has WebSocket latency been tested from target regions?
- [ ] Is single-region deployment causing latency for distant users?
- [ ] Does the latency meet application requirements (<100ms for real-time)?
- [ ] Is there a plan for multi-region if needed?

### Related Rules/Skills/Trees
- Test Geographic Latency for Global User Bases (05-rules.md)
- Configure Laravel Cloud Managed WebSockets (06-skills.md)
- Multi-Region WebSocket Architecture (06-skills.md)
