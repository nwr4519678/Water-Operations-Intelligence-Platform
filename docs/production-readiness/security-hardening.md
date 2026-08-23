# Security hardening and verification

## Configuration

Production connection strings, JWT signing keys, AI credentials, and Redis credentials
must be provided by the deployment secret store. Tracked appsettings files intentionally
contain empty secret values. A production startup with a missing database connection
string fails before migrations or background jobs are started.

Rotate any credential that has ever been committed or pasted into a ticket. Rotation is
an operational requirement and cannot be replaced by deleting the value from Git.

## Transport and headers

The API uses HTTPS redirection and HSTS outside Development. It emits
X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy,
Content-Security-Policy, X-Trace-Id, and X-API-Version headers.

Reverse proxies must forward X-Forwarded-For and X-Forwarded-Proto only from trusted
network boundaries. CORS origins are allow-listed; credentials are not accepted from
arbitrary origins.

## Abuse protection

The API applies a global per-IP limit of 300 requests/minute, with tighter auth and
search partitions. Rejections return HTTP 429 and Retry-After. File imports are capped
at 25 MB and require the admin role.

## Security verification

The release gate must include:

- secret scanning of tracked files;
- Swagger generation and route uniqueness validation;
- unauthorized and cross-tenant API tests;
- dependency vulnerability review;
- verification that production configuration is injected by the deployment platform.

Penetration testing must be executed against the deployed release candidate, with findings
tracked to closure before production promotion.
