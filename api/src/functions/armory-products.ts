import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getProductsContainer } from "../services/cosmos";
import { authenticateUser, hasRole } from "../middleware/auth";
import { validateProductInput } from "../utils/validation";
import { corsResponse, handlePreflight } from "../utils/cors";

// ===== LIST PRODUCTS =====
export async function listProducts(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return handlePreflight(request);

  context.log("GET /api/armory/products");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return corsResponse(request, {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    });
  }

  if (!hasRole(authContext, ["Viewer", "Editor", "Admin"])) {
    return corsResponse(request, {
      status: 403,
      jsonBody: { error: "Forbidden", message: "Insufficient permissions" },
    });
  }

  try {
    const container = await getProductsContainer();
    const { resources: products } = await container.items
      .query(
        "SELECT * FROM c WHERE NOT IS_DEFINED(c.isDeleted) OR c.isDeleted = false ORDER BY c.updatedAt DESC",
      )
      .fetchAll();

    return corsResponse(request, {
      status: 200,
      jsonBody: {
        products,
        count: products.length,
        requestedBy: authContext.userEmail,
      },
    });
  } catch (error: any) {
    context.error("Error:", error);
    return corsResponse(request, {
      status: 500,
      jsonBody: { error: "Internal server error" },
    });
  }
}

app.http("armory-products-list", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "armory/products",
  handler: listProducts,
});

// ===== GET SINGLE PRODUCT =====
export async function getProduct(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return handlePreflight(request);

  context.log("GET /api/armory/products/{id}");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return corsResponse(request, {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    });
  }

  if (!hasRole(authContext, ["Viewer", "Editor", "Admin"])) {
    return corsResponse(request, {
      status: 403,
      jsonBody: { error: "Forbidden", message: "Insufficient permissions" },
    });
  }

  try {
    const id = request.params.id;
    const container = await getProductsContainer();
    const { resources: products } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();

    if (products.length === 0) {
      return corsResponse(request, {
        status: 404,
        jsonBody: { error: "Not found", message: `Product ${id} not found` },
      });
    }

    return corsResponse(request, {
      status: 200,
      jsonBody: products[0],
    });
  } catch (error: any) {
    context.error("Error:", error);
    return corsResponse(request, {
      status: 500,
      jsonBody: { error: "Internal server error" },
    });
  }
}

app.http("armory-products-get", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "armory/products/{id}",
  handler: getProduct,
});

// ===== CREATE PRODUCT =====
export async function createProduct(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return handlePreflight(request);

  context.log("POST /api/armory/products");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return corsResponse(request, {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    });
  }

  if (!hasRole(authContext, ["Editor", "Admin"])) {
    return corsResponse(request, {
      status: 403,
      jsonBody: {
        error: "Forbidden",
        message: "Insufficient permissions. Requires Editor or Admin role.",
      },
    });
  }

  try {
    const body = (await request.json()) as any;
    const validation = validateProductInput(body);

    if (!validation.valid) {
      return corsResponse(request, {
        status: 400,
        jsonBody: { error: "Bad request", message: validation.error },
      });
    }

    const container = await getProductsContainer();
    const now = new Date().toISOString();

    const product = {
      id: crypto.randomUUID(),
      ...validation.data,
      createdAt: now,
      updatedAt: now,
      createdBy: authContext.userEmail || "unknown",
      updatedBy: authContext.userEmail || "unknown",
    };

    const { resource: created } = await container.items.create(product);

    context.log(`Product created by ${authContext.userEmail}: ${product.id}`);

    return corsResponse(request, {
      status: 201,
      jsonBody: created,
    });
  } catch (error: any) {
    context.error("Error creating product:", error);
    return corsResponse(request, {
      status: 500,
      jsonBody: { error: "Internal server error" },
    });
  }
}

app.http("armory-products-create", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "armory/products",
  handler: createProduct,
});

