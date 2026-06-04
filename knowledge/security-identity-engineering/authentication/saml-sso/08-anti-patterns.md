# Anti-Patterns: SAML 2.0 SSO

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | SAML 2.0 SSO |
| Audience | Architects, Developers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SA-01 | Skipped Assertion Signature Validation | Critical | High | Medium |
| AP-SA-02 | Hardcoded IdP Endpoints | High | Medium | Medium |
| AP-SA-03 | Ignored Certificate Expiry | Critical | High | Medium |
| AP-SA-04 | No Replay Prevention | Critical | Medium | Low |
| AP-SA-05 | Single IdP Testing Fallacy | High | High | High |

---

## Repository-Wide Anti-Patterns

- **Missing Clock Skew**: Strict timestamp validation without 5-minute grace window causes intermittent SSO failures
- **Hardcoded ACS URL**: Not using `route()` helper generates brittle SAML configuration  
- **No IdP-Initiated SSO Support**: Enterprise users expecting portal-based app launch find the flow broken

---

## 1. Skipped Assertion Signature Validation

### Category
Security · Critical

### Description
Accepting SAML assertions without validating the XML signature against the IdP's certificate, trusting only HTTPS transport for security.

### Why It Happens
Developers unfamiliar with SAML's XML signature model assume HTTPS protects the assertion in transit. Manual assertion parsing code may skip signature verification because it's complex to implement. SocialiteProviders/Saml2 does validate by default, but custom implementations rarely do.

### Warning Signs
- Manual SAML assertion parsing without signature verification calls
- Custom SAML code that uses `$request->input('SAMLResponse')` directly
- No certificate configuration or JWKS-like key discovery
- Assertion processing code that only extracts attributes without verifying origin

### Why Harmful
SAML assertions contain identity claims that grant access to your application. Without signature verification, anyone who can craft an XML document can impersonate any user. The XML signature is the only mechanism that proves the assertion came from the trusted IdP and was not modified.

### Real-World Consequences
- Attacker sends a forged SAML assertion via POST to ACS URL — gains admin access
- Man-in-the-middle on a compromised network injects a fake SAML response
- SAML vulnerability (CVE-2017-11429, CVE-2018-0489) exploitation succeeds because signature check is missing
- Penetration test discovers "SAML signature validation missing — critical"

### Preferred Alternative
Always validate the XML signature against the IdP's certificate using SocialiteProviders/Saml2 or similar library.

### Refactoring Strategy
1. Remove manual assertion parsing code
2. Use SocialiteProviders/Saml2 package which handles signature validation
3. Configure the IdP certificate in the SAML service configuration
4. Test with a forged assertion to verify rejection
5. Add monitoring for signature validation failures

### Detection Checklist
- [ ] Is there custom SAML assertion parsing code?
- [ ] Is `SocialiteProviders/Saml2` or similar package being used?
- [ ] Can a forged assertion be POSTed to the ACS URL?
- [ ] Is the IdP certificate configured and referenced in validation code?

### Related Rules/Skills/Trees
- Always Validate SAML Assertion XML Signature (05-rules.md)
- Implement SAML 2.0 SSO (06-skills.md)
- SAML vs OIDC vs WorkOS decision tree (07-decision-trees.md)

---

## 2. Hardcoded IdP Endpoints

### Category
Maintainability · Reliability

### Description
Manually configuring IdP SSO URL, logout URL, and certificate in the SAML configuration instead of importing IdP metadata XML.

### Why It Happens
Tutorial snippets and documentation often show individual configuration values. Developers copy these into `config/services.php` without discovering the metadata import feature. Each IdP change requires manual config updates.

### Warning Signs
- Individual `idp_sso`, `idp_cert`, `idp_logout` keys in SAML config
- No `metadata` configuration key pointing to IdP metadata URL or file
- After IdP certificate rotation, SSO fails with signature validation errors
- IdP endpoint URLs hardcoded per environment

