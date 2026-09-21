# Production Runbook — Static Landing Page

Step-by-step guide to take this repository from "merged code" to a live site on
**S3 + CloudFront**, with the CV still served from S3 and the legacy EC2/RDS
stack retired.

Work top to bottom. Each phase ends with a **verify** step — do not continue
until it passes.

- **AWS account:** `474344786002`
- **Domain:** `lucasjanot.com` (DNS at **Hostinger** — `dns-parking.com`)
- **Terraform state:** `s3://blog-terraform-state-474344786002/static/terraform.tfstate`
- **Legacy stack state:** `s3://blog-terraform-state-474344786002/blog/terraform.tfstate`

## Target architecture

```
                    ┌──────────────────────────────┐
  Browser ──HTTPS──▶│  CloudFront (PriceClass_100) │
                    └───────────────┬──────────────┘
                                    │ OAC (SigV4, private origin)
                                    ▼
                    ┌──────────────────────────────┐
                    │  S3  lucasjanot-site-prod-…  │
                    │   index.html / assets/*      │  ← Vite build
                    │   cv/cv.pdf                  │  ← file sharing
                    └──────────────────────────────┘

  /cv  ──(CloudFront Function)──▶  /cv/cv.pdf
```

---

## Phase 0 — Prerequisites

| Requirement | Check |
|---|---|
| AWS CLI v2, authenticated as an admin | `aws sts get-caller-identity` |
| Terraform ≥ 1.5 | `terraform -version` |
| Node 20+ | `node -version` |
| Repo checked out on the migration commit | `git log --oneline -1` |
| Access to Hostinger DNS for `lucasjanot.com` | log in to hPanel → DNS Zone |
| The legacy `cv/cv.pdf` is still in the old bucket | see Phase 5 |

One-time bootstrap for the Terraform backend is **already done** in this
account (state bucket `blog-terraform-state-474344786002` + DynamoDB lock table
`blog-terraform-lock`). Confirm:

```bash
aws s3 ls s3://blog-terraform-state-474344786002/blog/terraform.tfstate
aws dynamodb describe-table --table-name blog-terraform-lock \
  --query 'Table.TableStatus' --output text
```

---

## Phase 1 — Provision the new stack (CloudFront default domain)

The first apply intentionally **does not** attach the custom domain
(`custom_domain_enabled = false`). This lets CloudFront come up immediately on
its `*.cloudfront.net` URL while the certificate validates.

### 1.1 Configure variables

```bash
cd infra
cat > terraform.tfvars <<'EOF'
environment           = "production"
aws_region            = "us-east-1"
domain_name           = "lucasjanot.com"
custom_domain_enabled = false
alert_email           = "you@example.com"   # enables the monthly budget alarm
monthly_budget_usd    = "5"
EOF
```

> `terraform.tfvars` is git-ignored. `alert_email` is optional but recommended.

### 1.2 Init, plan, apply

```bash
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

This creates:
- the private S3 bucket `lucasjanot-site-production-474344786002`
- a CloudFront OAC + distribution
- a CloudFront Function (`/cv` → `/cv/cv.pdf`)
- an ACM certificate (DNS validation, `us-east-1`)
- a monthly AWS Budget

Distribution creation takes **~5–15 minutes**. Capture the outputs:

```bash
terraform output
```

### ✅ Verify Phase 1

```bash
CF=$(terraform output -raw cloudfront_domain_name)
curl -sI "https://$CF" | head -1        # HTTP/2 404 or 403 → mapped to index.html (site not uploaded yet)
curl -sI "https://$CF/cv" | head -1     # 404 until the CV is uploaded (Phase 5)
```

A 404/403 here is expected — the bucket is still empty. The important part is
that CloudFront answers over HTTPS.

---

## Phase 2 — Validate the TLS certificate (Hostinger)

```bash
terraform output -json acm_validation_records
```

For **each** record, add a CNAME at Hostinger → hPanel → Domains → DNS Zone:

| Field | Value |
|---|---|
| Type | `CNAME` |
| Name | the record `name` (Hostinger usually wants it **without** the trailing `.`) |
| Target / Points to | the record `value` |

Wait until the certificate is issued (usually 5–30 min):

```bash
aws acm list-certificates --region us-east-1 \
  --query 'CertificateSummaryList[?DomainName==`lucasjanot.com`].[Status]' --output text
