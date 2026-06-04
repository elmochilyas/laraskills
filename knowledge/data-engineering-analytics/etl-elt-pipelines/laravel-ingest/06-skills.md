# Skills: Laravel Ingest Configuration Classes

## Skill: Building a CSV Import Pipeline
**Purpose:** Create a robust CSV import pipeline with validation and error handling.
**When to use:** Importing business data from CSV files uploaded by users or partners.
**Steps:**
1. Create IngestDefinition with CSV source configuration
2. Define schema with field-level validation rules
3. Configure target model and duplicate resolution strategy
4. Set up IngestConfig with chunk size and error strategy
5. Implement relationship resolution (lookup tables)
6. Add file encoding detection and normalization
7. Test with various CSV formats (comma, tab, semicolon delimiters)

## Skill: Streaming Import for Large Files
**Purpose:** Import files larger than available PHP memory using streaming readers.
**When to use:** Processing CSV/Excel files > 100MB in production.
**Steps:**
1. Select streaming reader (OpenSpout for CSV/Excel)
2. Configure row-by-row processing in IngestDefinition
3. Set appropriate chunk size for database write performance
4. Implement progress tracking for long-running imports
5. Handle file system timeouts and connection drops
6. Monitor memory usage during import execution
7. Test with progressively larger files to find memory ceiling
