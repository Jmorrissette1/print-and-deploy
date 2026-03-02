import { HttpRequest, InvocationContext } from "@azure/functions";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { AZURE_AD_TENANT_ID, AZURE_AD_AUDIENCE, ISSUER } from "../config";

const jwksClientInstance = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

export interface AuthContext {
  isAuthenticated: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
  roles: string[];
  error?: string;
}

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

export async function authenticateUser(
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

export function hasRole(authContext: AuthContext, requiredRoles: string[]): boolean {
  if (!authContext.isAuthenticated) return false;
  if (authContext.roles.includes("Admin")) return true;
  return requiredRoles.some((role) => authContext.roles.includes(role));
}