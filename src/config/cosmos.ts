import { CosmosClient } from '@azure/cosmos';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const databaseId = process.env.COSMOS_DATABASE || 'AcervoCulturalDB';
const containerId = process.env.COSMOS_CONTAINER || 'Items';

let client: CosmosClient;

if (!endpoint || !endpoint.startsWith('http')) {
  console.warn("⚠️ [Aviso]: Variável de ambiente COSMOS_ENDPOINT é inválida ou não foi definida. A conexão com o banco não funcionará.");
} else {
  client = new CosmosClient({ endpoint, key });
}

let usersContainerInstance: any = null;

/**
 * Retorna o container principal do Acervo
 */
export async function getContainer() {
  if (!client) {
    throw new Error("O cliente do CosmosDB não está conectado. Verifique o arquivo .env.");
  }
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  const { container } = await database.containers.createIfNotExists({ id: containerId });
  return container;
}

/**
 * Retorna o container de Usuários e Permissões (Consolidado no Database Principal)
 */
export async function getUsersContainer() {
  if (!client) {
    throw new Error("O cliente do CosmosDB não está conectado. Verifique o arquivo .env.");
  }
  if (!usersContainerInstance) {
    // Usamos o database principal e uma tabela específica e clara: 'Curadores'
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({ 
      id: 'Usuarios',
      partitionKey: { paths: ['/id'] }
    });
    usersContainerInstance = container;
  }
  return usersContainerInstance;
}
