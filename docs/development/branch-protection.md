# Main branch protection

The repository code owner is `@nwr4519678`, configured in `.github/CODEOWNERS`.

Configure the `main` branch protection rule in GitHub with:

1. Require a pull request before merging.
2. Require at least one approving review.
3. Require review from Code Owners.
4. Dismiss stale approvals when new commits are pushed.
5. Require status checks to pass before merging.
6. Require branches to be up to date before merging.
7. Restrict direct pushes to `main`.
8. Disable administrator bypass if the organization policy allows it.

The repository ruleset is stored at `.github/rulesets/main-maximum-protection-ruleset.json`. It requires the `backend`, `frontend`, `ai-service`, and `data-engineering` GitHub Actions jobs.

`CODEOWNERS` assigns `@nwr4519678`; GitHub branch protection enforces that the approval is required. The repository file alone cannot enable remote branch protection settings.
