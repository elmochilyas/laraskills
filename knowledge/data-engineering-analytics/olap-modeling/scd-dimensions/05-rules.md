# Rules: SCD Type 1/2 Dimension Handling in Laravel Star-Schema

## Rule SCD-01: SCD Strategy Before Mart Creation
SCD type MUST be defined for each dimension attribute before the mart is built. Defaulting to Type 1 without analysis leads to incorrect historical data.

## Rule SCD-02: Minimize Type 2 Columns
ONLY attributes that affect historical analysis results MUST use Type 2. All other attributes use Type 1 or Type 0.

## Rule SCD-03: Current Row Flag Required
Type 2 dimension tables MUST have an `is_current` boolean column with a filtered index. Current-row lookups are the most frequent operation.

## Rule SCD-04: Use Exclusive End Dates
Type 2 effective date ranges MUST use inclusive start, exclusive end convention. `[effective_date, expiry_date)` enables clean BETWEEN queries.

## Rule SCD-05: No Overlapping Date Ranges
Type 2 dimension rows for the same natural key MUST NOT have overlapping effective date ranges. Enforce via unique constraint on (natural_key, effective_date_range).

## Rule SCD-06: Surrogate Keys for Type 2
Facts referencing Type 2 dimensions MUST use surrogate keys. Natural key + effective date joins are inefficient and error-prone.

## Rule SCD-07: Use dbt Snapshots
Type 2 SCD MUST use dbt snapshots or equivalent warehouse-native SCD support. Manual Type 2 implementations are error-prone and inconsistent.

## Rule SCD-08: Hash Comparison for Change Detection
Type 2 change detection MUST use hash comparison of significant columns, not column-by-column comparison. Hash comparison is faster and less error-prone.

## Rule SCD-09: No Type 2 on Rapidly Changing Attributes
Attributes that change more than once per month on average MUST NOT use Type 2. Use Type 1 or periodic snapshots instead.

## Rule SCD-10: Document SCD Strategy
Every dimension table MUST document which attributes use which SCD type and why. Documentation is essential for analytical accuracy.
