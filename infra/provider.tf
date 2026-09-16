terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "lucasjanot-site"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ACM certificates used by CloudFront must live in us-east-1, regardless of
# the region the rest of the stack is deployed to.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "lucasjanot-site"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