# expect: ISSUED
```

### ✅ Verify Phase 2

Status is `ISSUED`. Re-run the command after a few minutes if it still says
`PENDING_VALIDATION`.

---

## Phase 3 — Attach the custom domain

```bash
cd infra
sed -i '' 's/custom_domain_enabled = false/custom_domain_enabled = true/' terraform.tfvars
terraform apply
```

Then point DNS at CloudFront:

```bash
terraform output -raw cloudfront_domain_name
```

At Hostinger, add:

| Type | Name | Target |
|---|---|---|
| CNAME | `www` | `<distribution>.cloudfront.net` |

### ⚠️ Apex domain caveat

`lucasjanot.com` (no `www`) cannot be a plain CNAME, and Hostinger does **not**
support CNAME flattening / ALIAS / ANAME at the apex. Pick one:

- **(Recommended) Move DNS to Cloudflare (free).** Cloudflare flattens the apex
  CNAME to CloudFront, adds free analytics, and gives faster propagation.
  Change the registrar nameservers, recreate the two validation CNAMEs +
  the `www` CNAME + an apex `CNAME` to the CloudFront domain (Cloudflare flattens it).
- **Hostinger only:** keep `www` on CloudFront and add a redirect from the apex
  to `www` (Hostinger's redirect tool or a tiny CloudFront Function).

### ✅ Verify Phase 3

```bash
curl -sI https://www.lucasjanot.com | head -1      # HTTP/2 200 once the site is uploaded
curl -s https://www.lucasjanot.com | grep -o "<title>.*</title>"
```

---

## Phase 4 — Configure GitHub Actions (OIDC deploy role)

The deploy workflow assumes an IAM role via GitHub OIDC — no long-lived keys.

### 4.1 Create the OIDC provider (once per account)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

If it already exists, skip (an `EntityAlreadyExists` error is fine).

### 4.2 Create the deploy role

Set these to the values from `terraform output`:

```bash
BUCKET=lucasjanot-site-production-474344786002
DIST_ID=$(cd infra && terraform output -raw cloudfront_distribution_id)
```

```bash
cat > /tmp/trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::474344786002:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:Lucas-Sabbatini/Portfolio:ref:refs/heads/main",
            "repo:Lucas-Sabbatini/Portfolio:environment:CD"
          ]
        }
      }
    }
  ]
}
EOF

cat > /tmp/perms.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::$BUCKET"
    },
    {
      "Sid": "WriteObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::$BUCKET/*"
    },
    {
      "Sid": "InvalidateCache",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
      "Resource": "arn:aws:cloudfront::474344786002:distribution/$DIST_ID"
    }
  ]
}
EOF

aws iam create-role \
  --role-name github-actions-deploy-lucasjanot \
  --assume-role-policy-document file:///tmp/trust.json

aws iam put-role-policy \
  --role-name github-actions-deploy-lucasjanot \
  --policy-name deploy \
  --policy-document file:///tmp/perms.json

echo "role arn: arn:aws:iam::474344786002:role/github-actions-deploy-lucasjanot"
```

### 4.3 Repository configuration

GitHub → repo → **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
|---|---|---|
| Variable | `SITE_BUCKET` | `terraform output -raw site_bucket_name` |
| Variable | `CLOUDFRONT_DISTRIBUTION_ID` | `terraform output -raw cloudfront_distribution_id` |
| Variable | `VITE_CV_URL` | `/cv` |
| Secret | `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::474344786002:role/github-actions-deploy-lucasjanot` |

Also create an **Environment** named `CD` (Settings → Environments) — the deploy
job targets it.

### ✅ Verify Phase 4

`aws iam get-role --role-name github-actions-deploy-lucasjanot` returns the role,
and all four GitHub values are present.

---

## Phase 5 — Upload the CV (file sharing)

The CV currently lives in the legacy bucket. Copy it to the new one:

```bash
BUCKET=lucasjanot-site-production-474344786002

aws s3 cp \
  s3://blog-uploads-production-474344786002/cv/cv.pdf \
  s3://$BUCKET/cv/cv.pdf \
  --content-type application/pdf \
  --cache-control "public, max-age=3600"

# sanity check
aws s3 ls s3://$BUCKET/cv/
```

### ✅ Verify Phase 5

```bash
CF=$(cd infra && terraform output -raw cloudfront_domain_name)
curl -sI "https://$CF/cv" | head -1                 # HTTP/2 200
curl -sI "https://$CF/cv" | grep -i content-type    # application/pdf
curl -s "https://$CF/cv" -o /tmp/cv.pdf && file /tmp/cv.pdf   # PDF document
```

---

## Phase 6 — Deploy the site

### Option A — via GitHub Actions (normal path)

```bash
git push origin feat/static-landing      # open a PR, merge to main → deploy runs
```

The `Deploy` workflow: runs CI → `npm run build` → `aws s3 sync dist/ --delete
--exclude "cv/*"` → CloudFront invalidation.

### Option B — manual first cut (if you want to front-load it)

```bash
npm ci && npm run build

