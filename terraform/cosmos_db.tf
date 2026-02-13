# ═══════════════════════════════════════════════════════
# COSMOS DB - NoSQL Database
# Document database for products, orders, and customers
# ═══════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COSMOS DB ACCOUNT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_cosmosdb_account" "main" {
  name                = "cosmos-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  # ═══════════════════════════════════════════════════════
  # FREE TIER CONFIGURATION
  # 1000 RU/s and 25 GB storage free
  # ═══════════════════════════════════════════════════════

  free_tier_enabled = true

  # ═══════════════════════════════════════════════════════
  # CONSISTENCY LEVEL
  # Session = good balance of consistency and performance
  # ═══════════════════════════════════════════════════════

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  # ═══════════════════════════════════════════════════════
  # GEO-LOCATION
  # Single region (West US 2) for cost optimization
  # ═══════════════════════════════════════════════════════

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  # ═══════════════════════════════════════════════════════
  # BACKUP CONFIGURATION
  # Continuous backup (7 days) included in free tier
  # ═══════════════════════════════════════════════════════

  backup {
    type = "Continuous"
  }

  # ═══════════════════════════════════════════════════════
  # CAPABILITIES
  # Enable serverless (scales to zero when not in use)
  # ═══════════════════════════════════════════════════════

  capabilities {
    name = "EnableServerless"
  }

  # ═══════════════════════════════════════════════════════
  # TAGS
  # ═══════════════════════════════════════════════════════

  tags = merge(
    var.tags,
    {
      Component     = "Database"
      Purpose       = "NoSQL database for products, orders, customers"
      SecurityLevel = "High"
    }
  )
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COSMOS DB DATABASE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_cosmosdb_sql_database" "main" {
  name                = "printanddeploy"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONTAINER: PRODUCTS
# Stores product catalog (miniatures, terrain, accessories)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_cosmosdb_sql_container" "products" {
  name                = "products"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name

  # Partition key: category
  # Groups products by type (miniatures, terrain, accessories)
  partition_key_path = "/category"

  # Indexing policy for efficient queries
  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONTAINER: ORDERS
# Stores customer orders and order history
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_cosmosdb_sql_container" "orders" {
  name                = "orders"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name

  # Partition key: customerId
  # Groups orders by customer for efficient retrieval
  partition_key_path = "/customerId"

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONTAINER: CUSTOMERS
# Stores customer profiles and preferences
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_cosmosdb_sql_container" "customers" {
  name                = "customers"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name

  # Partition key: id (customer ID)
  # Each customer is independently partitioned
  partition_key_path = "/id"

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    # Index email for lookups
    included_path {
      path = "/email/?"
    }
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONTAINER: SECURITY EVENTS
# Stores security events from Python functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_cosmosdb_sql_container" "security_events" {
  name                = "security-events"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name

  # Partition key: eventType
  # Groups by type: fraud_detected, key_vault_alert, etc.
  partition_key_path = "/eventType"

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ROLE ASSIGNMENT: Cosmos DB Data Contributor
# Allows Azure Functions to read/write data
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_role_assignment" "cosmos_data_contributor" {
  scope                = azurerm_cosmosdb_account.main.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = data.azurerm_client_config.current.object_id
}

# ═══════════════════════════════════════════════════════
# OUTPUTS
# ═══════════════════════════════════════════════════════

output "cosmos_db_endpoint" {
  description = "Cosmos DB account endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_db_id" {
  description = "Cosmos DB account ID"
  value       = azurerm_cosmosdb_account.main.id
}

output "cosmos_db_name" {
  description = "Cosmos DB account name"
  value       = azurerm_cosmosdb_account.main.name
}

output "cosmos_database_name" {
  description = "Cosmos DB database name"
  value       = azurerm_cosmosdb_sql_database.main.name
}

output "cosmos_containers" {
  description = "List of container names"
  value = {
    products        = azurerm_cosmosdb_sql_container.products.name
    orders          = azurerm_cosmosdb_sql_container.orders.name
    customers       = azurerm_cosmosdb_sql_container.customers.name
    security_events = azurerm_cosmosdb_sql_container.security_events.name
  }
}