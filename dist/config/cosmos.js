"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContainer = getContainer;
exports.getUsersContainer = getUsersContainer;
const cosmos_1 = require("@azure/cosmos");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const databaseId = process.env.COSMOS_DATABASE || 'AcervoCulturalDB';
const containerId = process.env.COSMOS_CONTAINER || 'Items';
let client;
if (!endpoint || !endpoint.startsWith('http')) {
    console.warn("⚠️ [Aviso]: Variável de ambiente COSMOS_ENDPOINT é inválida ou não foi definida. A conexão com o banco não funcionará.");
}
else {
    client = new cosmos_1.CosmosClient({ endpoint, key });
}
let usersContainerInstance = null;
/**
 * Retorna o container principal do Acervo
 */
async function getContainer() {
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
async function getUsersContainer() {
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
