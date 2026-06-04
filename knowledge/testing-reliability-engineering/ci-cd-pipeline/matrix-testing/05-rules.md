# Rules — Matrix Testing (PHP x Database)

## Rule 1: Always Include the Production-Equivalent Matrix Cell
| Field | Value |
|-------|-------|
| **Name** | Always Include the Production-Equivalent Matrix Cell |
| **Category** | CI & Accuracy |
| **Rule** | The matrix must always include a cell matching the production PHP version and database engine exactly. This cell must pass before deployment. |
| **Reason** | All other matrix cells are for compatibility discovery. The production-equivalent cell is the only one that validates the exact environment your users will experience. If this cell fails, nothing deploys. It is the minimum viable matrix. |
| **Bad Example** | Production runs PHP 8.3 + MySQL 8.0, but matrix only includes PHP 8.2 + SQLite — tests pass but production fails. |
| **Good Example** | Matrix includes `{ php: '8.3', db: 'mysql', db-version: '8.0' }` matching production exactly. |
| **Exceptions** | Projects that use the same database engine across all environments with no version differences. |
| **Consequences Of Violation** | Code that passes CI may fail in production due to environment differences. |

## Rule 2: Run Minimal Matrix on PRs, Full Matrix on Merge
| Field | Value |
|-------|-------|
| **Name** | Run Minimal Matrix on PRs, Full Matrix on Merge |
| **Category** | CI & Strategy |
| **Rule** | Use a reduced matrix (production PHP version + production database) for PR feedback. Run the exhaustive matrix on merge to main or on a nightly schedule. |
| **Reason** | Full matrix multiplies CI time. A 3 PHP × 2 database matrix is 6x slower than a single cell. Running full matrix on every PR wastes developer time and CI minutes. Reduced matrix catches most issues; full matrix before merge catches compatibility regressions. |
| **Bad Example** | Running `php: [8.2, 8.3, 8.4]` × `db: [mysql, pgsql]` on every PR — 6x CI time for trivial changes. |
| **Good Example** | PR: `php: ['8.3']` × `db: [mysql]`. Main merge: `php: ['8.2', '8.3', '8.4']` × `db: [mysql, pgsql]`. |
| **Exceptions** | Open-source libraries where every PR must verify broad compatibility. |
| **Consequences Of Violation** | Slow CI feedback; developer frustration; CI minutes wasted. |

## Rule 3: Use Service Containers, Not External Databases
| Field | Value |
|-------|-------|
| **Name** | Use Service Containers, Not External Databases |
| **Category** | CI & Reliability |
| **Rule** | Use Docker service containers for MySQL/PostgreSQL in CI. Never use external shared databases or developer-local database instances. |
| **Reason** | Service containers start fresh for each job, ensuring clean state and version consistency. External shared databases introduce flakiness from shared state, leftover data, and connection pool exhaustion. Service containers are isolated, reproducible, and version-pinned. |
| **Bad Example** | CI connects to a shared staging database — parallel matrix cells collide on the same tables; data from one run persists to the next. |
| **Good Example** | `services: mysql: image: mysql:8.0` in CI workflow — fresh, isolated database per job. |
| **Exceptions** | Projects where Docker service containers are not supported by the CI platform. |
| **Consequences Of Violation** | Flaky tests from shared database state; parallel execution collisions. |

## Rule 4: Test Across at Least Two PHP Minor Versions
| Field | Value |
|-------|-------|
| **Name** | Test Across at Least Two PHP Minor Versions |
| **Category** | Compatibility & Upgrades |
| **Rule** | Include at least the current production PHP version and one version ahead in the matrix. This surfaces deprecation warnings early. |
| **Reason** | PHP deprecations accumulate over minor versions. Testing against the next version (e.g., 8.4 when production is 8.3) catches deprecation warnings before the PHP upgrade. Without this, the upgrade becomes a painful catch-up exercise. |
| **Bad Example** | Matrix only includes PHP 8.3 (production) — PHP 8.4 deprecations silently accumulate; upgrade to 8.4 requires fixing hundreds of warnings at once. |
| **Good Example** | Matrix: PHP 8.3 (production) and PHP 8.4 (preview) — deprecation warnings caught one PR at a time. |
| **Exceptions** | Projects pinned to a PHP version that cannot be upgraded (EOL platform). |
| **Consequences Of Violation** | PHP upgrade becomes high-risk, high-effort project; deprecations accumulate unnoticed. |

## Rule 5: Pin Database Service Container Versions
| Field | Value |
|-------|-------|
| **Name** | Pin Database Service Container Versions |
| **Category** | CI & Stability |
| **Rule** | Pin database service container versions (mysql:8.0, postgres:16) to match production. Never use `latest` tags. |
| **Reason** | `latest` tags change when new database versions are released. A MySQL `latest` tag that changes from 8.0 to 9.0 will break CI unexpectedly with new behaviors or removed features. Pinning exact versions ensures database behavior in CI matches production. |
| **Bad Example** | `image: mysql:latest` — MySQL releases 9.0; CI breaks due to removed compatibility features. |
| **Good Example** | `image: mysql:8.0` — pinned version matching production; CI stable until deliberate upgrade. |
| **Exceptions** | Projects that use the latest database version in all environments. |
| **Consequences Of Violation** | Unexpected CI failures from database version changes; production behavior divergence. |

## Rule 6: Do Not Use SQLite as the Only CI Database
| Field | Value |
|-------|-------|
| **Name** | Do Not Use SQLite as the Only CI Database |
| **Category** | CI & Accuracy |
| **Rule** | Never rely solely on SQLite for CI database testing. Always include at least one production-equivalent database (MySQL or PostgreSQL) in the matrix. |
| **Reason** | SQLite doesn't enforce foreign keys by default, has limited JSON support, different transaction semantics, and different date/time functions. Tests that pass on SQLite may fail on MySQL/PostgreSQL in production. SQLite is a convenient local development database, not a production-equivalent test target. |
| **Bad Example** | CI runs only `DB_CONNECTION=sqlite` — JSON queries, foreign keys, and transaction isolation differences go untested. |
| **Good Example** | CI matrix includes `db: mysql` (or `pgsql`) matching production — full production-environment verification. |
| **Exceptions** | Applications that use SQLite in production (rare, embedded applications). |
| **Consequences Of Violation** | Production database behavioral differences cause unexpected failures; JSON and foreign key issues surface only after deployment. |
