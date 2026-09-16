# TLS certificate for the custom domain. CloudFront requires the certificate
# to live in us-east-1.
#
# DNS for lucasjanot.com is hosted at Hostinger, so validation records cannot
# be created by Terraform. After the first apply, add the CNAMEs from the
# `acm_validation_records` output at the DNS provider, wait for ISSUED, then
# set custom_domain_enabled = true and apply again.

resource "aws_acm_certificate" "site" {
  count = 1

  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = var.domain_name }
}
