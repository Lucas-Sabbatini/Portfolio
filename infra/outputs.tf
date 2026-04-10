output "ec2_public_ip" {
  description = "Elastic IP address of the EC2 instance"
  value       = aws_eip.blog.public_ip
}

output "ec2_instance_id" {
  description = "EC2 instance ID (for SSM Session Manager)"
  value       = aws_instance.blog.id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.blog.address
}

output "s3_bucket_name" {
  description = "S3 bucket name for uploads"
  value       = aws_s3_bucket.uploads.id
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.blog.id
}
