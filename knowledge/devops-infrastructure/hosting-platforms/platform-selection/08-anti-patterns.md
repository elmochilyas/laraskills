# Anti-Patterns: Platform Selection

## AP-PS-001: Shiny Object Platform
**Description:** Choosing the newest, most hyped platform without evaluating whether it matches team capabilities.
**Consequences:** Team struggles with unfamiliar platform. Operational incidents increase. Developer productivity decreases.
**Remediation:** Evaluate platforms based on team skills first, features second.

## AP-PS-002: Free Tier Production
**Description:** Running production applications on free-tier hosting.
**Consequences:** Performance degradation, limited support, SLA absence, and scaling blockers when traffic grows.
**Remediation:** Budget for production hosting. Free tiers are for development and experimentation only.

## AP-PS-003: No Exit Strategy
**Description:** Deeply integrating with platform-specific features without considering migration path.
**Consequences:** Platform lock-in prevents migration when pricing changes or limitations appear.
**Remediation:** Use standard Laravel patterns. Avoid platform-specific APIs unless migration cost is acceptable.
