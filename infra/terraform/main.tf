terraform {
  required_version = ">= 1.7.0"
}

provider "kubernetes" {}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

resource "kubernetes_namespace" "wysh" {
  metadata {
    name = "wysh-sellers"
  }
}

# PostgreSQL deployment
resource "kubernetes_deployment" "postgres" {
  metadata {
    name = "postgres"
    namespace = "wysh-sellers"
  }
  spec {
    selector {
      match_labels = {
        app = "postgres"
      }
    }
    replicas = 1
    template {
      metadata {
        labels = {
          app = "postgres"
        }
      }
      spec {
        container {
          image = "postgres:17-alpine"
          name = "postgres"
          env {
            name = "POSTGRES_DB"
            value = "wysh"
          }
          env {
            name = "POSTGRES_USER"
            value = "wysh"
          }
          env {
            name = "POSTGRES_PASSWORD"
            value = "wysh"
          }
          port {
            container_port = 5432
          }
          health_check {
            connection {
              user = "wysh"
              dbname = "wysh"
            }
          }
        }
      }
    }
  }

# Redis deployment
resource "kubernetes_deployment" "redis" {
  metadata {
    name = "redis"
    namespace = "wysh-sellers"
  }
  spec {
    replicas = 1
    template {
      metadata {
        labels = {
          app = "redis"
        }
      }
      spec {
        container {
          image = "redis:7-alpine"
          name = "redis"
          health_check {
            script = ["redis-cli", "ping"]
          }
        }
      }
    }
  }

# Minio deployment
resource "kubernetes_deployment" "minio" {
  metadata {
    name = "minio"
    namespace = "wysh-sellers"
  }
  spec {
    replicas = 1
    template {
      metadata {
        labels = {
          app = "minio"
        }
      }
      spec {
        container {
          image = "minio/minio:RELEASE.2025-02-07T23-21-09Z"
          name = "minio"
          args = ["server", "/data", "--console-address", ":9001"]
          env {
            name = "MINIO_ROOT_USER"
            value = "minio"
          }
          env {
            name = "MINIO_ROOT_PASSWORD"
            value = "minio123"
          }
        }
      }
    }
  }
}