# lucas.janot — Static Landing Page

A static personal landing page built with React + Vite, deployed to **S3 + CloudFront**.
There is no backend, no database, no blog, and no admin area — all copy lives in
the repo and the only dynamic asset is the CV (a PDF stored in S3).

> **Going to production?** Follow the step-by-step runbook in [`DEPLOY.md`](./DEPLOY.md).

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Hosting | S3 (private) + CloudFront (OAC) |
| File sharing | CV PDF at `s3://<bucket>/cv/cv.pdf`, served at `/cv` |
| Infra | Terraform |
| Analytics | None (CloudFront/CloudWatch metrics only) |

## Structure

```
.
├── src/                  # React app (single page)
│   ├── components/       # Navbar, Footer, landing sections
│   ├── data/content.ts   # ALL site copy (captured from the former API)
│   ├── pages/HomePage.tsx
│   └── types/
├── public/               # Static assets bundled into the build
├── infra/                # Terraform: S3, CloudFront, ACM, budget
└── .github/workflows/    # CI + deploy
```

## Development

```bash
npm install
npm run dev        # http://localhost:5173
```

### Checks

```bash
npm run lint       # ESLint (zero warnings tolerance)
npm run typecheck  # tsc --noEmit
npm test           # Vitest
npm run build      # tsc && vite build → dist/
```

> **Note:** `@testing-library/react` v16 needs `@testing-library/dom` explicitly,
> and npm 10.9.x has an arborist bug on the `vitest → jsdom → canvas` peer chain.
> A local `.npmrc` pins `legacy-peer-deps=true` to keep installs reproducible.

## Deployment

Pushing to `main` runs CI and then `.github/workflows/deploy.yml`, which:

1. Builds the site.
2. `aws s3 sync dist/ s3://<bucket>/ --delete --exclude "cv/*"`.
3. Invalidates the CloudFront cache (`/*`).

Required repository configuration (GitHub → Settings):

| Kind | Name | Purpose |
|---|---|---|
| Variable | `SITE_BUCKET` | Terraform output `site_bucket_name` |
| Variable | `CLOUDFRONT_DISTRIBUTION_ID` | Terraform output `cloudfront_distribution_id` |
| Variable | `VITE_CV_URL` | Usually `/cv` |
| Secret | `AWS_DEPLOY_ROLE_ARN` | IAM role assumed via GitHub OIDC |

### Updating the CV

```bash
aws s3 cp cv.pdf s3://<bucket>/cv/cv.pdf \
  --content-type application/pdf \
  --cache-control "public, max-age=3600"
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> --paths "/cv"
```

## Infrastructure (Terraform)

The stack is defined in `infra/` and uses its own state key
(`static/terraform.tfstate`) so the legacy EC2/RDS stack remains independently
manageable. See `infra/outputs.tf` for the values referenced above.

### First-time setup

```bash
cd infra
terraform init
terraform apply          # creates the bucket, OAC, CloudFront (*.cloudfront.net), ACM cert
```

### Custom domain (DNS is hosted at Hostinger)

1. `terraform output acm_validation_records` → add the CNAMEs at Hostinger.
2. Wait for the certificate to reach **ISSUED**.
3. Set `custom_domain_enabled = true` in `terraform.tfvars` and `terraform apply`.
4. Point `lucasjanot.com` / `www.lucasjanot.com` at
   `terraform output cloudfront_domain_name`.

> The apex record needs CNAME flattening (or an ALIAS/ANAME) at the DNS provider.
> Hostinger does not support flattening at the apex — moving DNS to Cloudflare
> (free) is the simplest fix and also unlocks free web analytics.

### Cost guard

Set `alert_email` in `terraform.tfvars` to enable a monthly AWS Budget alarm
(default budget `$5`). At realistic traffic CloudFront stays inside its
perpetual free tier (1 TB egress + 10M requests/month), so the bill is ~$0.

## Legacy stack

The former FastAPI + PostgreSQL + EC2 stack was removed from this repository.
Its Terraform state still exists at `s3://blog-terraform-state-474344786002/blog/terraform.tfstate`.
To reclaim the ~$34/month it costs, destroy it explicitly from a checkout of the
last commit that still contained `infra/rds.tf`, `infra/ec2.tf`, and
`infra/vpc.tf`:

```bash
git checkout <commit-before-migration> -- infra
cd infra && terraform init && terraform destroy
```

The uploads bucket also still holds the remaining blog covers/post-images; copy
`cv/cv.pdf` to the new site bucket before deleting it.