// ===== UPDATE PRODUCT =====
export async function updateProduct(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return handlePreflight(request);

  context.log("PUT /api/armory/products/{id}");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return corsResponse(request, {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    });
  }

  if (!hasRole(authContext, ["Editor", "Admin"])) {
    return corsResponse(request, {
      status: 403,
      jsonBody: {
        error: "Forbidden",
        message: "Insufficient permissions. Requires Editor or Admin role.",
      },
    });
  }

  try {
    const id = request.params.id;
    const body = (await request.json()) as any;

    if (
      body.name &&
      (typeof body.name !== "string" || body.name.length > 200)
    ) {
      return corsResponse(request, {
        status: 400,
        jsonBody: {
          error: "Bad request",
          message: "name must be under 200 characters",
        },
      });
    }
    if (
      body.price !== undefined &&
      (typeof body.price !== "number" || body.price < 0 || body.price > 99999)
    ) {
      return corsResponse(request, {
        status: 400,
        jsonBody: {
          error: "Bad request",
          message: "price must be a number between 0 and 99999",
        },
      });
    }
    if (
      body.description &&
      (typeof body.description !== "string" || body.description.length > 2000)
    ) {
      return corsResponse(request, {
        status: 400,
        jsonBody: {
          error: "Bad request",
          message: "description must be under 2000 characters",
        },
      });
    }

    const container = await getProductsContainer();

    const { resources: products } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();

    if (products.length === 0) {
      return corsResponse(request, {
        status: 404,
        jsonBody: { error: "Not found", message: `Product ${id} not found` },
      });
    }

    const existing = products[0];

    const allowedUpdates: Record<string, any> = {};
    if (body.name) allowedUpdates.name = body.name.trim();
    if (body.description !== undefined)
      allowedUpdates.description = body.description.trim();
    if (body.price !== undefined) allowedUpdates.price = body.price;
    if (body.imageUrl !== undefined)
      allowedUpdates.imageUrl = body.imageUrl.trim();
    if (body.tags)
      allowedUpdates.tags = Array.isArray(body.tags)
        ? body.tags.slice(0, 20).map((t: any) => String(t).trim())
        : existing.tags;
    if (body.inStock !== undefined)
      allowedUpdates.inStock = Boolean(body.inStock);
    if (body.stock !== undefined) allowedUpdates.stock = Math.floor(body.stock);
    if (body.specifications)
      allowedUpdates.specifications = body.specifications;

    const updated = {
      ...existing,
      ...allowedUpdates,
      id: existing.id,
      category: existing.category,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedAt: new Date().toISOString(),
      updatedBy: authContext.userEmail || "unknown",
    };

    const { resource: result } = await container
      .item(id, existing.category)
      .replace(updated);

    context.log(`Product updated by ${authContext.userEmail}: ${id}`);

    return corsResponse(request, {
      status: 200,
      jsonBody: result,
    });
  } catch (error: any) {
    context.error("Error updating product:", error);
    return corsResponse(request, {
      status: 500,
      jsonBody: { error: "Internal server error" },
    });
  }
}

app.http("armory-products-update", {
  methods: ["PUT", "OPTIONS"],
  authLevel: "anonymous",
  route: "armory/products/{id}",
  handler: updateProduct,
});

// ===== DELETE PRODUCT (SOFT DELETE) =====
export async function deleteProduct(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return handlePreflight(request);

  context.log("DELETE /api/armory/products/{id}");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return corsResponse(request, {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    });
  }

  if (!hasRole(authContext, ["Admin"])) {
    return corsResponse(request, {
      status: 403,
      jsonBody: {
        error: "Forbidden",
        message: "Insufficient permissions. Requires Admin role.",
      },
    });
  }

  try {
    const id = request.params.id;
    const container = await getProductsContainer();

    const { resources: products } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();

    if (products.length === 0) {
      return corsResponse(request, {
        status: 404,
        jsonBody: { error: "Not found", message: `Product ${id} not found` },
      });
    }

    const existing = products[0];

    const deleted = {
      ...existing,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: authContext.userEmail || "unknown",
      updatedAt: new Date().toISOString(),
      updatedBy: authContext.userEmail || "unknown",
    };

    await container.item(id, existing.category).replace(deleted);

    context.log(`Product soft-deleted by ${authContext.userEmail}: ${id}`);

    return corsResponse(request, {
      status: 200,
      jsonBody: {
        message: `Product ${id} deleted`,
        deletedBy: authContext.userEmail,
      },
    });
  } catch (error: any) {
    context.error("Error deleting product:", error);
    return corsResponse(request, {
      status: 500,
      jsonBody: { error: "Internal server error" },
    });
  }
}

app.http("armory-products-delete", {
  methods: ["DELETE", "OPTIONS"],
  authLevel: "anonymous",
  route: "armory/products/{id}",
  handler: deleteProduct,
});
