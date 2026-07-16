# DNS for the app URLs students hit in their browser, e.g.
# ecommerce.<dns_zone_name>. Records alias the shared ALB by name (not IP),
# so they stay correct even if the ALB's underlying IP rotates -- no runtime
# resolution needed anywhere else in the lab.
#
# Each app claims a root-level subdomain of dns_zone_name directly (no
# namespace prefix) -- only point this at a domain where those five names
# (ecommerce, banking, food-delivery, student-portal, support-tickets)
# aren't needed for anything else.
#
# The ALB doesn't exist until the AWS Load Balancer Controller creates it
# from the Ingress resources (scripts/setup.sh step 8, well after this
# directory's first `terraform apply` in step 1), so the aws_lb lookup below
# is gated behind create_dns_records: false on the first apply (before the
# ALB exists), then scripts/setup.sh re-applies with it set true once the
# ALB is confirmed up.

variable "dns_zone_name" {
  description = "Existing Route 53 public hosted zone the lab apps are created under -- set this in terraform.tfvars (see terraform.tfvars.example), no default since it's specific to whoever is standing up the lab"
  type        = string
}

variable "create_dns_records" {
  description = "Whether to look up the ALB and create its DNS records. False on the first apply (before the ALB exists); scripts/setup.sh re-applies with this set true once the ALB is up."
  type        = bool
  default     = false
}

data "aws_route53_zone" "parent" {
  name         = "${var.dns_zone_name}."
  private_zone = false
}

data "aws_lb" "shared" {
  count = var.create_dns_records ? 1 : 0

  tags = {
    "elbv2.k8s.aws/cluster" = var.cluster_name
  }
}

locals {
  lab_apps = ["ecommerce", "banking", "food-delivery", "student-portal", "support-tickets"]
}

resource "aws_route53_record" "app" {
  for_each = var.create_dns_records ? toset(local.lab_apps) : toset([])

  zone_id = data.aws_route53_zone.parent.zone_id
  name    = "${each.value}.${var.dns_zone_name}"
  type    = "A"

  alias {
    name                   = data.aws_lb.shared[0].dns_name
    zone_id                = data.aws_lb.shared[0].zone_id
    evaluate_target_health = true
  }
}
