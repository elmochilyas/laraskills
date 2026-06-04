# Skills: Data Vault 2.0 Modeling

## Skill: Designing Data Vault Hubs
**Purpose:** Design and implement Hubs for enterprise data warehouse integration.
**When to use:** Modeling business keys from source systems in a Data Vault warehouse.
**Steps:**
1. Identify business keys from each source system
2. Ensure keys are unique and immutable
3. Create Hub table with surrogate key (hash or sequence)
4. Add load date and record source metadata columns
5. Define Hub hash key algorithm (consistent across sources)
6. Test for duplicate business keys in source data
7. Create ETL process for Hub loading

## Skill: Implementing PIT Tables for Temporal Queries
**Purpose:** Create Point-In-Time tables for efficient temporal querying of Data Vault.
**When to use:** Enabling "as of" date queries against Data Vault models.
**Steps:**
1. Identify Hubs that require point-in-time queries
2. Determine the Satellite columns needed in the PIT view
3. Create PIT table with Hub surrogate key and effective date
4. For each relevant Satellite, add the applicable columns
5. Populate PIT via scheduled refresh or on-demand
6. Index PIT table on effective date for query performance
7. Create Gold mart views that use PIT instead of raw Vault JOINs
