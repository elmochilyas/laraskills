# Skills: Late-Arriving Dimension Handling in Fact Table Loading

## Skill: Implementing Placeholder Dimension Strategy
**Purpose:** Handle late-arriving dimensions by pre-creating placeholder rows in dimension tables.
**When to use:** Setting up star-schema ETL pipelines where dimensions may arrive after facts.
**Steps:**
1. Add placeholder row to every dimension table (key 0 or -1, name "Unknown")
2. Configure fact ETL to check dimension existence before insert
3. If dimension not found: use placeholder key, log late-arriving event
4. Implement resolution job: when dimension arrives, update fact foreign keys
5. Add dimension arrival trigger to run resolution for affected facts
6. Monitor unresolved fact count and resolution latency

## Skill: Deferred Resolution with Natural Keys
**Purpose:** Handle late-arriving dimensions by storing natural keys and resolving later.
**When to use:** High-volume pipelines where placeholder lookups add unacceptable overhead.
**Steps:**
1. Store natural key alongside surrogate key in fact table
2. Load facts with null surrogate key for unresolved dimensions
3. Create resolution job that matches natural keys to dimension table
4. Backfill surrogate keys in fact table via chunked updates
5. Remove null surrogate key constraint temporarily during fact loading
6. Monitor percentage of resolved vs unresolved facts over time
