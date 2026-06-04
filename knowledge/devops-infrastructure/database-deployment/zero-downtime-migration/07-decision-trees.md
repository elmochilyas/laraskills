# Decision Trees: Zero-Downtime Migration

## Tool Selection

**Database engine:**
- MySQL (self-managed) → pt-online-schema-change (Percona Toolkit)
- Amazon RDS MySQL → gh-ost (no trigger conflicts with RDS)
- Aurora MySQL → gh-ost or native Aurora online DDL
- PostgreSQL → pgroll or pg_repack

**Table size:**
- < 1M rows → Standard Laravel migration (no locking concerns)
- 1M-10M rows → Online schema change during low traffic
- > 10M rows → Online schema change with aggressive throttling
