variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region for the S3 origin and provider"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Apex domain served by CloudFront (e.g. lucasjanot.com)"
  type        = string
  default     = "lucasjanot.com"
}

variable "custom_domain_enabled" {
  description = <<-EOT
    Attach the ACM certificate and custom-domain aliases to CloudFront.
    Keep false until the ACM validation CNAMEs have been added at the DNS
    provider (Hostinger) and the certificate is ISSUED, otherwise CloudFront
    rejects the alias.
  EOT
  type        = bool
  default     = false
}

variable "alert_email" {
  description = "Email address for the monthly cost budget alarm (empty disables it)"
  type        = string
  default     = ""
}

variable "monthly_budget_usd" {
  description = "Monthly cost budget in USD"
  type        = string
  default     = "5"
}
