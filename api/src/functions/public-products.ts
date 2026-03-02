import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getProductsContainer } from "../services/cosmos";
import { getCorsOrigin } from "../utils/cors";

// ===== PUBLIC LIST PRODUCTS =====
export async function publicListProducts(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("GET /api/products (public)");

  try {
    const container = await getProductsContainer();
    const { resources: products } = await container.items
      .query(
        "SELECT c.id, c.name, c.description, c.price, c.category, c.imageUrl, c.tags, c.specifications, c.inStock " +
          "FROM c WHERE (NOT IS_DEFINED(c.isDeleted) OR c.isDeleted = false)",
      )
      .fetchAll();

    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": getCorsOrigin(request),
      },
      jsonBody: { products, count: products.length },
    };
  } catch (error: any) {
    context.error("Error:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("public-products-list", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "products",
  handler: publicListProducts,
});

// ===== PUBLIC GET SINGLE PRODUCT =====
export async function publicGetProduct(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("GET /api/products/{id} (public)");

  try {
    const id = request.params.id;
    const container = await getProductsContainer();
    const { resources: products } = await container.items
      .query({
        query:
          "SELECT c.id, c.name, c.description, c.price, c.category, c.imageUrl, c.tags, c.specifications, c.inStock " +
          "FROM c WHERE c.id = @id AND (NOT IS_DEFINED(c.isDeleted) OR c.isDeleted = false)",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();

    if (products.length === 0) {
      return {
        status: 404,
        jsonBody: { error: "Product not found" },
      };
    }

    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": getCorsOrigin(request),
      },
      jsonBody: products[0],
    };
  } catch (error: any) {
    context.error("Error:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("public-products-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "products/{id}",
  handler: publicGetProduct,
});