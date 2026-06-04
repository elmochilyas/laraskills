# Skills: SCD Type 1/2 Dimension Handling in Laravel Star-Schema

## Skill: Implementing Type 2 SCD with dbt Snapshots
**Purpose:** Implement versioned dimension tracking using dbt's built-in snapshot feature.
**When to use:** Tracking dimension attribute changes over time in a data warehouse.
**Steps:**
1. Identify dimension attributes that need Type 2 tracking
2. Create snapshot YAML with unique_key (natural key) and updated_at strategy
3. Define snapshot SQL selecting from staging dimension source
4. Run dbt snapshot to create versioned dimension table
5. Verify: check new version rows on attribute change
6. Create Gold layer dimension view with current-flag filter
7. Document SCD strategy in model YAML

## Skill: Implementing SCD Change Detection
**Purpose:** Efficiently detect dimension attribute changes for SCD processing.
**When to use:** Building custom SCD pipelines without dbt snapshots.
**Steps:**
1. Load new dimension data from source
2. Compute hash of all Type 2-tracked columns
3. Join with current dimension rows on natural key
4. Compare hash values to detect changes
5. Expire current rows where hash differs (set expiry_date, is_current = false)
6. Insert new rows with updated attributes and future-far expiry
7. Verify: no overlapping date ranges, exactly one current row per natural key
