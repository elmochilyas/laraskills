# Anti-Patterns: Ploi Server Management

## AP-PLOI-001: Agent Abandonment
**Description:** Servers are provisioned through Ploi but managed entirely via SSH, ignoring the Ploi dashboard for routine operations.
**Why it happens:** Teams unfamiliar with Ploi's interface fall back to SSH habits.
**Consequences:** Configuration drift between Ploi-managed state and actual server state. Next Ploi recipe application overwrites SSH modifications.
**Remediation:** Use Ploi dashboard for all supported operations. Reserve SSH for troubleshooting only.

## AP-PLOI-002: Docker-by-default without Assessment
**Description:** Choosing Docker server setup on Ploi for every application without evaluating whether Docker adds value for that specific workload.
**Why it happens:** Docker is perceived as the modern default.
**Consequences:** Increased resource overhead, debugging complexity, and deployment time without corresponding benefits for simple PHP applications.
**Remediation:** Evaluate Docker necessity per workload. Simple CRUD apps on traditional LEMP are simpler and cheaper.

## AP-PLOI-003: Staging Site Sprawl
**Description:** Creating unlimited staging sites on production servers for each feature branch.
**Why it happens:** Ploi makes staging creation trivial; teams lack cleanup discipline.
**Consequences:** Server resource exhaustion from idle staging sites. Database connection limits hit. SSL certificate rate limits exceeded.
**Remediation:** Set staging site retention policy (7-day TTL). Automate cleanup of stale staging sites via Ploi API.
