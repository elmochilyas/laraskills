# Skill: Configure MinIO for S3-Compatible Storage

## Purpose
Set up MinIO as a local S3-compatible object storage server in Docker for Laravel development, providing the same S3 API for local file operations without AWS access.

## When To Use
- Local S3-dependent feature development (offline, no AWS access needed)
- CI integration tests requiring S3 file operations
- Developing features using presigned URLs, bucket policies, or file uploads

## When NOT To Use
- Simple file storage without S3-compatibility needs (use local filesystem)
- Production (use real S3/DO Spaces/Vapor)
- When testing against real S3 behavior is critical

## Prerequisites
- Laravel Sail (MinIO included) or Docker Compose with MinIO service
- `config/filesystems.php` configured

## Inputs
- `docker-compose.yml` — MinIO service
- `.env` — MinIO endpoint and credentials
- `config/filesystems.php` — S3 disk configuration

## Workflow

1. **Add MinIO Service:** In `docker-compose.yml`, add MinIO service using `minio/minio` image with command `server /data --console-address ":9001"`. Expose ports 9000 (API) and 9001 (Console).

2. **Configure Laravel:** Set `FILESYSTEM_DISK=s3` in `.env`. Configure MinIO endpoint, bucket, credentials:
   - `AWS_ENDPOINT=http://minio:9000` (container network)
   - `AWS_ACCESS_KEY_ID=sail` (or `MINIO_ROOT_USER`)
   - `AWS_SECRET_ACCESS_KEY=password` (or `MINIO_ROOT_PASSWORD`)
   - `AWS_BUCKET=local`
   - `AWS_USE_PATH_STYLE_ENDPOINT=true`

3. **Set `use_path_style_endpoint`:** In `config/filesystems.php`, set `'use_path_style_endpoint' => true` for the S3 disk. MinIO requires path-style URL construction.

4. **Create Bucket:** Access MinIO Console at `http://localhost:9001`, log in with credentials, and create the bucket matching `AWS_BUCKET`. Alternatively, use the AWS SDK CLI.

5. **Test File Operations:** Upload a file using `Storage::put('test.txt', 'Hello MinIO')`. Verify it appears in MinIO Console. Test download, delete, and presigned URL generation.

6. **Configure for CI:** Add MinIO as a CI service container. Use ephemeral storage (files lost between runs) since CI environments are short-lived.

7. **Use Environment-Based Disk Selection:** Same `s3` disk in all environments; different endpoint per `.env`. Dev uses MinIO endpoint; production uses real S3 endpoint.

## Validation Checklist

- [ ] MinIO container running and Console accessible
- [ ] `use_path_style_endpoint` set to `true` in config
- [ ] Bucket created matching `AWS_BUCKET`
- [ ] File upload/download works via Laravel Storage facade
- [ ] Presigned URLs generated and accessible
- [ ] CI has MinIO as service container
- [ ] Production `.env` uses real S3 endpoint

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Bucket doesn't exist | File operations fail; create bucket first |
| Missing `use_path_style_endpoint` | URL construction fails with MinIO |
| Wrong endpoint in container | Use service name (`http://minio:9000`), not `localhost` |

## Decision Points

- **Use for local S3-dependent feature development** — Offline, no AWS access needed
- **Use for CI integration tests** requiring S3 file operations
- **Use real S3 in production** — MinIO is for development only
- **Use local filesystem** for simple file storage without S3-compatibility needs

## Performance/Security Considerations

- **Ephemeral storage for dev:** Files lost on restart is acceptable; use persistent volumes for long-running projects
- **Credentials:** MinIO dev credentials should not match production AWS credentials
- **CI usage:** Add as CI service container; ephemeral storage is acceptable for test runs

## Related Rules

- MINIO-RULE-001: Environment-based disk selection
- MINIO-RULE-002: Set `use_path_style_endpoint` to true
- MINIO-RULE-003: Create buckets ahead
- MINIO-RULE-004: Use presigned URLs
- MINIO-RULE-005: CI service pattern

## Related Skills

- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Manage Laravel Environment Files

## Success Criteria

- S3 file operations work locally with MinIO without AWS access
- Same `s3` disk configuration works in dev (MinIO) and production (real S3)
- Presigned URLs generated locally match production behavior
- CI tests run S3-dependent operations via MinIO service container
