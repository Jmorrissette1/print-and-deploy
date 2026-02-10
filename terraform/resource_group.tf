# ═══════════════════════════════════════════════════════
# FORTRESS MONASTERY - Resource Group
# The fortified stronghold containing all Imperial assets
# ═══════════════════════════════════════════════════════

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = merge(
    var.tags,
    {
      Component = "Infrastructure"
      Purpose   = "Fortress Monastery - Contains all Print and Deploy resources"
    }
  )

  # CRITICAL SECURITY: Prevent accidental fortress destruction
  lifecycle {
    prevent_destroy = true
  }
}

# ═══════════════════════════════════════════════════════
# FORTRESS OUTPUTS
# Information about the constructed fortress
# ═══════════════════════════════════════════════════════

output "resource_group_name" {
  description = "Fortress designation"
  value       = azurerm_resource_group.main.name
}

output "resource_group_id" {
  description = "Fortress identification rune"
  value       = azurerm_resource_group.main.id
}

output "resource_group_location" {
  description = "Fortress location in the Materium"
  value       = azurerm_resource_group.main.location
}

# ═══════════════════════════════════════════════════════
# THE FORTRESS STANDS ETERNAL
# ═══════════════════════════════════════════════════════