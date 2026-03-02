import { CosmosClient } from "@azure/cosmos";
import { ManagedIdentityCredential } from "@azure/identity";
import { COSMOS_ENDPOINT, DATABASE_NAME, CONTAINER_NAME } from "../config";

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

export async function getProductsContainer() {
  const client = getCosmosClient();
  const database = client.database(DATABASE_NAME);
  return database.container(CONTAINER_NAME);
}