BUCKET=lucasjanot-site-production-474344786002
DIST_ID=$(cd infra && terraform output -raw cloudfront_distribution_id)

aws s3 sync dist/ "s3://$BUCKET/" --delete --exclude "cv/*"
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" --paths "/*"
```

### ✅ Verify Phase 6

```bash
CF=$(cd infra && terraform output -raw cloudfront_domain_name)
curl -s "https://$CF" | grep -o "<title>.*</title>"          # <title>Lucas Janot</title>
curl -sI "https://$CF/research-topology.webp" | head -1      # 200
curl -s "https://$CF" | grep -c "Engineering"                # ≥1 (hero copy present)
```

Then check the custom domain: `https://www.lucasjanot.com`.

Manual smoke test:
- [ ] Hero renders with status badge and both CTAs.
- [ ] `Work / Research / Experience / Contact` nav anchors scroll.
- [ ] The **CV** button opens the PDF.
- [ ] Contact email copies to clipboard.
- [ ] No console errors; no requests to `/api/*` (there is no API).

---

## Phase 7 — Decommission the legacy stack (~$34/month)

Only after the new site is verified. The legacy state is separate, so destroy it
from a checkout that still contains its Terraform.

```bash
# from a clean clone / worktree
git worktree add /tmp/legacy cec2e9e
cd /tmp/legacy/infra
terraform init
terraform plan -destroy        # review: EC2, EIP, RDS, VPC, SGs, S3 (blog-uploads), endpoint
terraform destroy
```

> ⚠️ The legacy `blog-uploads-production-…` bucket is **also** in that state.
> Confirm `cv/cv.pdf` was copied in Phase 5 before destroying, and export any
> other objects you still want:
> `aws s3 sync s3://blog-uploads-production-474344786002 /tmp/legacy-uploads-backup`

### ✅ Verify Phase 7

```bash
aws ec2 describe-instances --filters Name=instance-state-name,Values=running \
  --query 'Reservations[].Instances[].InstanceId' --output text   # empty
aws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier' --output text  # empty
```

Next month's bill should be **~$0–1**.

---

## Rollback

| Failure | Action |
|---|---|
| Bad deploy (files wrong) | Re-run `Deploy` on the previous commit, or `aws s3 sync` an older `dist/` |
| CloudFront serving stale | `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"` |
| Custom domain broken | Set `custom_domain_enabled = false` and `terraform apply` — CloudFront falls back to its default cert; revert DNS |
| Need the old site back | The legacy stack still exists until Phase 7; repoint DNS to `44.194.42.75` |

---

## Ongoing operations

### Update page copy

Edit `src/data/content.ts` → commit → merge. CI/CD deploys automatically.

### Update the CV

```bash
BUCKET=lucasjanot-site-production-474344786002
aws s3 cp cv.pdf "s3://$BUCKET/cv/cv.pdf" \
  --content-type application/pdf --cache-control "public, max-age=3600"
aws cloudfront create-invalidation \
  --distribution-id "$(cd infra && terraform output -raw cloudfront_distribution_id)" \
  --paths "/cv"
```

### Change infrastructure

```bash
cd infra && terraform plan && terraform apply
```

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| CloudFront returns 403 for everything | Bucket policy / OAC mismatch. `terraform apply`; confirm the policy references the distribution ARN. |
| `terraform apply` errors on the ACM cert | `custom_domain_enabled = true` before the cert is `ISSUED`. Set it back to `false`, validate, retry. |
| Apex `lucasjanot.com` doesn't resolve | Hostinger can't flatten apex CNAMEs → use `www` or move DNS to Cloudflare (Phase 3). |
| Deploy fails with `AccessDenied` on `s3:PutObject` | OIDC trust `sub` doesn't match. If the job uses `environment: CD`, the claim is `repo:…:environment:CD`. |
| Old images still shown after deploy | Invalidation pending; wait ~1 min or run it manually. |
| `npm ci` fails with `edgesOut` / missing peer | The repo `.npmrc` sets `legacy-peer-deps=true`; ensure it isn't overridden in CI. |
| CV 404 at `/cv` | Object isn't at `cv/cv.pdf` (case-sensitive), or the CloudFront Function isn't published. |

---

## Cost reference

| Component | Expected |
|---|---|
| CloudFront | **$0** (free tier: 1 TB egress + 10M req/mo) |
| S3 storage (~1 MB) | **$0.00** |
| ACM certificate | **$0** |
| AWS Budget alarm | **$0** |
| **Total** | **~$0–1 / month** (legacy stack was ~$34) |
