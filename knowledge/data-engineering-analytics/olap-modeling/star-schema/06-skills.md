# Skills: Star Schema Fact/Dimension Modeling Fundamentals

## Skill: Designing a Star Schema Mart
**Purpose:** Create a star schema data mart for analytics queries.
**When to use:** Building analytics tables for dashboard consumption.
**Steps:**
1. Define the business question the mart answers
2. Determine the grain: what does one fact row represent?
3. Identify measures: numeric, additive columns
4. Identify dimensions: descriptive attributes for filtering/grouping
5. Create fact table with dimension foreign keys and measures
6. Create dimension tables with surrogate keys and denormalized attributes
7. Create conformed shared dimensions (date, customer)
8. Document grain, measures, and dimensions in schema YAML

## Skill: Converting Normalized Schema to Star Schema
**Purpose:** Transform normalized OLTP data into star schema analytics tables.
**When to use:** Building analytics on top of existing normalized Laravel models.
**Steps:**
1. Identify fact entities (orders, page views, events)
2. Identify dimension entities (customers, products, dates)
3. Create dimension tables from normalized related models, denormalizing attributes
4. Create fact table by joining across models at the appropriate grain
5. Map natural keys to surrogate keys
6. Backfill historical data
7. Test query performance improvement
