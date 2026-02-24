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
        issuer: `https://sts.windows.net/${AZURE_AD_TENANT_ID}/`,
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
    const userId = decoded.oid || decoded.sub;
    const userEmail =
      decoded.email || decoded.preferred_username || decoded.upn;
    const userName = decoded.name;
    const roles = decoded.roles || [];

    context.log(`Authenticated: ${userEmail} with roles: ${roles.join(", ")}`);

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
      error: `Invalid token: ${error.message}`,
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
      .query("SELECT * FROM c ORDER BY c.updatedAt DESC")
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
      jsonBody: { error: "Internal server error", message: error.message },
    };
  }
}

app.http("manage-products-list", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "manage/products",
  handler: listProducts,
});

// ===== CREATE PRODUCT =====
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

    if (!body.category) {
      return {
        status: 400,
        jsonBody: { error: "Bad request", message: "category is required" },
      };
    }

    const container = await getProductsContainer();
    const now = new Date().toISOString();

    const product = {
      id: crypto.randomUUID(),
      ...body,
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
      jsonBody: { error: "Internal server error", message: error.message },
    };
  }
}

app.http("manage-products-create", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "manage/products",
  handler: createProduct,
});