### Why Harmful
IdP metadata XML contains all configuration — endpoints, certificates, bindings — in a standardized format. Manual configuration duplicates this information and drifts from the source of truth. When the IdP rotates its certificate or changes an endpoint URL, the hardcoded config breaks SSO until manually updated.

### Real-World Consequences
- Azure AD certificate auto-rotation breaks SSO until developer manually updates the cert
- Okta org URL migration requires emergency config update across all environments
- Enterprise customer's IdP administrator changes SSO endpoint — on-call engineer must fix config
- Multi-tenant IdP support becomes impossible — each IdP requires separate URL configuration

### Preferred Alternative
Import IdP metadata XML from URL or file path.

### Refactoring Strategy
1. Obtain IdP metadata XML URL from the enterprise IdP administrator
2. Update SAML config to use metadata URL instead of individual endpoints
3. Test SP-initiated and IdP-initiated flows
4. Add a monitoring check that verifies metadata is still accessible

### Detection Checklist
- [ ] Does `config/services.php` use `metadata` key or individual endpoint keys?
- [ ] Can the IdP rotate its certificate without breaking your SSO?
- [ ] Is the metadata URL accessible from your application server?
- [ ] Are multi-tenant IdPs supported through per-tenant metadata or individual config?

### Related Rules/Skills/Trees
- Import IdP Metadata Instead of Manual Configuration (05-rules.md)
- Metadata Management Strategy decision tree (07-decision-trees.md)

---

## 3. Ignored Certificate Expiry

### Category
Reliability · Security

### Description
Not monitoring IdP certificate expiration or having a process to update the IdP certificate when it rotates, causing SSO to fail when the certificate expires.

### Why It Happens
SAML is set up once and rarely revisited. Certificate expiry dates are far in the future (1-5 years) and easily forgotten. Teams have no monitoring for certificate expiration because they don't expect it to be a recurring maintenance task.

### Warning Signs
- No scheduled check for IdP certificate expiry
- SAML configuration was set up more than a year ago without changes
- SSO works fine until one day it doesn't — no code changes deployed
- Support ticket: "SSO stopped working" around the same time IdP certificates rotated

### Why Harmful
When the IdP's signing certificate expires, the IdP rotates to a new certificate. The application still uses the old certificate for signature validation, so all SAML assertions fail validation. Every user relying on SAML SSO is locked out until the certificate is updated. This is a complete SSO outage with no degraded mode.

### Real-World Consequences
- Monthly Azure AD certificate rotation catches team off-guard — 2-hour SSO outage
- Annual Okta certificate renewal — emergency rotation, all hands on deck
- Enterprise customer cannot log in during a critical business period
- Incident response requires digging through IdP documentation to find renewal process

### Preferred Alternative
Schedule certificate expiry monitoring and automate updates where possible.

### Refactoring Strategy
1. Extract the IdP certificate expiry date from the imported metadata
2. Schedule a daily command that checks the remaining validity period
3. Send alert 30 days before expiry to the operations team
4. For metadata URL imports, test that re-fetching metadata picks up rotated certificates
5. Document the manual certificate update process for IdPs that don't support metadata URL

### Detection Checklist
- [ ] Is there a scheduled check for IdP certificate expiry?
- [ ] When does the current IdP certificate expire?
- [ ] Has the team ever rotated the IdP certificate?
- [ ] Is certificate rotation documented in the runbook?
- [ ] Does metadata URL import automatically pick up new certificates?

### Related Rules/Skills/Trees
- Monitor IdP Certificate Expiry and Automate Renewal (05-rules.md)
- Metadata Management Strategy decision tree (07-decision-trees.md)

---

## 4. No Replay Prevention

### Category
Security · Critical

### Description
Not tracking processed SAML assertion IDs, allowing an intercepted assertion to be replayed for unauthorized authentication.

### Why It Happens
Developers may not consider replay attacks in the SAML flow. SocialiteProviders/Saml2 provides assertion processing but does not enforce replay prevention out of the box — it must be implemented separately.

