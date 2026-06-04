# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 02-saloonphp
**Knowledge Unit:** client-sdk-generation
**Generated:** 2026-06-03

---

# Decision Inventory

1. SDK Generation Approach
2. Auto-Generated vs Hand-Written Code Management
3. SDK Versioning Strategy

---

# Architecture-Level Decision Trees

---

## SDK Generation Approach

---

## Decision Context

Choosing between hand-written Saloon SDK, auto-generated from OpenAPI, or vendor SDK.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Does the API provider offer an official PHP SDK?
↓
YES → Use vendor SDK (tested, maintained, documented)
  ↓
  Does the vendor SDK use Saloon?
  ↓
  YES → Perfect compatibility with your pattern
  NO → Wrap vendor SDK in service class for consistency
NO → Does the API have a well-maintained OpenAPI spec?
  ↓
  YES → Use auto-generation (Speakeasy, Fern, OpenAPI Generator)
  ↓
  Is PHP/Saloon output format supported?
  ↓
  YES → Generate Saloon connectors directly
  NO → Generate generic PHP SDK; wrap in service class
NO → Hand-write Saloon SDK (Connector + Request + DTO per endpoint)
  ↓
  Are there 50+ endpoints?
  ↓
  YES → Auto-generation is more cost-effective despite incomplete spec
  NO → Hand-written is fine for small APIs

---

## Rationale

Vendor SDK is always preferred when available. Auto-generation scales for large specs. Hand-written SDKs offer full control for small or poorly-specified APIs.

---

## Recommended Default

**Default:** Vendor SDK → Auto-generation → Hand-written (in priority order)
**Reason:** Maximizes leverage of existing work; minimize custom code

---

## Risks Of Wrong Choice

Vendor SDK that's unmaintained creates security risk. Auto-generation from bad spec produces broken SDK. Hand-writing 50+ endpoints is prohibitively expensive.

---

## Related Rules

Wrap generated SDKs in service classes, Use Saloon for 3+ integrations

---

## Related Skills

Generate API Client SDKs

---

## Auto-Generated vs Hand-Written Code Management

---

## Decision Context

Managing the boundary between generated and hand-written code.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Will the generated SDK be modified?
↓
YES → NEVER modify generated files directly
  ↓
  Need custom behavior?
  ↓
  YES → Extend generated classes or wrap in service layer
  NO → Use generated code directly
NO → Keep generated files in separate directory/package
  ↓
  Is the generated SDK in the same repo?
  ↓
  YES → Separate directory with clear boundary (e.g., `sdk/`)
  NO → Separate package/repository for independent versioning
  ↓
  Pin generator version in CI?
  ↓
  YES → Consistent output across regenerations
  NO → Different versions produce different output — unpredictable changes

---

## Rationale

Modified generated code is lost on regeneration. Extension and wrapping preserve customizations while allowing regeneration. Pinned versions ensure consistent output.

---

## Recommended Default

**Default:** Separate package for generated SDK + service layer wrapping
**Reason:** Clean separation, independent versioning, regeneration-safe

---

## Risks Of Wrong Choice

Modifying generated code causes drift — changes lost on next regeneration. No version pinning causes unpredictable SDK changes on generator updates.

---

## Related Rules

Never modify generated code directly, Pin generator versions in CI

---

## Related Skills

Generate API Client SDKs

---

## SDK Versioning Strategy

---

## Decision Context

Versioning the SDK to match API versions and avoid breaking consumers.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the API have multiple versions (v1, v2)?
↓
YES → Version SDKs to match API versions
  ↓
  Breaking changes in new API version?
  ↓
  YES → New SDK major version; old SDK still available
  NO → Minor version bump for additive-only changes
NO → Is the SDK distributed as a package?
  ↓
  YES → Use semantic versioning for SDK releases
  NO → SDK version tied to application version
  ↓
  Multiple consumers of the SDK?
  ↓
  YES → Independent versioning per consumer migration schedule
  NO → Single version is simpler; coordinate updates

---

## Rationale

SDK versioning mirrors API versioning. Semantic versioning communicates breaking changes clearly. Independent SDK versions enable consumer-paced migration.

---

## Recommended Default

**Default:** SDK version matches API version with semver for SDK changes
**Reason:** Clear mapping between SDK and API; breaking changes are explicit

---

## Risks Of Wrong Choice

Unversioned SDK breaks consumers on regeneration. API version mismatch causes runtime errors.

---

## Related Rules

Keep generated SDKs in separate package with independent versioning

---

## Related Skills

Generate API Client SDKs
