#!/usr/bin/env bash
#
# Manual deploy for lucasjanot.com.
#
# Builds the Vite site, syncs it to the S3 origin, and invalidates CloudFront.
# This replaces the former GitHub Actions pipeline (removed 2026-09-16).
#
# Prerequisites:
#   - AWS credentials in the environment. This account authenticates via
#     `aws login`, which Terraform and the CLI can read through the
#     `terraform` profile defined in ~/.aws/config:
#         export AWS_PROFILE=terraform
#     (or run: aws login, then eval "$(aws configure export-credentials --format env)")
#   - npm dependencies installed (npm ci)
#
# Usage:
#   ./deploy.sh              # full build + deploy
#   ./deploy.sh --no-build   # skip the build, sync the existing dist/
#
set -euo pipefail

cd "$(dirname "$0")"

SKIP_BUILD=0
[[ "${1:-}" == "--no-build" ]] && SKIP_BUILD=1

# Resolve targets from Terraform state so the script never hardcodes account
# details. Override with SITE_BUCKET / CLOUDFRONT_DISTRIBUTION_ID if needed.
BUCKET="${SITE_BUCKET:-$(cd infra && terraform output -raw site_bucket_name)}"
DIST_ID="${CLOUDFRONT_DISTRIBUTION_ID:-$(cd infra && terraform output -raw cloudfront_distribution_id)}"

if [[ -z "$BUCKET" || -z "$DIST_ID" ]]; then
  echo "ERROR: could not resolve SITE_BUCKET / CLOUDFRONT_DISTRIBUTION_ID." >&2
  echo "       Check that AWS credentials are valid and 'terraform output' works in infra/." >&2
  exit 1
fi

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "==> Building (npm run build)"
  npm run build
else
  echo "==> Skipping build; deploying existing dist/"
fi

# --delete keeps the bucket in sync with the build, but --exclude cv/ protects
# the shared CV object (cv/cv.pdf), which lives outside the build entirely.
echo "==> Syncing dist/ -> s3://$BUCKET/  (cv/ left untouched)"
aws s3 sync dist/ "s3://$BUCKET/" --delete --exclude "cv/*"

# CloudFront caches the site, so the edge must be told to drop it. The root
# path (/) is served under the default cache policy, so "/*" is required.
echo "==> Invalidating CloudFront ($DIST_ID)"
INVALIDATION=$(aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' --output text)
echo "    invalidation: $INVALIDATION"

echo
echo "==> Done. https://lucasjanot.com"
