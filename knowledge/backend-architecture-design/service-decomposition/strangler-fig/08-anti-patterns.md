# Anti-Patterns: Strangler Fig Pattern

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Service Decomposition |
| **Topic** | Strangler fig pattern for incremental decomposition |
| **Difficulty** | Advanced |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | service-decomposition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Strangling Too Many Features at Once | Process | High |
| 2 | No Rollback Mechanism | Reliability | High |
| 3 | Extracting Tightly Coupled Features | Architecture | High |
| 4 | Wrong Extraction Order | Strategy | Medium |

## Repository-Wide Anti-Patterns

- **Big Bang Strangling**: Attempting to replace too many features simultaneously, creating parallel work and coordination overhead
- **No Safety Net**: Migrating features without feature flags for rollback
- **Tightly Coupled Extraction**: Extracting features that are deeply coupled to legacy code, requiring massive rewrites

---

## 1. Strangling Too Many Features at Once

**Category:** Process

**Description:** Attempting to replace multiple features of the legacy system simultaneously, overwhelming the team with parallel work and coordination overhead.

**Why It Happens:** Teams want to accelerate migration. They start multiple extraction streams in parallel, assuming parallelism will speed things up.

**Warning Signs:**
- Multiple extraction streams running simultaneously
- Team context-switching between several extractions
- Coordination overhead dominates actual work

**Why Harmful:** Each extraction requires learning, design, implementation, testing, and deployment. Parallel extractions multiply the cognitive load and create cross-feature dependencies.

**Consequences:**
- Slower overall progress (context switching penalty)
- Higher defect rate from divided attention
- Team burnout from parallel high-stakes work

**Alternative:** Extract one feature at a time. Complete each extraction fully (including decommissioning legacy code) before starting the next.

**Refactoring Strategy:**
1. Prioritize features for extraction
2. Complete one feature fully before starting the next
3. Measure: time from start to legacy decommission per feature

**Detection Checklist:**
- [ ] How many features are being extracted in parallel?
- [ ] Is each extraction fully completed before the next starts?
- [ ] Is the team context-switching between extractions?

**Related Rules/Skills/Trees:**
- Rule: Extract One Feature at a Time (`04-standardized-knowledge.md:14-15`)

---

## 2. No Rollback Mechanism

**Category:** Reliability

**Description:** Routing traffic to the new service without a feature flag or rollback mechanism, making failures user-facing and hard to revert.

**Why It Happens:** Feature flags add implementation complexity. Teams route new service URLs directly without an intermediary switch.

**Warning Signs:**
- DNS or load balancer changes are the "switch" to the new service
- No application-level feature flag for the new path
- Reverting means redeploying the old configuration

**Why Harmful:** If the new service fails (bug, performance, data issue), the entire feature is broken. Rollback requires infrastructure changes, not just a config toggle.

**Consequences:**
- Extended downtime during rollback
- Reluctance to roll back due to complexity
- Pressure to fix forward instead of reverting

**Alternative:** Implement feature flags for every extracted feature. Route traffic through toggle: legacy or new service.

**Refactoring Strategy:**
1. Add feature flag at the routing layer
2. Default to the legacy path
3. Enable the new path for testing
4. Roll back by toggling the flag, not redeploying

**Detection Checklist:**
- [ ] Is there a feature flag for routing to the new service?
- [ ] Can the new service be disabled without redeployment?
- [ ] Is rollback tested?

**Related Rules/Skills/Trees:**
- Rule: Always Use Feature Flags for Extraction (`04-standardized-knowledge.md:14-15`)

---

## 3. Extracting Tightly Coupled Features

**Category:** Architecture

**Description:** Extracting a feature that is deeply coupled to the legacy system, requiring rewriting more than just the feature itself.

**Why It Happens:** Teams pick features based on business priority, not extraction readiness. A seemingly simple feature may depend on shared infrastructure.

**Warning Signs:**
- Extracted feature still depends on legacy database tables
- Feature calls legacy services for core functionality
- Extraction scope grows beyond the original feature

**Why Harmful:** Tight coupling means the extraction becomes a larger rewrite project than anticipated. The team spends more on breaking dependencies than on the feature itself.

**Consequences:**
- Extraction takes much longer than planned
- Feature extraction grows into a mini-rewrite
- Risk of introducing bugs in coupled legacy functionality

**Alternative:** Start with loosely coupled features (independent data, few dependencies). Leave tightly coupled features until interfaces are established.

**Refactoring Strategy:**
1. Map feature dependencies before extraction
2. Start with features that have fewest dependencies
3. Create API interfaces for legacy dependencies
4. Extract coupled features only after interfaces exist

**Detection Checklist:**
- [ ] Does the feature depend on legacy database tables?
- [ ] Does it call legacy services for core logic?
- [ ] Is the extraction scope growing?

**Related Rules/Skills/Trees:**
- Rule: Extract Loosely Coupled Features First (`04-standardized-knowledge.md:14-15`)

---

## 4. Wrong Extraction Order

**Category:** Strategy

**Description:** Extracting low-value or infrequently changing features first, delaying return on investment and team motivation.

**Why It Happens:** Simple features are easier to extract first. Teams optimize for ease rather than value.

**Warning Signs:**
- High-value, frequently changed features are extracted last
- Team has low motivation from extractions with no visible impact
- Business stakeholders see no improvement for months

**Why Harmful:** Extraction is expensive. Extracting low-value features first means months of investment with no visible benefit to stakeholders, risking project cancellation.

**Consequences:**
- Stakeholder impatience with "no visible progress"
- Extraction project cancelled before reaching valuable features
- Team demotivation from thankless work

**Alternative:** Prioritize extraction by value — features that change frequently, block the team, or provide direct business benefit.

**Refactoring Strategy:**
1. Rank features by: change frequency, business value, team pain
2. Extract top-value features first
3. Communicate early wins to stakeholders

**Detection Checklist:**
- [ ] Are low-value features being extracted first?
- [ ] Is there clear ROI for each extraction?
- [ ] Have stakeholders seen value from completed extractions?

**Related Rules/Skills/Trees:**
- Rule: Extract High-Value Features First (`04-standardized-knowledge.md:14-15`)
