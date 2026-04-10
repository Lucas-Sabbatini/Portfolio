# --- DB Subnet Group (requires 2 AZs) ---

resource "aws_db_subnet_group" "blog" {
  name = "blog-db-subnet-${var.environment}"
  subnet_ids = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id,
  ]

  tags = { Name = "blog-db-subnet-${var.environment}" }
}

# --- RDS PostgreSQL ---
# After creation, manually create the umami database:
#   psql -h <rds_endpoint> -U blog -c "CREATE DATABASE umami;"

resource "aws_db_instance" "blog" {
  identifier     = "blog-rds-${var.environment}"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.rds_instance_class

  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "blog"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.blog.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period   = 7
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "blog-final-${var.environment}"

  tags = { Name = "blog-rds-${var.environment}" }
}
