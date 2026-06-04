# 07-Decision Trees: S3-Compatible Storage (MinIO)

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | s3-compatible-storage-minio |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | MinIO vs Local Disk | Whether to use MinIO or local filesystem for file storage | Does the app use S3-specific features or can we use local storage? |
| D02 | Dev/Prod Config Parity | How to configure S3 disk across environments | Do we use the same s3 disk config with different endpoints? |
| D03 | Presigned URLs | Whether to test presigned URLs locally | Does the app generate temporary file access URLs? |
| D04 | CI Integration | Whether to run MinIO in CI | Do we have tests that depend on S3 file operations? |

## Architecture-Level Decision Trees

### D01: MinIO vs Local Disk

```
START: Should we use MinIO or local filesystem in development?
│
├── Local filesystem (simpler)
│   ├── Config: FILESYSTEM_DISK=local
│   ├── Files stored in storage/app/
│   ├── Pro: zero setup, no Docker service needed
│   ├── Pro: files accessible locally
│   ├── Con: S3-specific features (presigned URLs, CORS) don't work
│   ├── Con: dev/prod config mismatch
│   └── Best for: apps using simple file operations, no S3 features
│
├── MinIO (production parity)
│   ├── Config: FILESYSTEM_DISK=s3, AWS_ENDPOINT=http://minio:9000
│   ├── Pro: exact same API as S3
│   ├── Pro: presigned URLs, CORS, bucket policies work locally
│   ├── Pro: dev/prod config parity (different endpoint only)
│   ├── Con: need MinIO container (Sail optional service)
│   └── Best for: apps using S3 features, team consistency
│
└── Decision rule
    ├── Using S3 methods (presigned URLs, bucket policies, ACLs)? → MinIO
    ├── Using basic put/get/delete only? → Local disk is sufficient
    ├── CI needs file upload tests? → MinIO as CI service
    └── Uncertain? → Use MinIO (same disk config as production)
```

### D02: Dev/Prod Config Parity

```
START: How should we configure the S3 disk across environments?
│
├── Same s3 disk, different .env values (recommended)
│   ├── config/filesystems.php: same 's3' disk config
│   ├── Dev .env:
│   │   ├── AWS_ENDPOINT=http://minio:9000
│   │   ├── AWS_ACCESS_KEY_ID=sail
│   │   ├── AWS_SECRET_ACCESS_KEY=password
│   │   ├── AWS_BUCKET=local
│   │   └── AWS_DEFAULT_REGION=us-east-1
│   ├── Production .env:
│   │   ├── AWS_ENDPOINT= (empty or real S3 URL)
│   │   ├── AWS_ACCESS_KEY_ID=AKIA...
│   │   ├── AWS_SECRET_ACCESS_KEY=...
│   │   ├── AWS_BUCKET=production-bucket
│   │   └── AWS_DEFAULT_REGION=us-west-2
│   └── App code: uses config('filesystems.disks.s3') — same API calls
│
├── Critical config: use_path_style_endpoint
│   ├── Dev/MinIO: must be true (path-style URLs)
│   ├── Production S3: typically false (virtual-hosted URLs)
│   ├── Can't use .env for boolean cleanly
│   ├── Solution: set conditionally in config/filesystems.php
    │   └── 'use_path_style_endpoint' => env('AWS_ENDPOINT') ? true : false,
    └── Ensures: dev works with MinIO, prod works with real S3
│
└── Environment detection
    ├── Don't hard-code MinIO in production config
    ├── Use APP_ENV or separate .env files
    └── Production: never reference minio:9000
```

### D03: Presigned URLs

```
START: Does the app use presigned URLs?
│
├── Yes, app uses presigned URLs
│   ├── MinIO fully supports Storage::temporaryUrl()
│   ├── Test: generate presigned URL in dev → verify access
│   ├── Test: presigned URL expiration works
│   ├── Test: unauthorized access returns 403
│   └── Important: presigned URL generation works identically to S3
│
├── No, direct file access only
│   ├── Local disk is sufficient
│   ├── Files: storage/app/public + storage:link
│   └── Simple URL: asset('storage/file.pdf')
│
└── CORS configuration
    ├── If browser uploads use presigned URLs → configure CORS
    ├── MinIO Console → Bucket → CORS settings
    ├── Or use MinIO client: mc anonymous set
    └── Test: browser uploads work from app domain
```

### D04: CI Integration

```
START: Should we run MinIO in CI?
│
├── No MinIO in CI (simple tests)
│   ├── Use Storage::fake('s3') in unit tests
│   ├── Fake driver: asserts file operations without real storage
│   ├── Fast, no setup needed
│   └── Sufficient for: most file operation tests
│
├── MinIO as CI service (integration tests)
│   ├── Add to CI services section:
│   │   services:
│   │     minio:
│   │       image: minio/minio:latest
│   │       env: { MINIO_ROOT_USER: minioadmin, MINIO_ROOT_PASSWORD: minioadmin }
│   │       cmd: server /data --console-address ":9001"
│   ├── Test: full upload/download/delete flow
│   ├── Test: presigned URL generation
│   ├── Test: file visibility and permissions
│   └── Slower but tests real S3 API compatibility
│
└── Recommendation
    ├── Unit tests: Storage::fake('s3') — fast, sufficient for logic tests
    ├── Integration tests: MinIO as CI service — tests S3 API compatibility
    ├── Both: run fake tests on every commit, MinIO tests nightly
    └── Coverage: S3-specific features need real MinIO tests
```
