# ═══════════════════════════════════════════════════════
# CODEX ASTARTES - Variable Definitions
# Sacred configurations and deployment parameters
# ═══════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENVIRONMENT CONFIGURATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "environment" {
  description = "Crusade designation (dev, staging, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod. The Codex allows no deviation!"
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LOCATION & NAMING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "location" {
  description = "Azure Region"
  type        = string
  default     = "westus2"

  # Common Azure regions (Segmentums):
  # eastus, westus, centralus - Segmentum Solar (North America)
  # northeurope, westeurope - Segmentum Obscurus (Europe)
  # eastasia, southeastasia - Segmentum Pacificus (Asia)
}

variable "project_name" {
  description = "project identifier"
  type        = string
  default     = "printanddeploy"

  validation {
    condition     = can(regex("^[a-z0-9]+$", var.project_name))
    error_message = "Project name must be lowercase letters and numbers only. No heretical characters!"
  }
}

variable "resource_group_name" {
  description = "resource group name"
  type        = string
  default     = "rg-printanddeploy-prod"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RESOURCE TAGS
# Identification markers for cost tracking and organization
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "tags" {
  description = "resource tags"
  type        = map(string)
  default = {
    Project    = "PrintAndDeploy"
    ManagedBy  = "Terraform"
    CostCenter = "Ecommerce"
    Owner      = "DevTeam"
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# KEY VAULT CONFIGURATION (Adeptus Custodes)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "key_vault_sku" {
  description = "Key Vault tier (standard or premium)"
  type        = string
  default     = "standard"

  validation {
    condition     = contains(["standard", "premium"], var.key_vault_sku)
    error_message = "Key Vault SKU must be standard or premium. Premium provides HSM-backed keys (Terra-grade security)."
  }
}

variable "key_vault_soft_delete_retention_days" {
  description = "Days to retain soft-deleted Key Vault (machine spirit lingering period)"
  type        = number
  default     = 90

  validation {
    condition     = var.key_vault_soft_delete_retention_days >= 7 && var.key_vault_soft_delete_retention_days <= 90
    error_message = "Retention must be between 7 and 90 days. The Administratum requires it!"
  }
}

variable "allowed_ip_addresses" {
  description = "IP addresses allowed to access Key Vault (leave empty to allow all during development)"
  type        = list(string)
  default     = []

  # Example: ["1.2.3.4/32", "5.6.7.8/32"]
  # Empty list = Allow all (for development)
  # Add your IP for production security
}

variable "enable_rbac_authorization" {
  description = "Use Azure RBAC for Key Vault (modern security - recommended by the Inquisition)"
  type        = bool
  default     = true
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FUTURE CONFIGURATIONS
# Resources to be deployed in later phases
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "cosmos_db_throughput" {
  description = "Cosmos DB throughput in RU/s (400 = free tier)"
  type        = number
  default     = 400

  validation {
    condition     = var.cosmos_db_throughput >= 400
    error_message = "Minimum throughput is 400 RU/s. The Machine Spirit requires sustenance!"
  }
}

variable "function_app_sku" {
  description = "Azure Functions plan SKU (Y1 = Consumption/free tier)"
  type        = string
  default     = "Y1"

  # Y1 = Consumption plan (pay per execution, free tier)
  # EP1 = Elastic Premium (faster, more features)
  # P1V2 = App Service Plan (dedicated compute)
}

# ═══════════════════════════════════════════════════════
# THE CODEX PROVIDES
# ═══════════════════════════════════════════════════════