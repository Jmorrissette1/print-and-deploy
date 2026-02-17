import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

/**
 * Product Detail API - GET /api/products/{id}
 * Returns single product by ID from Cosmos DB
 */
export async function productDetail(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Product Detail API called");

  try {
    // Get product ID from URL
    const productId = request.params.id;

    if (!productId) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: "Product ID is required",
        },
      };
    }

    // Get Cosmos DB configuration
    const endpoint = process.env["COSMOS_ENDPOINT"];
    const key = process.env["COSMOS_KEY"];
    const databaseId = process.env["COSMOS_DATABASE"] || "printanddeploy";
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

    // Query for specific product
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @productId",
      parameters: [
        {
          name: "@productId",
          value: productId,
        },
      ],
    };

    const { resources: products } = await container.items
      .query(querySpec)
      .fetchAll();

    if (products.length === 0) {
      return {
        status: 404,
        jsonBody: {
          success: false,
          error: "Product not found",
          productId: productId,
        },
      };
    }

    context.log(`Retrieved product: ${products[0].name}`);

    // Return single product
    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      jsonBody: {
        success: true,
        data: products[0],
      },
    };
  } catch (error) {
    context.error("Error fetching product:", error);

    return {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
      jsonBody: {
        success: false,
        error: "Failed to fetch product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

// Register the function
app.http("product-detail", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "products/{id}",
  handler: productDetail,
});