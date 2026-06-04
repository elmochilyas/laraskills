# Knowledge Unit: S3-Compatible Storage (MinIO)

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/s3-compatible-storage-minio
- **Maturity:** Mature
- **Related Technologies:** MinIO, Laravel, S3, Cloud Storage, Docker, Sail

## Executive Summary

MinIO is an S3-compatible object storage server that runs locally in Docker, providing the same API as Amazon S3 for development and testing. In Laravel Sail, MinIO runs as a service container, enabling applications to use S3 file operations (store, retrieve, delete, presigned URLs) without connecting to AWS. Laravel's Filesystem configuration (config/filesystems.php) treats MinIO as an S3 disk—same API calls, same behavior. MinIO supports: bucket management, file uploads and downloads, presigned URLs, CORS configuration, bucket policies, and event notifications. It's the standard S3 replacement for local Laravel development, enabling offline file operations and reducing costs associated with development S3 usage.

## Core Concepts

- **MinIO:** Open-source, S3-compatible object storage server; runs as a single binary (or Docker container); provides S3 API compatibility
- **S3 Disk Configuration:** config/filesystems.php defines an 's3' disk using the 's3' driver pointing to MinIO's endpoint (http://minio:9000)
- **Bucket Management:** MinIO creates buckets on demand (via AWS SDK or filesystems config); Laravel's config uses 'bucket' key for the default bucket
- **Presigned URLs:** Temporary URLs for secure file access without public permissions; MinIO supports the same presigned URL API as S3
- **Access Credentials:** MinIO uses MINIO_ROOT_USER and MINIO_ROOT_PASSWORD as access credentials (mapped to AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)
- **MinIO Console:** Web UI for MinIO management at port 9001; provides bucket browsing, file upload/download, user management, and configuration

## Mental Models

- **MinIO as Local S3:** MinIO is Amazon S3 running on your local machine—same API, same behavior, no AWS account required
- **MinIO as Storage Emulator:** Like an emulator for game consoles—MinIO emulates S3's behavior so you can develop and test S3-dependent features without internet or AWS access
- **MinIO as File Storage for Development:** Instead of storing files on the local filesystem (storage/app/public), MinIO provides S3-compatible storage that mirrors production S3 behavior

## Internal Mechanics

1. **S3 API Implementation:** MinIO implements the Amazon S3 REST API (both XML and Signature V4); all AWS SDK calls work against MinIO without modification
2. **Docker Container:** MinIO runs as a Docker container with persistent volume for stored files, exposed on ports 9000 (API) and 9001 (Console)
3. **Laravel Filesystem Configuration:**
```php
'disks' => [
    's3' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        'bucket' => env('AWS_BUCKET', 'local'),
        'endpoint' => env('AWS_ENDPOINT', 'http://minio:9000'),
        'use_path_style_endpoint' => true,
    ],
],
```
4. **Path Style Endpoint:** MinIO requires 'use_path_style_endpoint' => true because it doesn't support virtual-hosted-style S3 URLs
5. **AWS SDK Integration:** Laravel's S3 driver uses the AWS SDK for PHP; the SDK connects to MinIO's endpoint URL and performs standard S3 operations
6. **File Operations Flow:** Storage::disk('s3')->put('path/file.txt', $content) → AWS SDK S3Client::putObject() → HTTP request to MinIO API → MinIO stores the file

## Patterns

- **Local S3 Development Pattern:** Use MinIO in development (S3 endpoint points to local MinIO) and real S3 in production. Same code, different .env configuration.
- **Environment-Based Disk Selection Pattern:** Use the 's3' disk in both development and production, but change the endpoint URL and credentials per environment in .env.
- **Public URL Simulation Pattern:** Configure MinIO buckets for public-read; use presigned URLs for private files to match production S3 behavior exactly.
- **File Visibility Pattern:** Set Storage::disk('s3')->put('public/avatar.jpg', $content, 'public') for public files; MinIO respects ACLs and visibility settings.
- **Console Management Pattern:** Access MinIO Console at http://localhost:9001 to browse stored files, inspect bucket contents, and verify file operations during development.
- **CI/MinIO Service Pattern:** In CI (GitHub Actions), run MinIO as a service container for integration tests that require S3 file operations.
- **Multiple Bucket Pattern:** Create multiple buckets in MinIO (local, testing, staging) matching production bucket names; configure disks per environment.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Storage service | MinIO vs Local filesystem vs SQL (BLOB) | MinIO for S3-compatible development; local filesystem for simplicity |
| MinIO vs Local disk | S3 (via MinIO) vs local (storage/app) | S3/ MinIO when production uses S3; local for simple file storage |
| Endpoint configuration | Path-style vs virtual-hosted-style | Path-style (required by MinIO; use_path_style_endpoint => true) |
| MinIO port | 9000 (API) 9001 (Console) vs custom | Default ports (standard S3 port mapping) |
| Persistence | Ephemeral vs persistent volume | Ephemeral for development (volatile); persistent for long-running projects |

## Tradeoffs

