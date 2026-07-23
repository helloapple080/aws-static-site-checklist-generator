# AWS Static Site Deployment Checklist

Project: Client Landing Page
Domain: client.example.com
Owner: Engineering Team
Environment: production
Generated at: 2026-07-20T01:00:54.233Z

## 1. Architecture and ownership

- [ ] Architecture diagram, data flow, trust boundaries and owner are documented
- [ ] Production and non-production accounts/resources are separated
- [ ] Required tags include owner, environment, project, cost center and data classification
- [ ] Expected traffic, availability target, RTO/RPO and budget assumptions are documented
- [ ] An ADR explains why S3 + CloudFront is appropriate and which alternatives were rejected

## 2. S3 origin

- [ ] Bucket name and AWS Region match the intended deployment target
- [ ] Block Public Access is enabled unless an explicitly reviewed exception exists
- [ ] CloudFront uses Origin Access Control; direct public object access is denied
- [ ] Default encryption and bucket-owner-enforced object ownership are configured
- [ ] Versioning, lifecycle, retention and deletion protection decisions are documented
- [ ] Bucket policy grants only the required CloudFront distribution and deployment role
- [ ] Access logging destination does not create a recursive logging loop

## 3. CloudFront and edge controls

- [ ] Viewer protocol policy redirects HTTP to HTTPS
- [ ] ACM certificate is valid, auto-renewable and created in the required Region
- [ ] Default root object and custom 4xx/5xx responses are configured
- [ ] Cache key, TTL, invalidation and immutable asset naming strategy are documented
- [ ] Compression and HTTP/2 or newer supported protocols are enabled
- [ ] Security headers policy covers CSP, HSTS, frame, MIME and referrer requirements
- [ ] Allowed HTTP methods are minimized
- [ ] AWS WAF and rate-based rules were evaluated against actual risk and cost
- [ ] CloudFront standard or real-time logging choice, redaction and retention are documented

## 4. DNS and domain lifecycle

- [ ] Route 53 alias/record points to the intended CloudFront distribution
- [ ] Apex and www/non-www canonical behavior is explicit
- [ ] DNS TTL and propagation/rollback plan are documented
- [ ] DNSSEC decision is recorded where supported
- [ ] Domain and certificate expiry ownership and alerts are assigned
- [ ] CAA records were evaluated

## 5. Application and browser security

- [ ] Build artifacts contain no secrets, source maps with sensitive source, or private endpoints
- [ ] User-controlled content is escaped for its rendering context
- [ ] CSP avoids unsafe-inline/unsafe-eval unless justified and reviewed
- [ ] Third-party scripts are minimized; SRI and vendor risk were evaluated
- [ ] CORS is absent unless needed; any policy uses explicit origins and minimum methods/headers
- [ ] Cookies, authentication and personal data are not introduced without a separate threat model
- [ ] Dependency, secret and artifact scans pass in CI

## 6. IAM and deployment supply chain

- [ ] Deployment uses a dedicated least-privilege role with short-lived credentials/OIDC
- [ ] Human long-lived access keys are not used by CI
- [ ] CI workflow permissions are explicitly minimized
- [ ] Dependencies and CI actions are locked and automatically reviewed for updates
- [ ] Build provenance/artifact integrity strategy is documented for the project risk level
- [ ] CloudTrail coverage and security incident ownership are confirmed

## 7. Verification and launch readiness

- [ ] Unit, integration, end-to-end and security checks pass with recorded evidence
- [ ] Home page, critical routes, assets and custom 404 behavior pass smoke tests
- [ ] TLS, redirect, security headers and cache headers are independently verified
- [ ] Accessibility, responsive layout, SEO and social metadata checks pass
- [ ] Browser console and network requests contain no production errors or mixed content
- [ ] Load/performance targets are measured rather than assumed
- [ ] Rollback and CloudFront invalidation procedures were exercised in a safe environment

## 8. Observability and incident response

- [ ] Structured application/build/deployment logs include correlation or deployment IDs
- [ ] Logs exclude credentials, cookies, personal data and sensitive query strings
- [ ] CloudFront/S3 metrics, dashboards and alert thresholds match stated SLOs
- [ ] Synthetic availability checks cover the domain and at least one critical route
- [ ] Alerts have an owner, severity, runbook and tested delivery path
- [ ] Log retention, access control and estimated ingestion/storage cost are documented
- [ ] Incident response and customer/status communication paths are documented

## 9. Reliability, recovery and cost

- [ ] S3 versioning or another artifact rollback mechanism is enabled and tested
- [ ] Cross-Region replication is based on RTO/RPO evidence, not enabled by habit
- [ ] Backup/restore responsibility for source, build artifacts and configuration is explicit
- [ ] AWS Budgets/Cost Anomaly Detection and owner notifications are configured if appropriate
- [ ] CloudFront price class, log volume, invalidations and data transfer costs are estimated
- [ ] Quotas and dependency failure modes are documented
- [ ] A post-launch review window and rollback decision owner are assigned

## 10. Final evidence

- [ ] Resource IDs, configuration exports, test reports and deployment version are recorded
- [ ] Exceptions include risk owner, reason and expiry/review date
- [ ] No unchecked item is silently treated as compliant
- [ ] Final sign-off identifies engineering, security and business owners appropriate to project risk
