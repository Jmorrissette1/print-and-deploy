# ═══════════════════════════════════════════════════════
# STATIC WEB APP - The Fortress Gate
# Frontend deployment for the inventory management panel
# ═══════════════════════════════════════════════════════

resource "azurerm_static_web_app" "frontend" {
  name                = "swa-${var.project_name}-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = "Free"
  sku_size            = "Free"

  tags = var.tags
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OUTPUTS - Coordinates for the battlefield
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output "static_web_app_url" {
  description = "Default URL of the Static Web App"
  value       = azurerm_static_web_app.frontend.default_host_name
}

output "static_web_app_api_key" {
  description = "API key for GitHub Actions deployment (guard this well, Battle-Brother)"
  value       = azurerm_static_web_app.frontend.api_key
  sensitive   = true
}

output "static_web_app_id" {
  description = "Resource ID of the Static Web App"
  value       = azurerm_static_web_app.frontend.id
}

# ═══════════════════════════════════════════════════════
# THE FORTRESS GATE STANDS READY
# ═══════════════════════════════════════════════════════
