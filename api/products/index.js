"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.products = products;
const functions_1 = require("@azure/functions");
const cosmos_1 = require("@azure/cosmos");
/**
 * Products API - GET /api/products
 * Returns list of all products from Cosmos DB
 */
async function products(request, context) {
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
        const client = new cosmos_1.CosmosClient({ endpoint, key });
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
    }
    catch (error) {
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
functions_1.app.http("products", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "products",
    handler: products,
});
//# sourceMappingURL=index.js.map