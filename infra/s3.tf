# --- S3 Bucket for uploads ---

resource "aws_s3_bucket" "uploads" {
  bucket = "blog-uploads-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = { Name = "blog-uploads-${var.environment}" }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- VPC Gateway Endpoint for S3 ---
# EC2 traffic to S3 stays within AWS network (no internet transit)

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.blog.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  route_table_ids = [aws_route_table.public.id]

  tags = { Name = "blog-s3-endpoint-${var.environment}" }
}
