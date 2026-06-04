# 04-Standardized Knowledge: S3-Compatible Storage (MinIO)

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | s3-compatible-storage-minio |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, docker-compose-for-laravel, environment-file-management |
| **Framework/Language** | MinIO, Laravel, S3, Docker, Sail |

## Overview

MinIO is an S3-compatible object storage server running locally in Docker, providing the same API as Amazon S3. In Sail, runs as a service container. Laravel's Filesystem config treats MinIO as an S3 disk. Supports: bucket management, file uploads/downloads, presigned URLs, CORS, bucket policies, event notifications. Standard S3 replacement for local Laravel development.

## Core Concepts

- **MinIO**: open-source S3-compatible object storage; single binary/Docker container
- **S3 Disk Config**: `config/filesystems.php` 's3' driver pointing to MinIO endpoint (`http://minio:9000`)
- **Bucket Management**: buckets created on demand; config 'bucket' key for default
- **Presigned URLs**: temporary URLs for secure file access (same API as S3)
- **Access Credentials**: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` mapped to `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- **MinIO Console**: web UI at port 9001 for management

## When to Use

- Local development of S3-dependent features
- Testing file uploads with S3-compatible API
- CI integration tests requiring S3 file operations
- Offline development without AWS access

## When NOT to Use

- Simple file storage (use local filesystem instead)
- Production (use real S3, DigitalOcean Spaces, etc.)

## Best Practices (WHY)

- **Environment-based disk selection**: same 's3' disk in all envs, different endpoint per `.env`
- **Set `use_path_style_endpoint` to true**: required by MinIO for path-style URL construction
- **Create buckets ahead**: Laravel assumes bucket exists; create in MinIO Console or via SDK
- **Use presigned URLs**: same behavior as production S3 for private files
- **CI service pattern**: run MinIO as service container for integration tests
- **Ephemeral storage for dev**: files lost on restart is acceptable; use persistent volumes for long-running projects

## Architecture Guidelines

- MinIO in docker-compose.yml as optional service
- Same `'s3'` disk config across environments; different endpoint/credentials in .env
- Dev: `AWS_ENDPOINT=http://minio:9000`, `use_path_style_endpoint=true`
- Prod: omit endpoint or use real S3 URL

## Performance Considerations

- Local MinIO: <5ms latency per operation
- Memory: 50-200MB depending on file count
- Storage: equals total file size
- CI: 5-10s setup overhead, fast operations

## Security Considerations

- Development only; no encryption, access logging, or backup
- Don't store production or sensitive data in MinIO
- Environment-specific credentials — dev creds (minioadmin) not valid in production

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Missing use_path_style_endpoint | SDK constructs virtual-hosted URLs | MinIO rejects requests | Set `use_path_style_endpoint => true` |
| Dev creds in production .env | minioadmin for real S3 | Auth failures | Separate .env files |
| Forgetting to create bucket | Bucket doesn't exist | File operations fail | Create bucket or use makeBucket() |
| CORS not configured | Browser uploads fail | JS upload errors | Configure CORS via Console |

## Anti-Patterns

- **Using MinIO for production storage**: not designed for production workloads
- **Storing production-like PII in MinIO**: data isn't encrypted or access-controlled

## Examples

```php
// config/filesystems.php - S3 disk for MinIO
's3' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    'bucket' => env('AWS_BUCKET', 'local'),
    'endpoint' => env('AWS_ENDPOINT', 'http://minio:9000'),
    'use_path_style_endpoint' => true,
],
```

## Related Topics

- laravel-sail — MinIO optional service in Sail
- docker-compose-for-laravel — MinIO Docker service
- environment-file-management — per-environment config

## AI Agent Notes

- Add MinIO configuration when scaffolding projects that use S3 file storage
- Default `use_path_style_endpoint` to true for S3-compatible services

## Verification

- [ ] MinIO container running
- [ ] `use_path_style_endpoint` set to true
- [ ] Bucket created in MinIO
- [ ] S3 disk config uses env variables
- [ ] Production .env uses real S3 endpoint
- [ ] CORS configured if browser uploads used
- [ ] Files upload/download successfully
