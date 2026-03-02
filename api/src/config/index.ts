export const COSMOS_ENDPOINT = process.env.COSMOS_DB_ENDPOINT || "";
export const DATABASE_NAME = "printanddeploy";
export const CONTAINER_NAME = "products";

export const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || "";
export const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || "";
export const AZURE_AD_AUDIENCE =
  process.env.AZURE_AD_AUDIENCE || `api://${AZURE_AD_CLIENT_ID}`;

export const ISSUER = `https://sts.windows.net/${AZURE_AD_TENANT_ID}/`;

export const ALLOWED_ORIGINS = [
  "https://www.printanddeploy.com",
  "https://printanddeploy.com",
  "http://localhost:3000",
];