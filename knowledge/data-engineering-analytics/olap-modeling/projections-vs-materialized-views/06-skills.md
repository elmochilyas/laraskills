# Skills: ClickHouse Projections vs Materialized Views

## Skill: Choosing Between Projections and MVs
**Purpose:** Select the optimal pre-computation mechanism for a ClickHouse transformation.
**When to use:** Designing pre-computation strategy for dashboard performance.
**Steps:**
1. Determine if transformation is simple (reordering, aggregate) or complex (JOIN, subquery)
2. If simple → use projection
3. If complex → use materialized view
4. Check if real-time consistency is required (projection) or periodic refresh is acceptable (refreshable MV)
5. Assess write amplification budget: high insert volume → minimize projections
6. Document the decision rationale
7. Test with EXPLAIN to verify optimizer selection
