# Skills: ClickHouse MergeTree Engine Configuration

## Skill: Designing MergeTable ORDER BY
**Purpose:** Design an optimal ORDER BY key for ClickHouse MergeTree tables.
**When to use:** Creating new MergeTree tables for analytics workloads.
**Steps:**
1. Analyze query patterns: which columns appear in WHERE clauses most frequently?
2. Rank columns by selectivity (unique values / total rows)
3. Place highest-selectivity columns leftmost in ORDER BY
4. Place time column last for partition pruning
5. Set PRIMARY KEY to most selective subset of ORDER BY
6. Test with representative queries: check `read_rows` before and after
7. Monitor system.query_log for full-scan queries

## Skill: MergeTree Partition Strategy
**Purpose:** Select and implement an optimal partition strategy.
**When to use:** Configuring data lifecycle for ClickHouse analytics tables.
**Steps:**
1. Identify data retention requirements per table
2. Choose partition granularity: monthly for most tables, daily for high-volume
3. Consider prefix partitioning for multi-tenant access patterns
4. Configure TTL for automatic partition removal
5. Set up tiered storage (hot/cold) using TTL TO VOLUME
6. Monitor partition count and merge activity
7. Adjust partition strategy if part count exceeds thresholds
