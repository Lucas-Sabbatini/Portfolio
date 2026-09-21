# --- CloudFront in front of the private S3 bucket ---

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${local.site_bucket}-oac"
  description                       = "OAC for ${local.site_bucket}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Keep the legacy public URL https://<domain>/cv working by rewriting it to the
# S3 object cv/cv.pdf.
resource "aws_cloudfront_function" "cv_rewrite" {
  name    = "lucasjanot-cv-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite /cv to /cv/cv.pdf"
  publish = true

  code = <<-EOT
    function handler(event) {
      var request = event.request;
      if (request.uri === '/cv' || request.uri === '/cv/') {
        request.uri = '/cv/cv.pdf';
      }
      return request;
    }
  EOT
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "lucasjanot static site"
  default_root_object = "index.html"
  aliases             = local.site_aliases
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.cv_rewrite.arn
    }
  }

  # index.html must never be cached long-lived; hashed /assets/* can be.
  ordered_cache_behavior {
    path_pattern           = "index.html"
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_disabled.id
  }

  # SPA fallback: unknown paths return the app shell.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.custom_domain_enabled ? false : true
    acm_certificate_arn            = var.custom_domain_enabled ? aws_acm_certificate.site[0].arn : null
    ssl_support_method             = var.custom_domain_enabled ? "sni-only" : null
    minimum_protocol_version       = var.custom_domain_enabled ? "TLSv1.2_2021" : null
  }

  tags = { Name = local.site_bucket }
}
