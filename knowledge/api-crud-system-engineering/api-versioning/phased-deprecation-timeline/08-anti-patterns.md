# Phased Deprecation Timeline: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Phased Deprecation Timeline |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Rushed Timeline** — Business pressure compresses phases, consumers caught off guard
2. **Infinite Enforcement** — Enforce phase never transitions to Remove due to fear
3. **Phase Skip** — Bug transitions from Announce directly to Remove
4. **No Announce Phase** — Skipping public announcement, surprising consumers with warnings
5. **Overly Harsh Enforcement** — Rate limiting to 0, effectively instant removal

## Repository-Wide Anti-Patterns

- Not tracking consumer migration percentage per phase
- No scheduled command for automated phase transitions
- No "phase rollback" plan for problematic transitions
- Making Warn phase too short (< 30 days)

---

## 1. Rushed Timeline

### Category
Consumer Harm

### Description
Business pressure compresses the deprecation timeline — Announce phase skipped or Warn phase shortened to weeks instead of months. Consumers don't have time to plan and execute migration.

### Why It Happens
Management wants to reduce maintenance burden or "clean up" old versions. The engineering team doesn't push back on unreasonable timelines.

### Warning Signs
- Warn phase duration < 30 days
- Announce phase duration < 30 days
- Consumers express surprise at removal deadlines
- Management asks "why can't we just remove it?"
- Support tickets spike when Warn phase starts
- No phase duration minimum in retirement policy

### Why Harmful
Consumers are forced into emergency migrations. Production incidents increase as rushed migrations introduce errors. Consumer trust erodes. Some consumers may not complete migration in time.

### Real-World Consequences
Management demands V1 removal in 2 months. The Announced phase is skipped, Warn phase is 3 weeks, Enforce phase is 1 week. Ten enterprise consumers are mid-migration when the Enforce phase starts. Their applications break, causing a business escalation.

### Preferred Alternative
Establish minimum phase durations in the retirement policy. Require executive approval for compressed timelines. Track consumer migration progress to inform timing.

### Refactoring Strategy
1. Implement config-driven phase durations with minimum values
2. Add alert when phase durations are below policy minimum
3. Require documented consumer impact assessment for compressed timelines
4. Track consumer migration percentage per phase
5. Extend phases if migration progress is insufficient

### Detection Checklist
- [ ] Warn phase < 30 days
- [ ] Announce phase skipped or too short
- [ ] No minimum phase durations defined
- [ ] Consumer migration incomplete before enforcement

### Related Rules/Skills/Trees
- Rule: API-LIFECYCLE-001 (Minimum Phase Duration)
- Skill: version-retirement-policy
- Tree: api-governance

---

## 2. Infinite Enforcement

### Category
Indecision

### Description
The Enforce phase starts (rate limiting, degradation) but never transitions to Remove. Consumers experience degraded service indefinitely without resolution.

### Why It Happens
The team is afraid to permanently remove the version. "What if a big customer still needs it?" The deadline passes but the version remains.

### Warning Signs
- Enforce phase active for 6+ months
- Consumers complain about degraded performance but version never removed
- Inconsistent enforcement — some consumers not rate-limited
- Sunset date passed but version still available
- No scheduled removal in the retirement calendar

### Why Harmful
Consumers are stuck in limbo — the version is too degraded for reliable use but not removed, so they can't fully migrate. The team absorbs ongoing maintenance cost for a version that should be gone.

### Real-World Consequences
V1 enters Enforce phase with rate limiting. After 8 months, V1 is still active. Consumers have partially migrated but still depend on V1 for legacy integrations. The team maintains V1 infrastructure indefinitely, spending 20% of engineering effort on a deprecated version.

### Preferred Alternative
Set a firm removal date during the Enforce phase. Communicate it clearly. Automate the transition to Remove.

### Refactoring Strategy
1. Set a specific removal date for the end of Enforce phase
2. Communicate the firm deadline to all consumers
3. Automate the Remove transition via scheduled command
4. Provide white-glove migration support for struggling consumers
5. Track removal date adherence

### Detection Checklist
- [ ] Enforce phase > 3 months
- [ ] Sunset date passed
- [ ] No scheduled removal
- [ ] Version still active despite enforcement

### Related Rules/Skills/Trees
- Rule: API-LIFECYCLE-002 (Enforce to Remove Transition)
- Skill: sunset-header-implementation
- Tree: api-governance

---

## 3. Phase Skip

### Category
Process Failure

### Description
A bug in the phase transition logic or configuration causes the deprecation timeline to skip directly from Announce to Remove, bypassing Warn and Enforce.

### Why It Happens
Configuration error — phase dates are misconfigured or the transition logic has a bug. A scheduled command reads the wrong date and jumps phases.