### Warning Signs
- SAML callback code processes assertions without checking if they've been used before
- No `processed_assertions` or similar database table
- The same SAML response can be POSTed multiple times to authenticate repeatedly
- No error when reusing the same `SAMLResponse` value

### Why Harmful
SAML assertions can be captured by an attacker through network interception, browser history, or compromised client devices. Without replay prevention, the captured assertion can be replayed to authenticate as the victim indefinitely. The assertion proves authentication at a point in time, but without ID tracking, it proves it forever.

### Real-World Consequences
- Attacker captures SAML response from browser devtools, replays it to authenticate
- Network-level interception of SAML response allows persistent unauthorized access
- Penetration test finds "SAML assertion replay — critical" 
- Compliance auditors flag missing replay prevention as a SAML security finding

### Preferred Alternative
Store processed assertion IDs and reject duplicates.

### Refactoring Strategy
1. Create a `processed_assertions` database table (assertion_id, processed_at)
2. Extract the assertion ID from the SAML response on callback
3. Check if assertion ID exists in the table; reject if found
4. Store the assertion ID with a timestamp
5. Prune old processed assertions periodically (they expire with the session)

### Detection Checklist
- [ ] Can the same SAML response be used to authenticate twice?
- [ ] Is there a `processed_assertions` or equivalent tracking mechanism?
- [ ] Are assertion IDs extracted and checked on every callback?
- [ ] Do old processed assertions get pruned?

### Related Rules/Skills/Trees
- Implement Replay Prevention for SAML Assertions (05-rules.md)
- Validate Audience Restriction Against SP Entity ID (05-rules.md)

---

## 5. Single IdP Testing Fallacy

### Category
Testing · Reliability

### Description
Testing SAML SSO integration against only one IdP (e.g., Keycloak) and deploying to production where customers use different IdPs (Azure AD, Okta, ADFS).

### Why It Happens
Development teams typically set up a single IdP (often Keycloak or a test Okta instance) for local testing. They assume SAML is standardized enough that "works on one = works on all." Budget and time constraints prevent per-IdP testing.

### Warning Signs
- SAML integration tested only with Keycloak locally
- No test fixtures or environments for different IdPs
- Enterprise customers report SSO failures specific to their IdP
- Azure AD-specific issues (different NameID format, attribute naming) surface in production

### Why Harmful
IdPs implement SAML with significant variations: NameID format (persistent vs transient vs emailAddress), attribute naming (Azure AD uses `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` while Okta uses `Email`), binding types (HTTP-POST vs HTTP-Redirect), and metadata structure. An integration that works perfectly with Keycloak can fail completely with Azure AD or ADFS.

### Real-World Consequences
- Azure AD customer cannot log in — NameID format mismatch
- Okta customer gets 500 error — attribute mapping not configured
- ADFS customer reports "page never loads" — binding type incompatibility
- Sales loses deal because SSO integration only works with one IdP

### Preferred Alternative
Maintain test fixtures or environments for each supported IdP.

### Refactoring Strategy
1. Create test fixtures (SAML responses) for each IdP your customers use
2. Implement IdP-specific attribute mapping/transformation
3. Set up test accounts on each IdP (free tiers available for Okta, Azure AD)
4. Add IdP-specific test cases to CI/CD pipeline
5. Document per-IdP configuration differences

### Detection Checklist
- [ ] How many IdPs has the SAML integration been tested against?
- [ ] Are there test fixtures for the most common IdPs (Azure AD, Okta, Keycloak)?
- [ ] Does the CI pipeline test against multiple IdP configurations?
- [ ] Is there an IdP-specific attribute mapping layer?

### Related Rules/Skills/Trees
- Test With Each Specific IdP Variant (05-rules.md)
- Implement SAML 2.0 SSO (06-skills.md)
- SAML vs OIDC vs WorkOS decision tree (07-decision-trees.md)