- **MinIO vs Local Filesystem:** MinIO mirrors S3 behavior (presigned URLs, visibility, regions) but adds a Docker service dependency. Local filesystem is simpler but doesn't test S3-specific features.
- **MinIO vs Real S3:** MinIO is free and works offline but may have subtle differences from real S3 (performance characteristics, eventually consistent behavior, cross-region replication). Always test critical S3 features on real S3 before production deployment.
- **Path-Style vs Virtual-Hosted Endpoints:** MinIO uses path-style endpoints (http://minio:9000/bucket/key). AWS S3 defaults to virtual-hosted (https://bucket.s3.region.amazonaws.com/key). The difference affects URL generation and presigned URL format.

## Performance Considerations

- **Local MinIO Performance:** MinIO on localhost (same machine or Docker) adds <5ms latency per operation. File upload/download speed is limited by disk I/O and network within Docker.
- **MinIO Memory Usage:** MinIO container uses 50-200MB RAM depending on file count and concurrent operations. This is acceptable for development.
- **File Storage:** MinIO with persistent volume stores files on the host filesystem. Storage usage equals the total size of all stored files.
- **CI Performance:** Running MinIO as a CI service adds 5-10 seconds to setup. File operations during tests are fast (<10ms per operation).

## Production Considerations

- **Development Only:** MinIO is for development and testing. Production uses real S3 (AWS, DigitalOcean Spaces, or other S3-compatible providers).
- **Environment Configuration:** Use the same 's3' disk for all environments but different .env values:
  - Development: AWS_ENDPOINT=http://minio:9000, use_path_style_endpoint=true
  - Production: AWS_ENDPOINT=https://s3.us-east-1.amazonaws.com (or omit)
- **File Persistence in Development:** MinIO's files persist across container restarts if using persistent volumes. Delete the volume to clear all files.
- **Data Privacy:** MinIO stores files on the local filesystem without encryption, access logging, or backup. Don't store sensitive or production data in development MinIO.
- **Migration to Production:** Files in development MinIO don't automatically sync to production S3. Ensure deployment processes handle file migration or seed production files separately.

## Common Mistakes

- **Not setting use_path_style_endpoint:** MinIO requires use_path_style_endpoint => true; without it, the AWS SDK constructs virtual-hosted-style URLs that MinIO doesn't support
- **Using development credentials in production .env:** AWS_ACCESS_KEY_ID from MinIO (minioadmin) used in production; S3 authentication fails
- **Forgetting to create buckets:** Laravel assumes the S3 bucket exists; MinIO doesn't auto-create buckets. Create the bucket in MinIO Console or use Storage::disk('s3')->makeBucket()
- **CORS issues with presigned URLs:** MinIO CORS configuration differs from S3; if browser-based uploads fail, configure MinIO CORS via Console or mc CLI
- **Region mismatch:** MinIO accepts any region; if the application sends requests to us-east-1 but MinIO expects a different region, signature verification fails

## Failure Modes

- **MinIO Container Not Running:** Application S3 operations fail because MinIO isn't running. Mitigate: verify sail status; ensure MinIO service is in docker-compose.yml.
- **MinIO Bucket Not Found:** The configured bucket doesn't exist in MinIO. Mitigate: create the bucket in MinIO Console; update AWS_BUCKET config.
- **Credential Mismatch:** Provided access key/secret don't match MinIO configuration. Mitigate: verify MINIO_ROOT_USER/MINIO_ROOT_PASSWORD match AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.
- **Signature Version Mismatch:** AWS SDK tries to use Signature V4 with MinIO when MinIO expects a different signing method. Mitigate: configure the SDK for MinIO-compatible signature calculation.
- **Disk Full:** MinIO's persistent volume fills up. Mitigate: prune old files; increase volume size; configure MinIO storage limits.

## Ecosystem Usage

- **Laravel Sail:** MinIO is available as an optional service in Sail (add --with=minio during installation or add to docker-compose.yml services)
- **Laravel Vapor:** Vapor uses real S3 for production; MinIO provides local S3 development without AWS access
- **Laravel Forge:** Forge servers configure S3 for file storage; MinIO development matches the production S3 configuration
- **Laravel Nova:** Nova's file fields (avatar, file upload) use Laravel's filesystem; MinIO enables local S3 development for Nova file operations
- **Laravel Livewire:** Livewire file uploads (temporary uploads, signed URLs) work with MinIO, enabling full file upload flow development locally

## Related Knowledge Units

- laravel-sail
- docker-compose-for-laravel
- environment-file-management
- cache-queue-services

## Research Notes

- MinIO was created as a lightweight S3-compatible server for AI/ML workloads but has become the standard local S3 emulator for development
- MinIO's S3 compatibility is maintained through the MinIO Gateway, which passes the S3 compliance test suite
- Laravel uses the AWS SDK for PHP (v3); MinIO is compatible with AWS SDK v3's S3 client
- The use_path_style_endpoint setting was added to Laravel's filesystem configuration specifically to support S3-compatible services like MinIO that don't support virtual-hosted-style URLs
