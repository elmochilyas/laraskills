# Rules: Forge

## FORGE-PLATFORM-001: Forge Recipes for Standardization
**Condition:** Multiple Forge-managed servers
**Action:** Create and use Forge recipes for consistent provisioning
**Rationale:** Manual per-server configuration creates drift
**Consequences:** Violation causes inconsistent server configurations

## FORGE-PLATFORM-002: Nightwatch Integration
**Condition:** Production Forge server
**Action:** Enable Nightwatch monitoring on all production servers
**Rationale:** Forge provisions but does not monitor; Nightwatch fills this gap
**Consequences:** Violation deploys without production monitoring
