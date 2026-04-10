# --- EC2 Security Group ---

resource "aws_security_group" "ec2" {
  name        = "blog-ec2-sg-${var.environment}"
  description = "EC2: HTTPS + Tailscale inbound, all outbound"
  vpc_id      = aws_vpc.blog.id

  tags = { Name = "blog-ec2-sg-${var.environment}" }
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.ec2.id
  description       = "HTTPS from anywhere"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.ec2.id
  description       = "HTTP for Lets Encrypt ACME and redirect"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "tailscale" {
  security_group_id = aws_security_group.ec2.id
  description       = "Tailscale WireGuard"
  ip_protocol       = "udp"
  from_port         = 41641
  to_port           = 41641
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "ec2_all_out" {
  security_group_id = aws_security_group.ec2.id
  description       = "All outbound traffic"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# --- RDS Security Group ---

resource "aws_security_group" "rds" {
  name        = "blog-rds-sg-${var.environment}"
  description = "RDS: PostgreSQL from EC2 only"
  vpc_id      = aws_vpc.blog.id

  tags = { Name = "blog-rds-sg-${var.environment}" }
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_ec2" {
  security_group_id            = aws_security_group.rds.id
  description                  = "PostgreSQL from EC2"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.ec2.id
}
