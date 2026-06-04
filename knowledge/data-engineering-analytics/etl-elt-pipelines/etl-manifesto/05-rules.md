# Rules: ETL Manifesto YAML Configuration

## Rule EM-01: Version Control Manifests
ETL manifests MUST be stored in version control and deployed through CI/CD. Server-side edits without versioning cause silent data quality issues.

## Rule EM-02: Validate Manifests in CI
Manifest validation MUST run in CI: verify entity classes exist, relationships are defined, field names are correct, and output targets are reachable.

## Rule EM-03: One Manifest Per Pipeline
Each ETL pipeline MUST have its own manifest file. A single monolithic manifest for all pipelines is unmaintainable and error-prone.

## Rule EM-04: Chunked Processing for Large Datasets
Manifests targeting datasets larger than 10,000 rows MUST use chunked processing. Without chunking, memory exhaustion causes pipeline failure.

## Rule EM-05: Automated Output Validation
Every ETL pipeline execution MUST include automated output validation: row count checks, field presence, and data type verification.

## Rule EM-06: Sensitive Data Protection
Manifests that extract potentially sensitive data MUST be flagged for review. File outputs with sensitive data must have restricted permissions and never be stored in public directories.

## Rule EM-07: Environment Overrides
Manifests MUST support environment-specific overrides (output path, connection, chunk size). Development exports should never overwrite production data.

## Rule EM-08: Keep Transformations Simple
YAML manifest transformations MUST be limited to field mapping, type casting, and simple aggregations. Complex business logic must be delegated to service classes.

## Rule EM-09: Transaction Boundaries
Database output MUST use transaction boundaries per batch. A failed batch must not partially write data to the target table.

## Rule EM-10: Manifest Dependency Documentation
Manifest dependencies on Eloquent models SHOULD be documented. Removing or modifying a model field that a manifest depends on will silently break the ETL pipeline.
