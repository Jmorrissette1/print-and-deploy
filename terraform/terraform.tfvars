# ═══════════════════════════════════════════════════════
# DEPLOYMENT VALUES - Production Configuration
# Actual values for the Codex parameters
# ═══════════════════════════════════════════════════════

environment         = "prod"
location            = "westus2"
project_name        = "printanddeploy"
resource_group_name = "rg-printanddeploy-prod"

# Key Vault configuration
key_vault_sku                        = "standard"
key_vault_soft_delete_retention_days = 90
enable_rbac_authorization            = true

# Network security (add your IP for enhanced security later)
allowed_ip_addresses = [] # Empty = allow all (development mode)

# Resource tags for cost tracking
tags = {
  Project       = "PrintAndDeploy"
  Environment   = "Production"
  ManagedBy     = "Terraform"
  CostCenter    = "Ecommerce"
  Owner         = "DevTeam"
  SecurityLevel = "High"
}

# Future configurations (not used yet)
cosmos_db_throughput = 400  # Free tier
function_app_sku     = "Y1" # Consumption plan (free)

# Azure AD Configuration

azure_ad_tenant_id = "d1d29a42-4077-43af-aa2d-45f3b1290044"
azure_ad_client_id = "2c6b7cea-3fe7-477f-83d3-80ee0e770439"

