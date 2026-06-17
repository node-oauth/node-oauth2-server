# Security Policy

This security policy covers the npm package [`@node-oauth/oauth2-server`](https://www.npmjs.com/package/@node-oauth/oauth2-server), maintained in the [`node-oauth/node-oauth2-server`](https://github.com/node-oauth/node-oauth2-server) repository.

Because this project is a security-sensitive OAuth 2.0 authorization server library (RFC 6749 / RFC 6750), we take vulnerability reports seriously and handle them under a coordinated-disclosure process. We are grateful to the security researchers who help keep this project and its users safe.

## Supported Versions

Security fixes are developed against the latest `5.x` release. To stay protected, keep your dependency up to date with the most recent published version.

| Version | Supported                                        |
|---------|--------------------------------------------------|
| 5.x.x   | :white_check_mark:                               |
| 4.x.x   | :white_check_mark: but only high-severity issues |
| 3.x.x   | :x:                                              |
| < 3     | :x:                                              |

The `5.x` line is actively maintained and receives all security fixes. The `4.x` line is a legacy line that receives backports for high-severity issues only. Versions `3.x` and older are unsupported and will not receive security updates.

## Reporting a Vulnerability

**Please report vulnerabilities privately using GitHub's private vulnerability reporting — do not open a public issue, pull request, or discussion for a security bug.** Public disclosure before a fix is available puts every user of the library at risk.

To report a vulnerability:

1. Open the **[Report a vulnerability](https://github.com/node-oauth/node-oauth2-server/security/advisories/new)** form directly, or go to the repository's **[Security tab](https://github.com/node-oauth/node-oauth2-server/security)** and click **"Report a vulnerability"**.
2. Fill in the title and description (only those two fields are required) and submit the report.

You will need to be signed in to GitHub. Submitting through this channel keeps the report private, notifies the maintainers directly, and automatically adds you as a collaborator on the draft advisory so we can discuss the issue with you and credit you when it is published.

Reports are handled by the maintainers, [Jan Küster (@jankapunkt)](https://github.com/jankapunkt) and [Dan Hensby (@dhensby)](https://github.com/dhensby).

## What to Include in a Report

To help us triage, reproduce, and fix the issue quickly, please include as much of the following as you can:

- A clear description of the vulnerability and its **security impact** — what an attacker can achieve by exploiting it.
- The **affected version(s)**, and if known the relevant commit or branch.
- **Steps to reproduce**, ideally with a minimal **proof of concept**.
- Any **configuration or environment** needed to trigger the issue (for example the grant types, model behaviour, or framework adapter in use).
- Optionally: a suggested fix or mitigation, your severity assessment, and whether you would like public credit in the advisory.

We need to be able to **reproduce** the vulnerability — just as we do with ordinary bug reports — before we can safely fix it, so clear reproduction steps and impact details are the most valuable thing you can provide.

## What Happens Next

1. **Acknowledgement & triage.** We confirm receipt of your report and begin assessing it privately through the GitHub security advisory.
2. **Reproduction.** We reproduce the issue to understand its impact and estimate severity. We may follow up with you for clarification or additional detail.
3. **Private fix.** A fix is developed in private — within the draft advisory or a temporary private fork — until we can confirm the vulnerability is closed. If you would like to help, let us know and we can collaborate on the fix in a private fork; only a maintainer can merge it.
4. **Validation.** All security fixes must pass the **full test suite and dependency audits** before they ship — a security fix is never released at the expense of correctness.
5. **Release.** Once a fix is ready, we publish a new release promptly and update the supported release lines as appropriate.
6. **Disclosure & credit.** We publish a GitHub Security Advisory (GHSA), request a CVE where warranted, and credit you for the report unless you ask otherwise. The project actively uses GitHub Security Advisories — for example, [GHSA-jhm7-29pj-4xvf](https://github.com/node-oauth/node-oauth2-server/security/advisories/GHSA-jhm7-29pj-4xvf) (CVE-2026-41213, a PKCE brute-force issue) was fixed in `5.3.0`.

## Disclosure Expectations

We follow **coordinated disclosure**. Please give us a reasonable opportunity to investigate and release a fix before disclosing the vulnerability publicly, and please do not share details — including via public issues, pull requests, or discussions — until a patched release is available and the advisory is published. We will keep you informed of our progress throughout, and we aim to resolve and disclose issues promptly.
