# Anti-Patterns: Star Schema Fact/Dimension Modeling Fundamentals

## Snowflake Schema
Normalizing dimensions into sub-dimensions. Customer → Address → City → Region requires 4 JOINs just to filter by region. Query complexity explodes with each sub-dimension.

**Solution:** Denormalize all dimension attributes into a single dimension table. Redundancy is acceptable in analytics schemas.

## Using Natural Keys as Dimension PKs
Customer ID from CRM is used as the dimension primary key. CRM merges two customer records and changes the ID. All historical facts now reference a non-existent customer.

**Solution:** Generate surrogate keys independent of source systems. Map natural keys during the ETL process.

## No Date Dimension
Facts store timestamps but there is no dim_date table. "Show me sales by month, compared to last year" requires complex date extraction and comparison logic.

**Solution:** Create a dim_date table pre-populated with 20+ years of dates. Include year, quarter, month, week, day, holiday, fiscal period columns.

## Wide Facts
Fact tables include 50+ dimension attributes directly. Customer name, product description, and store location are stored in every fact row. Storage cost is 10x higher. Fact loads are slow.

**Solution:** Keep facts lean: measures + dimension foreign keys + degenerate dimensions only.

## Facts Without Measures
Fact tables with only dimension foreign keys and no numeric measures. These are not facts — they are link tables (bridge tables) or relationship tables.

**Solution:** If the table has no measures, model it as a dimension-to-dimension bridge table, not a fact.
