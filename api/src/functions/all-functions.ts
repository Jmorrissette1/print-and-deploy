import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { ManagedIdentityCredential } from "@azure/identity";

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const COSMOS_ENDPOINT = process.env.COSMOS_DB_ENDPOINT || "";
const DATABASE_NAME = "printanddeploy";
const CONTAINER_NAME = "products";

const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || "";
const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || "";
const AZURE_AD_AUDIENCE =
  process.env.AZURE_AD_AUDIENCE || `api://${AZURE_AD_CLIENT_ID}`;

const ISSUER = `https://sts.windows.net/${AZURE_AD_TENANT_ID}/`;

const ALLOWED_ORIGINS = [
  "https://www.printanddeploy.com",
  "https://printanddeploy.com",
  "http://localhost:3000",
];


// Cors Orgin Function //
function getCorsOrigin(request: HttpRequest): string {
  const origin = request.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

interface ProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  tags?: string[];
  inStock?: boolean;
  stock?: number;
  specifications?: Record<string, string>;
}

function validateProductInput(body: any): { valid: boolean; error?: string; data?: ProductInput } {
  if (!body.name || typeof body.name !== "string" || body.name.length > 200) {
    return { valid: false, error: "name is required and must be under 200 characters" };
  }
  if (!body.category || typeof body.category !== "string" || body.category.length > 50) {
    return { valid: false, error: "category is required and must be under 50 characters" };
  }
  if (body.price !== undefined && (typeof body.price !== "number" || body.price < 0 || body.price > 99999)) {
    return { valid: false, error: "price must be a number between 0 and 99999" };
  }
  if (body.description && (typeof body.description !== "string" || body.description.length > 2000)) {
    return { valid: false, error: "description must be under 2000 characters" };
  }
  if (body.imageUrl && (typeof body.imageUrl !== "string" || body.imageUrl.length > 500)) {
    return { valid: false, error: "imageUrl must be under 500 characters" };
  }

  const data: ProductInput = {
    name: body.name.trim(),
    description: body.description?.trim() || "",
    price: body.price || 0,
    category: body.category.trim().toLowerCase(),
    imageUrl: body.imageUrl?.trim(),
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 20).map((t: any) => String(t).trim()) : undefined,
    inStock: typeof body.inStock === "boolean" ? body.inStock : true,
    stock: typeof body.stock === "number" ? Math.floor(body.stock) : undefined,
    specifications: body.specifications && typeof body.specifications === "object" && !Array.isArray(body.specifications)
      ? body.specifications
      : undefined,
  };

  return { valid: true, data };
}


let cosmosClient: CosmosClient;

function getCosmosClient(): CosmosClient {
  if (!cosmosClient) {
    const credential = new ManagedIdentityCredential();
    cosmosClient = new CosmosClient({
      endpoint: COSMOS_ENDPOINT,
      aadCredentials: credential,
    });
  }
  return cosmosClient;
}

async function getProductsContainer() {
  const client = getCosmosClient();
  const database = client.database(DATABASE_NAME);
  return database.container(CONTAINER_NAME);
}

const jwksClientInstance = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

function getSigningKey(header: any, callback: any) {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

async function validateAzureADToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        audience: AZURE_AD_AUDIENCE,
        issuer: ISSUER,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      },
    );
  });
}

interface AuthContext {
  isAuthenticated: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
  roles: string[];
  error?: string;
}

function hasRole(authContext: AuthContext, requiredRoles: string[]): boolean {
  if (!authContext.isAuthenticated) return false;
  if (authContext.roles.includes("Admin")) return true;
  return requiredRoles.some((role) => authContext.roles.includes(role));
}
async function authenticateUser(
  request: HttpRequest,
  context: InvocationContext,
): Promise<AuthContext> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      isAuthenticated: false,
      roles: [],
      error: "No authorization header provided",
    };
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded: any = await validateAzureADToken(token);

    if (decoded.tid !== AZURE_AD_TENANT_ID) {
      throw new Error("Invalid tenant");
    }

    const userId = decoded.oid || decoded.sub;
    const userEmail =
      decoded.email || decoded.preferred_username || decoded.upn;
    const userName = decoded.name;
    const roles = decoded.roles || [];

    context.log(`Authenticated oid=${userId} roles=${roles.join(",")}`);

    return {
      isAuthenticated: true,
      userId,
      userEmail,
      userName,
      roles,
    };
  } catch (error: any) {
    context.error("Token validation failed:", error.message);
    return {
      isAuthenticated: false,
      roles: [],
      error: "Invalid or expired token",
    };
  }
}

// ===== LIST PRODUCTS =====
export async function listProducts(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("GET /api/manage/products");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    };
  }

  if (!hasRole(authContext, ["Viewer", "Editor", "Admin"])) {
    return {
      status: 403,
      jsonBody: { error: "Forbidden", message: "Insufficient permissions" },
    };
  }

  try {
    const container = await getProductsContainer();
    const { resources: products } = await container.items
      .query(
        "SELECT * FROM c WHERE NOT IS_DEFINED(c.isDeleted) OR c.isDeleted = false ORDER BY c.updatedAt DESC",
      )
      .fetchAll();

    return {
      status: 200,
      jsonBody: {
        products,
        count: products.length,
        requestedBy: authContext.userEmail,
      },
    };
  } catch (error: any) {
    context.error("Error:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("manage-products-list", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "manage/products",
  handler: listProducts,
});

