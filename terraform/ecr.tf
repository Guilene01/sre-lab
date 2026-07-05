# One ECR repository per app image (frontend + backend x 5 apps = 10 repos).
# force_delete lets `terraform destroy` remove repos that still hold images,
# so teardown never gets stuck.

resource "aws_ecr_repository" "ecommerce_frontend" {
  name                 = "sre-lab/ecommerce-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "ecommerce_backend" {
  name                 = "sre-lab/ecommerce-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "banking_frontend" {
  name                 = "sre-lab/banking-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "banking_backend" {
  name                 = "sre-lab/banking-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "food_delivery_frontend" {
  name                 = "sre-lab/food-delivery-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "food_delivery_backend" {
  name                 = "sre-lab/food-delivery-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "student_portal_frontend" {
  name                 = "sre-lab/student-portal-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "student_portal_backend" {
  name                 = "sre-lab/student-portal-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "support_tickets_frontend" {
  name                 = "sre-lab/support-tickets-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "support_tickets_backend" {
  name                 = "sre-lab/support-tickets-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}
