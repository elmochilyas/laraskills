# Rules: S3-Compatible Storage (MinIO)

## Metadata
- **Source KU:** s3-compatible-storage-minio
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- MINIO-RULE-001: **Environment-based disk selection** — Same 's3' disk in all envs, different endpoint per `.env`.
- MINIO-RULE-002: **Set `use_path_style_endpoint` to true** — Required by MinIO for path-style URL construction.
- MINIO-RULE-003: **Create buckets ahead** — Laravel assumes bucket exists; create in MinIO Console or via SDK.
- MINIO-RULE-004: **Use presigned URLs** — Same behavior as production S3 for private files.
- MINIO-RULE-005: **CI service pattern** — Run MinIO as service container for integration tests.
- MINIO-RULE-006: **Ephemeral storage for dev** — Files lost on restart is acceptable; use persistent volumes for long-running projects.

## Decision Rules
- MINIO-RULE-007: **Use for local S3-dependent feature development** — Offline, no AWS access needed.
- MINIO-RULE-008: **Use for CI integration tests** requiring S3 file operations.
- MINIO-RULE-009: **Use real S3/DO Spaces in production** — MinIO is for development only.
- MINIO-RULE-010: **Use local filesystem** for simple file storage without S3-compatibility needs.
