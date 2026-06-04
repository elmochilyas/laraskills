# Anti-Patterns: Response Metadata, Links, and Includes

## Missing Self Links
**Description:** Resources returned without a self link, forcing clients to construct URLs.
**Better approach:** Every resource response includes a self link.

## Unrestricted Includes
**Description:** No allowlist for include parameter, allowing any relationship to be embedded.
**Better approach:** Explicit allowlist per resource.

## Sparse Fields As Authorization
**Description:** Using sparse field selection as an authorization mechanism.
**Better approach:** Authorization controls resource access. Sparse fields control field selection within authorized resources.