// ===== GET SINGLE PRODUCT =====

export async function getProduct(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("GET /api/manage/products/{id}");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    };
  }

  if (!hasRole(authContext, ["Viewer", "Editor", "Admin"])) {
    return {
      status: 403,
      jsonBody: { error: "Forbidden", message: "Insufficient permissions" },
    };
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
      return {
        status: 404,
        jsonBody: { error: "Not found", message: `Product ${id} not found` },
      };
    }

    return { status: 200, jsonBody: products[0] };
  } catch (error: any) {
    context.error("Error:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("manage-products-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "manage/products/{id}",
  handler: getProduct,
});

// ===== DELETE PRODUCT (SOFT DELETE) FUNCTION ===== //
export async function deleteProduct(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("DELETE /api/manage/products/{id}");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    };
  }

  if (!hasRole(authContext, ["Admin"])) {
    return {
      status: 403,
      jsonBody: {
        error: "Forbidden",
        message: "Insufficient permissions. Requires Admin role.",
      },
    };
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
      return {
        status: 404,
        jsonBody: { error: "Not found", message: `Product ${id} not found` },
      };
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

    return {
      status: 200,
      jsonBody: {
        message: `Product ${id} deleted`,
        deletedBy: authContext.userEmail,
      },
    };
  } catch (error: any) {
    context.error("Error deleting product:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("manage-products-delete", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "manage/products/{id}",
  handler: deleteProduct,
});

// ===== UPDATE PRODUCT ===== //

export async function updateProduct(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("PUT /api/manage/products/{id}");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    };
  }

  if (!hasRole(authContext, ["Editor", "Admin"])) {
    return {
      status: 403,
      jsonBody: {
        error: "Forbidden",
        message: "Insufficient permissions. Requires Editor or Admin role.",
      },
    };
  }

  try {
    const id = request.params.id;
    const body = (await request.json()) as any;

    if (body.name && (typeof body.name !== "string" || body.name.length > 200)) {
      return { status: 400, jsonBody: { error: "Bad request", message: "name must be under 200 characters" } };
    }
    if (body.price !== undefined && (typeof body.price !== "number" || body.price < 0 || body.price > 99999)) {
      return { status: 400, jsonBody: { error: "Bad request", message: "price must be a number between 0 and 99999" } };
    }
    if (body.description && (typeof body.description !== "string" || body.description.length > 2000)) {
      return { status: 400, jsonBody: { error: "Bad request", message: "description must be under 2000 characters" } };
    }

    const container = await getProductsContainer();

    const { resources: products } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();

    if (products.length === 0) {
      return {
        status: 404,
        jsonBody: { error: "Not found", message: `Product ${id} not found` },
      };
    }

    const existing = products[0];

    const allowedUpdates: Record<string, any> = {};
    if (body.name) allowedUpdates.name = body.name.trim();
    if (body.description !== undefined) allowedUpdates.description = body.description.trim();
    if (body.price !== undefined) allowedUpdates.price = body.price;
    if (body.imageUrl !== undefined) allowedUpdates.imageUrl = body.imageUrl.trim();
    if (body.tags) allowedUpdates.tags = Array.isArray(body.tags) ? body.tags.slice(0, 20).map((t: any) => String(t).trim()) : existing.tags;
    if (body.inStock !== undefined) allowedUpdates.inStock = Boolean(body.inStock);
    if (body.stock !== undefined) allowedUpdates.stock = Math.floor(body.stock);
    if (body.specifications) allowedUpdates.specifications = body.specifications;

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

    return { status: 200, jsonBody: result };
  } catch (error: any) {
    context.error("Error updating product:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("manage-products-update", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "manage/products/{id}",
  handler: updateProduct,
});

// ===== CREATE PRODUCT FUCNTION ===== //

export async function createProduct(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("POST /api/manage/products");

  const authContext = await authenticateUser(request, context);

  if (!authContext.isAuthenticated) {
    return {
      status: 401,
      jsonBody: { error: "Unauthorized", message: authContext.error },
    };
  }

  if (!hasRole(authContext, ["Editor", "Admin"])) {
    return {
      status: 403,
      jsonBody: {
        error: "Forbidden",
        message: "Insufficient permissions. Requires Editor or Admin role.",
      },
    };
  }

  try {
   const body = (await request.json()) as any;
    const validation = validateProductInput(body);

    if (!validation.valid) {
      return {
        status: 400,
        jsonBody: { error: "Bad request", message: validation.error },
      };
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

    return { status: 201, jsonBody: created };
  } catch (error: any) {
    context.error("Error creating product:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("manage-products-create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "manage/products",
  handler: createProduct,
});



// PUBLIC LIST PRODUCTS
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

// PUBLIC GET SINGLE PRODUCT
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
