output "site_bucket_name" {
  description = "S3 bucket holding the static build and cv/cv.pdf"
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain (*.cloudfront.net)"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN (us-east-1)"
  value       = aws_acm_certificate.site[0].arn
}

output "acm_validation_records" {
  description = "CNAME records to add at the DNS provider (Hostinger) to validate the certificate"
  value = [
    for d in aws_acm_certificate.site[0].domain_validation_options : {
      name  = d.resource_record_name
      type  = d.resource_record_type
      value = d.resource_record_value
    }
  ]
}
