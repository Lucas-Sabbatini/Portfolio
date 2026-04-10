data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "blog" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "blog-vpc-${var.environment}" }
}

# --- Public subnet (EC2) ---

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.blog.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "blog-public-${var.environment}" }
}

# --- Private subnets (RDS requires 2 AZs) ---

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.blog.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = { Name = "blog-private-a-${var.environment}" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.blog.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = { Name = "blog-private-b-${var.environment}" }
}

# --- Internet Gateway ---

resource "aws_internet_gateway" "blog" {
  vpc_id = aws_vpc.blog.id

  tags = { Name = "blog-igw-${var.environment}" }
}

# --- Public route table ---

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.blog.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.blog.id
  }

  tags = { Name = "blog-public-rt-${var.environment}" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
