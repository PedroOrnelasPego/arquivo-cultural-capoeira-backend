"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAcervoItem = exports.getAcervoCompleto = void 0;
const cosmos_1 = require("../config/cosmos");
const getAcervoCompleto = async (req, res) => {
    try {
        const container = await (0, cosmos_1.getContainer)();
        // Busca todos os itens cadastrados no acervo ignorando o tipo
        const { resources } = await container.items.query('SELECT * FROM c ORDER BY c._ts DESC').fetchAll();
        // Embelezar a saída se precisar mapear campos
        const formattedData = resources.map(item => {
            // Cria um ID puramente numérico curto (apenas para exibição) somando/calculando os chars do guid
            // Ou usar um gerador numérico. Aqui simplificamos cortando só letras do guid e deixando 5 núms.
            const numbersOnly = item.id.replace(/\D/g, '');
            const shortIdNumerico = numbersOnly.length >= 5 ? numbersOnly.substring(0, 5) : Math.floor(10000 + Math.random() * 90000).toString();
            return {
                ...item,
                shortId: shortIdNumerico,
                image: item.image || null
            };
        });
        return res.status(200).json(formattedData);
    }
    catch (error) {
        console.error('Erro ao buscar todo o acervo:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar as informacões reais do banco de dados.', details: error.message });
    }
};
exports.getAcervoCompleto = getAcervoCompleto;
const deleteAcervoItem = async (req, res) => {
    try {
        const { id } = req.params;
        const container = await (0, cosmos_1.getContainer)();
        // Deleta o registro pelo Id (exige partion key no delete também, que para nós é o type, mas para segurança mandamos deletar sem filtro exato caso tenham diferentes partition keys configuradas. Como na criação usamos 'type' como partitionKey (ex: /type), precisamos dele, mas caso o container use ID como partition, enviamos ID. Por ora, passamos o próprio ID como partition key caso seja igual, ou usar item(id, partitionKey)).
        // Como a configuração padrão costuma ser id como PK ou type. Vamos tentar buscar primeiro para saber o tipo e deletar com a PK correta, ou mandar deletar diretamente com a partition key padrão se a API permitisse ignorar, mas o Cosmos exige a Partition Key no DELETE. Usaremos cross partition query para buscar o type.
        const query = `SELECT * FROM c WHERE c.id = '${id}'`;
        const { resources } = await container.items.query(query).fetchAll();
        if (resources.length === 0) {
            return res.status(404).json({ error: 'Item não encontrado para exclusão.' });
        }
        const itemData = resources[0];
        const itemType = itemData.type;
        // ANTES DE DELETAR O REGISTRO, PRECISAMOS LIMPAR O ARMAZENAMENTO (Azure Storage)
        // Vamos coletar todas as URLs de arquivos associadas a este item
        const fileUrls = [];
        if (itemData.image)
            fileUrls.push(itemData.image);
        if (itemData.backImage)
            fileUrls.push(itemData.backImage);
        if (itemData.insertImage)
            fileUrls.push(itemData.insertImage);
        if (itemData.tracksA && Array.isArray(itemData.tracksA)) {
            itemData.tracksA.forEach((t) => { if (t.audioUrl)
                fileUrls.push(t.audioUrl); });
        }
        if (itemData.tracksB && Array.isArray(itemData.tracksB)) {
            itemData.tracksB.forEach((t) => { if (t.audioUrl)
                fileUrls.push(t.audioUrl); });
        }
        // Se houver arquivos, tentamos deletar cada um do Blob Storage
        if (fileUrls.length > 0) {
            try {
                const { BlobServiceClient } = await Promise.resolve().then(() => __importStar(require('@azure/storage-blob')));
                const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
                const containerName = 'acervomidias';
                if (connectionString) {
                    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
                    const containerClient = blobServiceClient.getContainerClient(containerName);
                    for (const url of fileUrls) {
                        try {
                            // Extrair o nome do blob da URL
                            // Formato: https://<account>.blob.core.windows.net/acervomidias/pasta/nome-arquivo.ext
                            const urlObj = new URL(url);
                            // O pathname será something like "/acervomidias/vinil/arquivo.mp3"
                            // Tiramos a primeira parte (container)
                            const pathParts = urlObj.pathname.split('/');
                            // pathParts[0] é vazio, pathParts[1] é o nome do container
                            const blobName = decodeURIComponent(pathParts.slice(2).join('/'));
                            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                            await blockBlobClient.deleteIfExists();
                            console.log(`Arquivo deletado do Storage: ${blobName}`);
                        }
                        catch (err) {
                            console.warn('Erro ao tentar deletar um blob individual:', err);
                        }
                    }
                }
            }
            catch (storageError) {
                console.error('Falha ao inicializar limpeza de armazenamento:', storageError);
            }
        }
        // Agora excluímos o registro do banco combinando o ID e a Partition Key (type)
        await container.item(id, itemType).delete();
        return res.status(200).json({ message: 'Item e seus arquivos associados foram removidos com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao excluir item:', error);
        return res.status(500).json({ error: 'Erro interno ao exluir item do banco.', details: error.message });
    }
};
exports.deleteAcervoItem = deleteAcervoItem;
