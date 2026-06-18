variable "project_name" {
  type    = string
  default = "kis-trello"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "database_name" {
  type    = string
  default = "kis_trello"
}

variable "database_username" {
  type    = string
  default = "kis_trello"
}

variable "database_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "ses_from_email" {
  type    = string
  default = "noreply@example.com"
}

variable "frontend_url" {
  type    = string
  default = "https://app.kis-trello.example.com"
}

variable "ses_domain" {
  type    = string
  default = "example.com"
}

variable "ecr_image" {
  type    = string
  default = "kis-trello-api:latest"
}
