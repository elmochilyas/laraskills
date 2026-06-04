# Anti-Patterns: ETL Manifesto YAML Configuration

## Monolithic Manifest
A single manifest file defines every ETL pipeline in the application. The file grows to thousands of lines. Any change risks breaking unrelated pipelines. Code review is impossible because the diff is too large.

**Solution:** Split by domain. Each manifest represents a single data pipeline with a clear purpose. Use YAML anchors for shared configuration.

## Business Logic in YAML
Complex business rules are encoded in YAML transformation expressions. The YAML becomes unreadable, untestable, and impossible to debug. Business logic belongs in PHP code where it can be tested.

**Solution:** Reference service classes for complex transformations. Keep YAML for data flow definitions only.

## Silent Field Renames
An Eloquent model field is renamed, but the manifest still references the old field name. The ETL pipeline no longer extracts the field, but the export "succeeds" without the column.

**Solution:** Implement manifest validation that checks field existence against model schema. Alert on missing fields during pipeline execution.

## No Idempotent Loading
The manifest's database output target uses INSERT without handling duplicates. Running the pipeline twice creates duplicate rows. Analysts see inflated numbers and lose trust in the data.

**Solution:** Use `insert_overwrite` or `merge` strategies for database targets. Ensure pipeline execution is idempotent.

## Ignoring Pipeline Order
Multiple manifests write to the same target table without coordination. Manifests that process dimension data run after manifests that process fact data, creating foreign key violations.

**Solution:** Define manifest dependency graphs and enforce execution order. Run dimension manifests before fact manifests.
