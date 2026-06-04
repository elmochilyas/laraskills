# Skill: Apply Composite Index Selectivity Principles

## Purpose

Design composite indexes based on column cardinality (number of distinct values) — placing high-selectivity columns (ID, email) before low-selectivity columns (status, boolean) to maximize early pruning and minimize the number of index entries scanned.

## When To Use

- Composite index design decisions
- Comparing alternative column orderings
- Query optimization for selective filters

## When NOT To Use

- Single-column indexes (selectivity doesn't affect ordering)
- Queries with only equality conditions (order matters less)

## Prerequisites

- Understanding of cardinality and selectivity concepts
- Knowledge of column value distributions

## Inputs

- Column cardinality estimates
- Query filter predicates
- Data distribution characteristics

## Workflow

1. Estimate the cardinality (distinct values) of each filter column
2. Calculate selectivity: 1/cardinality
3. Place highest-selectivity (most distinct values) column first
4. Place lowest-selectivity (fewest distinct values) column last
5. Exception: if a low-selectivity column is always filtered with equality, it may be better first
6. Verify with EXPLAIN: look for estimated rows after each index condition

## Validation Checklist

- [ ] Leading column is selective enough to meaningfully reduce search space
- [ ] Low-cardinality columns are not leading alone (composite with selective column)
- [ ] Correlated columns identified and not over-indexed
- [ ] Actual cardinality distribution checked (not just count of distinct values)

## Common Failures

### Misunderstanding cardinality distribution
A column with 10 distinct values evenly distributed (10% each) is different from 10 values where one value covers 99% of rows.

### Ignoring correlated columns
`created_date` and `created_at` have similar cardinality because they're correlated. Indexing both provides little benefit over one.

## Decision Points

### High cardinality vs low cardinality first?
High cardinality first for maximum early pruning. Exception: low-cardinality column with always-present equality filter may be better first.

### Even distribution vs skewed distribution?
For skewed distributions, order by the column that most frequently filters out the most rows, not just by distinct count.

## Performance Considerations

A high-selectivity leading column can reduce the scanned index entries by orders of magnitude. A low-selectivity leading column may cause a full index scan.

## Security Considerations

Cardinality analysis doesn't affect security directly. Be aware that index statistics can reveal data distribution patterns.

## Related Rules

- Place high-cardinality/selectivity columns first in composite indexes
- Account for data distribution skew, not just distinct count
- Check for correlated columns before adding both to an index

## Related Skills

- Design Composite Indexes with Correct Column Ordering
- Design Composite Indexes with Correct Leftmost Prefix
- Monitor Index Usage Statistics

## Success Criteria

- Leading column effectively reduces the search space
- Actual data distribution (not just distinct count) guides ordering
- Correlated columns identified and not over-indexed
- EXPLAIN shows low estimated rows after index conditions
