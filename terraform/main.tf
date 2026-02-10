# This tells Terraform which version to use
terraform {
  required_version = ">= 1.6.0"


  required_providers {
    azurerm = { # Azure Resource Manager - talks to Azure
      source  = "hashicorp/azurerm"
      version = "~> 3.100.0" # Use version 3.100.x
    }
    azuread = { # Azure Active Directory - for identity stuff
      source  = "hashicorp/azuread"
      version = "~> 2.47.0"
    }
  }
}


provider "azurerm" {
  features {
    # Key Vault security settings
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }


    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}


provider "azuread" {}


data "azurerm_client_config" "current" {}

data "azuread_client_config" "current" {}