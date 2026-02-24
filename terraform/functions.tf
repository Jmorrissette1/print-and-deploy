# ============================================================================
# Azure Functions Infrastructure
# ============================================================================
# This creates:
# - Storage Account (required for Functions)
# - App Service Plan (Consumption tier - serverless)
# - Function App (with Managed Identity)
# - Application Insights (monitoring)
# - Environment variables (including Azure AD config)

# ----------------------------------------------------------------------------
# Storage Account (Required for Azure Functions)
# ----------------------------------------------------------------------------
resource "azurerm_storage_account" "functions" {
  name                     = "stfuncpd${random_string.unique.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version         = "TLS1_2"

  # Enable blob versioning for better data protection
  blob_properties {
    versioning_enabled = true
  }

  tags = var.tags
}

# ----------------------------------------------------------------------------
# App Service Plan (Consumption Plan - Serverless)
# ----------------------------------------------------------------------------
resource "azurerm_service_plan" "functions" {
  name                = "asp-printanddeploy-prod"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "Y1" # Consumption plan (pay per execution)

  tags = var.tags
}

# ----------------------------------------------------------------------------
# Application Insights (Monitoring & Logging)
# ----------------------------------------------------------------------------
resource "azurerm_application_insights" "functions" {
  name                = "appi-printanddeploy-prod"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "Node.JS"

  tags = var.tags
}

# ----------------------------------------------------------------------------
# Azure Function App
# ----------------------------------------------------------------------------
resource "azurerm_linux_function_app" "main" {
  name                       = "func-printanddeploy-prod"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  service_plan_id            = azurerm_service_plan.functions.id
  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key

  # Enable Managed Identity for passwordless auth
  identity {
    type = "SystemAssigned"
  }

  site_config {
    # Node.js 20 LTS (latest supported)
    application_stack {
      node_version = "20"
    }

    # CORS configuration (adjust for your frontend domain)
    cors {
      allowed_origins = [
        "http://localhost:3000",           # Local development
        "https://printanddeploy.com",      # Production domain
        "https://www.printanddeploy.com"   # Production with www
      ]
      support_credentials = true
    }

    # Always use 64-bit process
    use_32_bit_worker = false

    # Enable Application Insights
    application_insights_key               = azurerm_application_insights.functions.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.functions.connection_string
  }

  # Environment variables / App Settings
  app_settings = {
    # Azure Functions Runtime
    "FUNCTIONS_WORKER_RUNTIME"     = "node"
    "WEBSITE_NODE_DEFAULT_VERSION" = "~20"
    "FUNCTIONS_EXTENSION_VERSION"  = "~4"

    # Application Insights
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.functions.connection_string

    # Cosmos DB Configuration
    "COSMOS_DB_ENDPOINT" = azurerm_cosmosdb_account.main.endpoint

    # Azure AD Authentication (using variables you'll define)
    "AZURE_AD_TENANT_ID"  = var.azure_ad_tenant_id
    "AZURE_AD_CLIENT_ID"  = var.azure_ad_client_id
    "AZURE_AD_AUDIENCE"   = "api://${var.azure_ad_client_id}"

    # Enable better cold start performance
    "WEBSITE_RUN_FROM_PACKAGE" = "1"
  }

  # Lifecycle management
  lifecycle {
    ignore_changes = [
      # Ignore changes to tags managed by other processes
      tags["hidden-link: /app-insights-conn-string"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-instrumentation-key"]
    ]
  }

  tags = var.tags
}

# ----------------------------------------------------------------------------
# RBAC: Grant Function App access to Cosmos DB
# ----------------------------------------------------------------------------
# Allow Functions Managed Identity to read/write Cosmos DB

resource "azurerm_role_assignment" "functions_to_cosmos" {
  scope                = azurerm_cosmosdb_account.main.id
  role_definition_name = "DocumentDB Account Contributor"  # ← CORRECT
  principal_id         = azurerm_linux_function_app.main.identity[0].principal_id
}

# ----------------------------------------------------------------------------
# RBAC: Grant Function App access to Key Vault (if needed)
# ----------------------------------------------------------------------------
# Allow Functions to read secrets from Key Vault
resource "azurerm_role_assignment" "functions_to_keyvault" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_function_app.main.identity[0].principal_id
}

# ----------------------------------------------------------------------------
# Random String for Unique Storage Account Name
# ----------------------------------------------------------------------------
# Storage account names must be globally unique
resource "random_string" "unique" {
  length  = 6
  special = false
  upper   = false
  numeric = true
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "function_app_name" {
  description = "Name of the Azure Function App"
  value       = azurerm_linux_function_app.main.name
}

output "function_app_url" {
  description = "Default URL of the Function App"
  value       = "https://${azurerm_linux_function_app.main.default_hostname}"
}

output "function_app_identity" {
  description = "Managed Identity Principal ID for the Function App"
  value       = azurerm_linux_function_app.main.identity[0].principal_id
}

output "storage_account_name" {
  description = "Storage account used by Functions"
  value       = azurerm_storage_account.functions.name
}

output "app_insights_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.functions.instrumentation_key
  sensitive   = true
}
