# Remote state storage in S3 with DynamoDB locking.
#
# This stack uses its own state key ("static/terraform.tfstate") so the legacy
# EC2/RDS stack (key "blog/terraform.tfstate") can still be inspected and
# destroyed independently.
#
# BOOTSTRAP (already done for this account):
#   aws s3api create-bucket --bucket blog-terraform-state-474344786002 --region us-east-1
#   aws s3api put-bucket-versioning --bucket blog-terraform-state-474344786002 \
#     --versioning-configuration Status=Enabled
#   aws dynamodb create-table \
#     --table-name blog-terraform-lock \
#     --attribute-definitions AttributeName=LockID,AttributeType=S \
#     --key-schema AttributeName=LockID,KeyType=HASH \
#     --billing-mode PAY_PER_REQUEST \
#     --region us-east-1

terraform {
  backend "s3" {
    bucket         = "blog-terraform-state-474344786002"
    key            = "static/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "blog-terraform-lock"
  }
}
