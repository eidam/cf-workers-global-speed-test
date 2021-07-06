locals {
  cloud_run_name   = "global-speed-test"
  cloud_run_locations = {
    "asia-east1"              = "Changhua County, Taiwan",
    "asia-east2"              = "Hong Kong",
    "asia-northeast1"         = "Tokyo, Japan",
    "asia-northeast2"         = "Osaka, Japan",
    "asia-northeast3"         = "Seoul, South Korea",
    "asia-south1"             = "Mumbai, India",
    "asia-southeast1"         = "Jurong West, Singapore",
    "asia-southeast2"         = "Jakarta, Indonesia",
    "australia-southeast1"    = "Sydney, Australia",
    "europe-north1"           = "Hamina, Finland",
    "europe-west1"            = "St. Ghislain, Belgium",
    "europe-west2"            = "London, England",
    "europe-west3"            = "Frankfurt, Germany",
    "europe-west4"            = "Eemshaven, Netherlands",
    "europe-west6"            = "Zurich, Switzerland",
    "northamerica-northeast1" = "Montréal, Québec",
    "southamerica-east1"      = "Osasco, São Paulo, Brazil",
    "us-central1"             = "Council Bluffs, Iowa",
    "us-east1"                = "Moncks Corner, South Carolina",
    "us-east4"                = "Ashburn, Virginia",
    "us-west1"                = "The Dalles, Oregon",
    "us-west2"                = "Los Angeles, California",
    "us-west3"                = "Salt Lake City, Utah",
    "us-west4"                = "Las Vegas, Nevada, North America",
  }
}

resource "google_cloud_run_service" "global_speed_test" {
  for_each = local.cloud_run_locations

  name     = "google-speed-test"
  location = each.key

  template {
    spec {
      container_concurrency = 5
      timeout_seconds = 5
      containers {
        image = "gcr.io/${var.GCP_PROJECT}/global-speed-test:latest"
        env {
          name  = "REGION"
          value = each.key
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}


data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "global_speed_test" {
  for_each = local.cloud_run_locations

  location = google_cloud_run_service.global_speed_test[each.key].location
  project  = google_cloud_run_service.global_speed_test[each.key].project
  service  = google_cloud_run_service.global_speed_test[each.key].name

  policy_data = data.google_iam_policy.noauth.policy_data
}

// Print each service URL
output "services" {
  value = {
    for svc in google_cloud_run_service.global_speed_test :
    svc.location => svc.status[0].url
  }
}

resource "local_file" "foo" {
  content = jsonencode({
    for svc in google_cloud_run_service.global_speed_test :
    svc.location => svc.status[0].url
  })
  filename = "${path.module}/../../api/data/regions.json"
}
