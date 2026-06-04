# Anti-Patterns: Data Vault 2.0 Modeling

## Data Vault for OLTP Systems
Data Vault tables are used directly by the Laravel application for transactional operations. Queries require 10+ JOINs for a simple lookup. Application performance is terrible because Data Vault is designed for batch warehouses, not real-time reads.

**Solution:** Use normalized Eloquent models for application queries. Data Vault belongs in the analytics data warehouse layer.

## Satellite Proliferation
Every attribute category gets its own Satellite, regardless of size. A 50-attribute Hub has 15 Satellites. Querying the complete picture of an entity requires 15 JOINs, making reports slow and complex.

**Solution:** Group related attributes into Satellites by source and change rate. 5-8 Satellites per Hub is a reasonable target for most models.

## Hash Key Collisions
Hash keys are used for surrogate keys without verifying collision probability. A hub with 10M records has a non-trivial collision risk with MD5. Collisions cause incorrect data associations.

**Solution:** Use SHA-256 for hash keys or use a sequence-based surrogate key. If using hash keys, verify collision probability against expected record count.

## No PIT Tables, Direct Vault Queries
Analysts write SQL queries directly against Data Vault tables for temporal reporting. Each query reinvents the effective-dating resolution logic, introducing bugs and inconsistency.

**Solution:** Create PIT tables for all temporally-queried Hubs. Provide analysts with Gold layer views that encapsulate temporal resolution.

## Ignoring the Gold Layer
Data Vault tables are exposed directly to BI tools without any Gold marts. BI tool queries are slow, require complex joins, and degrade as data volume grows.

**Solution:** Always create a Gold presentation layer on top of Data Vault. Gold marts are denormalized, aggregated, and query-optimized for BI consumption.
