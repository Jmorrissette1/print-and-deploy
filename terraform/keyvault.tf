# ═══════════════════════════════════════════════════════
# ADEPTUS CUSTODES - Azure Key Vault
# Elite guardians protecting the Emperor's sacred secrets
# ═══════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RANDOM SUFFIX GENERATOR
# Ensures globally unique Key Vault name
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "random_string" "keyvault_suffix" {
  length  = 8
  special = false
  upper   = false
  # Generates something like: "a3x9k2m7"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LOCAL VARIABLES
# Computed values used throughout this file
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

locals {
  # Key Vault name must be globally unique
  # Format: kv-pd-prod-a3x9k2m7
  keyvault_name = "kv-pd-${var.environment}-${random_string.keyvault_suffix.result}"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AZURE KEY VAULT
# The sacred vault containing all secrets
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_key_vault" "main" {
  name                = local.keyvault_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id

  # SKU: Standard tier (sufficient for our needs, included in free tier)
  sku_name = var.key_vault_sku

  # ═══════════════════════════════════════════════════════
  # CRITICAL SECURITY SETTINGS
  # These protect against accidental destruction
  # ═══════════════════════════════════════════════════════

  # Soft Delete: Deleted vaults can be recovered for 90 days
  soft_delete_retention_days = var.key_vault_soft_delete_retention_days

  # Purge Protection: Cannot permanently delete during retention period
  # WARNING: Once enabled, cannot be disabled!
  purge_protection_enabled = true

  # RBAC: Modern authorization model (recommended over access policies)
  enable_rbac_authorization = var.enable_rbac_authorization

  # ═══════════════════════════════════════════════════════
  # NETWORK SECURITY
  # Controls who can access the vault
  # ═══════════════════════════════════════════════════════

  network_acls {
    # Allow Azure services to access (needed for Functions, Static Web Apps)
    bypass = "AzureServices"

    # Default action: Allow all during development
    # In production, change to "Deny" and add specific IPs
    default_action = length(var.allowed_ip_addresses) > 0 ? "Deny" : "Allow"

    # IP allowlist (empty = allow all)
    ip_rules = var.allowed_ip_addresses

    # Virtual network rules (for future VNet integration)
    virtual_network_subnet_ids = []
  }

  # Public network access (required for Static Web Apps/Functions without VNet)
  public_network_access_enabled = true

  # ═══════════════════════════════════════════════════════
  # RESOURCE TAGS
  # Imperial identification markers
  # ═══════════════════════════════════════════════════════

  tags = merge(
    var.tags,
    {
      Component     = "Security"
      SecurityLevel = "Critical"
      Purpose       = "Secrets Management - Stripe Keys, SendGrid, Database Credentials"
    }
  )

  # ═══════════════════════════════════════════════════════
  # LIFECYCLE PROTECTION
  # Prevent accidental destruction
  # ═══════════════════════════════════════════════════════

  lifecycle {
    prevent_destroy = true
    # Must manually change to false before destroying
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RBAC ROLE ASSIGNMENT
# Grant yourself permission to manage secrets
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_role_assignment" "keyvault_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azuread_client_config.current.object_id

  # Key Vault Secrets Officer role allows:
  # - Read, write, and delete secrets
  # - Does NOT allow: Managing access policies or vault itself
  # Perfect for day-to-day secret management
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LOG ANALYTICS WORKSPACE
# Monitoring and security event tracking
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  # Free tier allows 31 days retention
  # Paid tier allows up to 730 days
  sku               = "PerGB2018"
  retention_in_days = 90

  tags = merge(
    var.tags,
    {
      Component = "Monitoring"
      Purpose   = "Security Event Logging and Audit Trail"
    }
  )
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DIAGNOSTIC SETTINGS
# Send Key Vault audit logs to Log Analytics
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_monitor_diagnostic_setting" "keyvault" {
  name                       = "keyvault-diagnostics"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # Enable audit event logging
  # This logs EVERY access to the Key Vault
  enabled_log {
    category = "AuditEvent"
  }

  # Enable performance metrics
  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# ═══════════════════════════════════════════════════════
# OUTPUTS
# Information displayed after deployment
# ═══════════════════════════════════════════════════════

output "keyvault_name" {
  description = "Name of the Key Vault (sacred vault designation)"
  value       = azurerm_key_vault.main.name
}

output "keyvault_id" {
  description = "Azure Resource ID of the Key Vault"
  value       = azurerm_key_vault.main.id
}

output "keyvault_uri" {
  description = "URI of the Key Vault (for application configuration)"
  value       = azurerm_key_vault.main.vault_uri
}

output "log_analytics_workspace_id" {
  description = "ID of Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.main.id
}

output "next_steps" {
  description = "Next steps after deployment"
  value       = <<-EOT
  
  ═══════════════════════════════════════════════════════
  ✅ KEY VAULT DEPLOYED SUCCESSFULLY!
  ═══════════════════════════════════════════════════════
  
  Vault Name: ${azurerm_key_vault.main.name}
  Vault URI:  ${azurerm_key_vault.main.vault_uri}
  Location:   ${azurerm_key_vault.main.location}
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 NEXT STEPS:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  1. Add your Stripe API keys:
     az keyvault secret set --vault-name ${azurerm_key_vault.main.name} --name "StripeSecretKey" --value "sk_test_YOUR_KEY"
     az keyvault secret set --vault-name ${azurerm_key_vault.main.name} --name "StripePublishableKey" --value "pk_test_YOUR_KEY"
     az keyvault secret set --vault-name ${azurerm_key_vault.main.name} --name "StripeWebhookSecret" --value "whsec_YOUR_SECRET"
  
  2. Add your SendGrid API key:
     az keyvault secret set --vault-name ${azurerm_key_vault.main.name} --name "SendGridApiKey" --value "SG.YOUR_KEY"
  
  3. Verify secrets were added:
     az keyvault secret list --vault-name ${azurerm_key_vault.main.name} --query '[].name' -o table
  
  4. View vault in Azure Portal:
     https://portal.azure.com/#resource${azurerm_key_vault.main.id}
  
  ═══════════════════════════════════════════════════════
  THE CUSTODES STAND READY TO PROTECT YOUR SECRETS
  ═══════════════════════════════════════════════════════
  EOT
}

# ═══════════════════════════════════════════════════════
# THE EMPEROR PROTECTS
# ═══════════════════════════════════════════════════════