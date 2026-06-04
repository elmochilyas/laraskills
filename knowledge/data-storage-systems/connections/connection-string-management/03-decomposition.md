# Decomposition: 10.11 Connection string management (environment variables, dynamic password rotation)

## Topic Overview
Database connection strings (host, port, username, password, database) must be managed securely: environment variables (non-committed), secret manager (AWS Secrets Manager, Vault), and dynamic rotation. Laravel reads config from `env()` at boot. For runtime changes (password rotation), use `config()->set()` + purge.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-11-connection-string-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.11 Connection string management (environment variables, dynamic password rotation)
- **Purpose:** Database connection strings (host, port, username, password, database) must be managed securely: environment variables (non-committed), secret manager (AWS Secrets Manager, Vault), and dynamic rotation. Laravel reads config from `env()` at boot.
- **Difficulty:** Advanced
- **Dependencies:** 10.5 Dynamic connection config, 10.6 Connection purging

## Dependency Graph
**Depends on:** "10.5 Dynamic connection config", "10.6 Connection purging"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Environment variables**: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `.env`. Not committed to version control.; - **Secret manager integration**: `config/database.php` reads from AWS Secrets Manager at boot. `DB_PASSWORD = json_decode(file_get_contents('http://localhost:2773/secrets/...'))->password`.; - **Runtime rotation**: Secrets manager updates password. Application detects (via health check → reconnect failure), reads new secret, `config()->set(...)`, `DB::purge('mysql')`, reconnect..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization