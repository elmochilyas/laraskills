# Rules: Docker Compose Laravel

## DC-001: Health Check Dependencies
**Condition:** Service depends on another service (app depends on DB)
**Action:** Use `depends_on` with `condition: service_healthy`
**Rationale:** Services start in parallel; health check ensures dependency is ready before dependent starts
**Consequences:** Violation causes application startup failures on fresh environments

## DC-002: Non-Root Container User
**Condition:** PHP-FPM service in Docker Compose
**Action:** Use `USER` directive or `user:` in compose to run as non-root
**Rationale:** Containers running as root have unnecessary host-level access on compromise
**Consequences:** Violation enables container escape attacks

## DC-003: Named Volumes for Data
**Condition:** Database or persistent data service
**Action:** Use named volumes, not bind mounts, for database data
**Rationale:** Bind mounts have permission issues and performance overhead on certain host filesystems
**Consequences:** Violation causes database permission errors or poor I/O performance
