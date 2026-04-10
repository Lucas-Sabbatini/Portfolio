data "aws_caller_identity" "current" {}

# --- AMI: Amazon Linux 2023 ---

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# --- IAM Role (SSM + S3) ---

resource "aws_iam_role" "ec2" {
  name = "blog-ec2-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = { Name = "blog-ec2-role-${var.environment}" }
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "s3_uploads" {
  name = "blog-s3-uploads-${var.environment}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        aws_s3_bucket.uploads.arn,
        "${aws_s3_bucket.uploads.arn}/*"
      ]
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "blog-ec2-profile-${var.environment}"
  role = aws_iam_role.ec2.name
}

# --- EC2 Instance ---

resource "aws_instance" "blog" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = <<-EOF
#!/bin/bash
set -euo pipefail

# System updates
dnf update -y

# Install Docker
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user

# Install Docker Compose plugin
DOCKER_CLI_PLUGINS="/usr/local/lib/docker/cli-plugins"
mkdir -p "$DOCKER_CLI_PLUGINS"
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o "$DOCKER_CLI_PLUGINS/docker-compose"
chmod +x "$DOCKER_CLI_PLUGINS/docker-compose"

# Install SSM agent (not pre-installed on AL2023)
dnf install -y amazon-ssm-agent
systemctl enable --now amazon-ssm-agent

# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Create application directory
mkdir -p /opt/blog/nginx /opt/blog/certbot/conf /opt/blog/certbot/www
chown -R ec2-user:ec2-user /opt/blog
EOF

  tags = { Name = "blog-ec2-${var.environment}" }

  lifecycle {
    ignore_changes = [ami]
  }
}

# --- Elastic IP ---

resource "aws_eip" "blog" {
  instance = aws_instance.blog.id
  domain   = "vpc"

  tags = { Name = "blog-eip-${var.environment}" }
}
