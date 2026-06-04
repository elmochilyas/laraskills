# Decision Trees: Form Request Organization

## Tree 1: Directory Structure Depth

```
How many API resources does the project have?
├── 1-5 resources → Per-resource directories under Api\V1\{Resource}\{Action}Request.
├── 5-20 resources → Per-resource directories. Group into domain subdirectories if needed.
├── 20+ resources → Per-resource directories. Domain grouping required (Api\V1\{Domain}\{Resource}\{Action}Request).
└── 1-2 endpoints in prototype → Flat directory is acceptable temporarily. Migrate before 5 endpoints.
```

## Tree 2: Action Naming Convention

```
What HTTP verb and action does this endpoint handle?
├── GET /resources → Index{Resource}Request (query params, filters, pagination)
├── POST /resources → Store{Resource}Request (create with required fields)
├── GET /resources/{id} → Show{Resource}Request (rarely needed, may use no request)
├── PUT/PATCH /resources/{id} → Update{Resource}Request (update with sometimes fields)
├── DELETE /resources/{id} → Destroy{Resource}Request (rarely needed, may use no request)
└── Custom action (POST /resources/bulk) → BulkStore{Resource}Request or {Action}{Resource}Request
```

## Tree 3: Inheritance Depth

```
How much rule sharing exists between Store and Update?
├── High overlap (>80%) → 3 levels: ApiRequest → Base{Resource}Request → Store/Update{Resource}Request
├── Medium overlap (50-80%) → 2 levels: ApiRequest → {Action}{Resource}Request. Use trait for shared rules.
├── Low overlap (<50%) → 2 levels: ApiRequest → {Action}{Resource}Request. No base resource request.
└── No overlap → 2 levels: ApiRequest → {Action}{Resource}Request. No sharing at all.
```

## Tree 4: Version Namespace Decision

```
Is the API versioned or likely to be versioned?
├── YES, currently versioned (V1, V2 exist) → Namespace under Api\V{N}\. Always.
├── YES, public API with consumers → Namespace under Api\V1\ from day one. Future-proof.
├── NO, internal app with no public API → Optionally version, but recommended for consistency.
└── NO, prototype that may become public → Namespace under Api\V1\ anyway. Harder to add later.
```

## Tree 5: Base Request Class Contents

```
What behavior should every API FormRequest share?
├── Error formatting → Override failedValidation in ApiRequest. All requests inherit consistent errors.
├── Authorization failure handling → Override failedAuthorization in ApiRequest. Consistent 403 response.
├── Content-type enforcement → Set Accept: application/json requirement in ApiRequest.
├── Input scoping → Override validationData in ApiRequest base. Control default input scope.
└── Logging → Log validation failures in ApiRequest base. Consistent observability.
```
