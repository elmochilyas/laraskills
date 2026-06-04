# Anti-Patterns: API Version Governance

## Eternal Deprecation
**Description:** Marking a version as deprecated but never setting or communicating a sunset date. The version remains operational indefinitely in a "zombie" state.
**Why it happens:** Teams fear breaking consumers, want to avoid difficult conversations, or simply forget to set the date.
**Consequences:** Consumers never migrate because there is no deadline. The version accumulates maintenance debt. Deprecation becomes meaningless.
**Better approach:** Always set a specific sunset date at the moment of deprecation. Even a distant date (12+ months) is better than none — it creates a known timeline for planning.

## Version Hoarding
**Description:** Maintaining N-5 or more versions simultaneously, typically out of fear of breaking any consumer.
**Why it happens:** Lack of usage metrics makes every version seem equally important. Teams err on the side of keeping everything.
**Consequences:** Massive maintenance burden. Security patches must be backported to dozens of versions. Deploy times increase. New development slows to a crawl.
**Better approach:** Adopt N-2 policy. Track usage metrics to identify low-traffic versions for deprecation. Remember that version removal is a feature, not a bug.

## Silent Breaking Changes
**Description:** Deploying breaking changes (field removal, type changes, semantic shifts) within a minor version without communication.
**Why it happens:** Teams don't recognize the change as breaking, or they prioritize speed over consumer stability.
**Consequences:** Consumer applications break at runtime with no warning. Trust in the API platform erodes. Support tickets spike.
**Better approach:** Define breaking changes explicitly in team conventions. Use automated contract test suites that compare response schemas before/after deployment. Any field removal or type change requires a major version bump.

## Governance By Anecdote
**Description:** Making deprecation decisions based on "I think nobody uses version X" rather than measured usage data.
**Why it happens:** Usage metrics infrastructure doesn't exist or is too difficult to access.
**Consequences:** The team breaks an unknown consumer who depends on the deprecated version. Trust is damaged. Rollback is required.
**Better approach:** Implement version-level usage tracking before any deprecation. Sample-based metrics are sufficient. Never deprecate a version without data showing low usage.

## Vanity Version Count
**Description:** Celebrating the number of supported versions as a sign of commitment to consumers, rather than treating version reduction as an improvement.
**Why it happens:** Teams equate "more versions = more consumer choice = better platform."
**Consequences:** Engineering velocity decreases proportionally to version count. Each new feature must be implemented, tested, and deployed across all versions.
**Better approach:** Track supported version count as a maintenance metric. Set reduction targets. Celebrate version removals in retrospectives.

## Deprecation Without Migration
**Description:** Deprecating a version without providing a documented migration path to the replacement version.
**Why it happens:** Teams assume consumers can figure out the differences, or the migration documentation is too much work.
**Consequences:** Consumers can't upgrade because they don't know what changed. Either they stay on the deprecated version (ignoring deprecation) or they file support requests for migration help.
**Better approach:** Migration path documentation is a prerequisite for deprecation. Include specific changes, code examples, and any automated upgrade tools.

## Governance Shelf
**Description:** Writing a comprehensive governance policy document but never reviewing or enforcing it. The policy sits on a virtual shelf.
**Why it happens:** Governance is treated as a one-time documentation exercise rather than an ongoing process.
**Consequences:** Versions accumulate without oversight. Policy violations go unnoticed. The governance document becomes increasingly irrelevant.
**Better approach:** Schedule recurring governance reviews (quarterly). Assign ownership. Track compliance metrics. Link governance to the deployment pipeline so violations block releases.

## Reactive Governance
**Description:** Only addressing version management when a crisis occurs — a consumer complains about an unexpected breaking change, or security patches are unmaintainable across too many versions.
**Why it happens:** No proactive governance process exists. Version management is invisible until something breaks.
**Consequences:** Decisions made under pressure are suboptimal. Consumer trust is damaged. The team operates in permanent firefighting mode.
**Better approach:** Establish governance processes before launching the first API version. Proactive governance prevents crises rather than reacting to them.