### Warning Signs
- Go directly from Announce to Remove without Warn/Enforce
- Consumers surprised by 410 Gone responses
- Phase dates in config have large gaps
- No Warn or Enforce phase in version history
- Phase transition audit log shows unexpected jump

### Why Harmful
Consumers have no warning period. They receive no deprecation headers, no sunset deadline, no degraded-performance signal. The version simply disappears.

### Real-World Consequences
The phase transition cron job reads a misconfigured `removal_date` and transitions V1 from Announced to Removed in a single run. All V1 endpoints start returning 410. Consumers who were planning to migrate over the next 6 months are immediately locked out.

### Preferred Alternative
Make phase transitions sequential and irreversible. Add validation that prevents skipping phases. Log and alert on every transition.

### Refactoring Strategy
1. Add validation that phases must transition sequentially
2. Implement a phase transition audit log
3. Add alerting for non-sequential transitions
4. Require manual approval for phase transitions (at least for Remove)
5. Add tests for phase transition logic

### Detection Checklist
- [ ] Phase jumped from Announce to Remove
- [ ] No Warn or Enforce in version history
- [ ] Phase chart shows gaps
- [ ] No transition validation

### Related Rules/Skills/Trees
- Rule: API-LIFECYCLE-003 (Sequential Phase Transitions)
- Skill: phased-deprecation-timeline
- Tree: api-governance

---

## 4. No Announce Phase

### Category
Communication Failure

### Description
Skipping the Announce phase entirely — consumers first learn about deprecation when they receive `Deprecation` headers or experience enforced degradation.

### Why It Happens
"We'll just start sending headers, that's the announcement." The team conflates automated header injection with consumer communication.

### Warning Signs
- The first deprecation communication consumers see is the `Deprecation` header
- No blog post, email, or dashboard notice was sent
- Consumers express surprise when Warn phase starts
- No documented consumer migration timeline
- Announce phase is zero days in config

### Why Harmful
Consumers have no time to plan migration. They learn about deprecation at the same time as they receive warnings. Emergency migrations cause production incidents.

### Real-World Consequences
An API starts sending `Deprecation` headers for V1 without any prior communication. Consumers see the header and panic — they have 3 months before the Sunset date. Several miss the deadline because they needed 6 months to migrate.

### Preferred Alternative
Always include an Announce phase (minimum 3 months). Send proactive communications: blog post, email, dashboard notice. Only start Warn phase after the Announce period.

### Refactoring Strategy
1. Add Announce phase to the deprecation model
2. Implement proactive communication workflow
3. Set minimum Announce duration in retirement policy
4. Track consumer acknowledgment of deprecation notice
5. Only transition to Warn after Announce period completes

### Detection Checklist
- [ ] No Announce phase exists
- [ ] First deprecation signal is headers or enforcement
- [ ] Consumers surprised by deprecation
- [ ] No proactive communication sent

### Related Rules/Skills/Trees
- Rule: API-LIFECYCLE-004 (Announce Before Warn)
- Skill: deprecation-header-implementation
- Tree: api-governance

---

## 5. Overly Harsh Enforcement

### Category
Hostile Design

### Description
The Enforce phase applies extreme degradation — rate limit of 1 request/hour, 10-second artificial latency, or 100% error rate. This effectively removes the version without going through the Remove phase.

### Why It Happens
"Making it painful will force them to migrate." The team intentionally makes the old version unusable.

### Warning Signs
- Enforce phase rate limit is effectively zero
- Artificial latency > 5 seconds
- Error rate during Enforce phase is > 50%
- Consumers abandon the API entirely rather than migrate
- Support tickets report "X is broken" not "X is deprecated"
- Enforce phase is stricter than the stated policy

### Why Harmful
Consumers cannot perform their business functions even temporarily. Critical integrations break before migration is complete. The API provider appears hostile and untrustworthy.

### Real-World Consequences
An API enforces V1 deprecation with a rate limit of 100 requests/hour and 5-second artificial latency. A consumer's automated billing system makes 1000 requests/hour and fails within 15 minutes. Billing doesn't run for a full day before the consumer can migrate.

### Preferred Alternative
Apply mild enforcement — slight rate limiting (50% of normal), mild latency (500ms added), and warning body modifications. Make deprecation visible but not destructive.

### Refactoring Strategy
1. Define enforcement parameters that inconvenience but don't break
2. Communicate enforcement parameters in advance
3. Offer exceptions for consumers actively migrating
4. Monitor consumer impact during Enforce phase
5. Never apply 100% error rate or effectively-zero rate limits

### Detection Checklist
- [ ] Rate limit effectively zero
- [ ] Latency > 5 seconds
- [ ] Error rate > 50%
- [ ] Consumers report broken functionality, not deprecation
- [ ] Enforcement harsher than policy

### Related Rules/Skills/Trees
- Rule: API-LIFECYCLE-005 (Reasonable Enforcement)
- Skill: phased-deprecation-timeline
- Tree: api-governance
