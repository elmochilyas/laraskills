# Anti-Patterns: AI-Assisted OLAP Modeling with LLM-Driven Schema Optimization

## Schema-Only Recommendations
The LLM is asked to recommend optimizations based on schema alone (table definitions, column types). Recommendations are generic: "consider adding indexes on frequently queried columns." No actionable impact.

**Solution:** Feed 30 days of query logs to the LLM. Include slow query analysis, access patterns, and join frequencies. Recommendations become data-driven.

## Applying All Changes at Once
The LLM suggests 10 changes. All are applied in a single deployment. Performance improves 30%. But one change actually degraded performance by 10%, and nine improved by 40%. The negative change is unknown and cannot be rolled back independently.

**Solution:** Apply one change per cycle. Measure before and after. Roll back individually if negative.

## No Query Log Sanitization
Production query logs containing user email addresses and order details are sent to an external LLM API. PII is exposed to a third party.

**Solution:** Sanitize query logs before sending to LLM. Replace actual values with placeholders. Strip WHERE clause values. Keep table/column names for context.

## Ignoring Pipeline Constraints
The LLM recommends adding a materialized view that joins a daily-updated dimension table. But the dimension table replaces its data entirely each night (TRUNCATE + INSERT). The materialized view references deleted rows and fails.

**Solution:** Document pipeline constraints and data lifecycle. Provide this context to the LLM. Validate recommendations against pipeline behavior.
