terraform {
  required_version = ">= 1.7.0"
}

provider "kubernetes" {}

resource "kubernetes_namespace" "wysh" {
  metadata {
    name = "wysh-sellers"
  }
}
