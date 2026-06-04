# Rules: AI-Assisted OLAP Modeling with LLM-Driven Schema Optimization

## Rule AIOM-01: Feed Real Query Logs
AI schema optimization MUST use real production query logs (minimum 7 days, preferred 30 days). Generic schema-only recommendations are not sufficient.

## Rule AIOM-02: Validate in Staging
All AI-generated schema recommendations MUST be validated in a staging environment before production deployment.

## Rule AIOM-03: Apply One Change at a Time
AI recommendations MUST be applied incrementally (one change per cycle). Each change's impact must be measured before proceeding.

## Rule AIOM-04: Document Business Constraints
Business and pipeline constraints that affect schema decisions MUST be documented and provided to the LLM as context.

## Rule AIOM-05: Measure Before and After
Performance measurements (query latency, resource usage) MUST be collected before and after each AI-recommended change.

## Rule AIOM-06: Rollback Plan Required
Each AI-recommended schema change MUST have a documented rollback plan before applying to production.

## Rule AIOM-07: Combine With Expert Review
AI recommendations MUST be reviewed by a database engineer before production deployment. Automated application without review is forbidden.

## Rule AIOM-08: Track Recommendation Success Rate
AI recommendation outcomes MUST be tracked: accepted, rejected, positive impact, negative impact, no impact.

## Rule AIOM-09: Refresh Recommendations Periodically
AI optimization MUST be re-run quarterly (or when query patterns change significantly) to keep schema optimized.

## Rule AIOM-10 Protect Sensitive Data in Logs
Query logs fed to LLMs MUST be sanitized. Table and column names can be shared, but actual data values and PII must be excluded.
