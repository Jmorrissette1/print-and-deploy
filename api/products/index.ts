import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

/**
 * Products API - GET /api/products
 * Returns list of all products from Cosmos DB
 */
export async function products(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Products API called");

  try {
    // Get Cosmos DB configuration from environment
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || "printanddeploy";
    const containerId = "products";

    if (!endpoint || !key) {
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: "Cosmos DB configuration missing",
        },
      };
    }

    // Initialize Cosmos DB client
    const client = new CosmosClient({ endpoint, key });
    const database = client.database(databaseId);
    const container = database.container(containerId);

    // Query all products
    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.name",
    };

    const { resources: productList } = await container.items
      .query(querySpec)
      .fetchAll();

    context.log(`Retrieved ${productList.length} products`);

    // Return products
    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Enable CORS for frontend
      },
      jsonBody: {
        success: true,
        count: productList.length,
        data: productList,
      },
    };
  } catch (error) {
    context.error("Error fetching products:", error);

    return {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
      jsonBody: {
        success: false,
        error: "Failed to fetch products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

// Register the function
app.http("products", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "products",
  handler: products,
});
