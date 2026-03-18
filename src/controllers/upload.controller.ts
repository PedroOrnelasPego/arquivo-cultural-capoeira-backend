import { Request, Response } from 'express';
import { BlobServiceClient } from '@azure/storage-blob';
import crypto from 'crypto';
import path from 'path';

export const uploadFiles = async (req: Request, res: Response) => {
  try {
    // TypeScript check for multer files
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado na requisição.' });
    }

    // A categoria vem do Frontend (vinil, livro, cd) para organizarmos em pastas!
    const categoryFolder = req.body.category ? `${req.body.category}/` : 'outros/';

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = 'acervomidias'; // Nome exato sem traço como foi configurado na Azure!

    if (!connectionString) {
      return res.status(500).json({ error: 'Falta a variável de ambiente AZURE_STORAGE_CONNECTION_STRING' });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Como tentar liberar o acesso público automático via SDK colidiu
    // com a configuração de segurança nativa da Azure ("Public access is not permitted on this storage account"),
    // vamos agora apenas criar o contêiner de forma "Privada", para o código de upload passar direto.
    // Lembre-se que as imagens não abrirão publicamente se não mudar manualmente na Azure o nível "Permitir Acesso Público" lá na Conta de Armazenamento Central.
    await containerClient.createIfNotExists();

    const uploadedFiles = [];

    // Fazemos o upload de todos os arquivos de um por vez para a nuvem
    for (const file of files) {
      // Cria um nome limpo e aleatório pro arquivo não sobrepor os outros que já existem com mesmo nome
      const ext = path.extname(file.originalname);
      const randomPrefix = crypto.randomBytes(6).toString('hex');
      
      // O nome do Blob contém a barra, para simular uma pasta para organização (ex: "vinil/170928...mp3")
      const blobName = `${categoryFolder}${Date.now()}-${randomPrefix}${ext}`;

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Enviando o arquivo fisicamente da memória (RAM) para o Blob Storage
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
      });

      uploadedFiles.push({
        originalName: file.originalname,
        blobName: blobName,
        url: blockBlobClient.url // Caminho final estático (absoluto) para salvar no banco
      });
    }

    return res.status(200).json({
      message: 'Arquivos upados com sucesso para o Azure Blob Storage',
      files: uploadedFiles
    });

  } catch (error: any) {
    console.error('Erro ao enviar os arquivos pro Azure:', error);
    return res.status(500).json({ error: 'Falha interna ao se comunicar com o Azure Blob Storage.', details: error.message });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'A URL do arquivo é obrigatória para exclusão.' });
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = 'acervomidias';

    if (!connectionString) {
      return res.status(500).json({ error: 'Falta a variável de ambiente AZURE_STORAGE_CONNECTION_STRING' });
    }

    // Extrair o nome do blob da URL
    // Ex: https://.../acervomidias/vinil/123.jpg -> vinil/123.jpg
    let blobName = '';
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
      
      // O primeiro segmento é o nome do container, o resto é o caminho do blob
      if (pathParts.length > 1) {
        blobName = decodeURIComponent(pathParts.slice(1).join('/'));
      } else {
        throw new Error('URL format is not as expected (/container/blob)');
      }
    } catch (urlErr: any) {
      console.error('Erro ao processar URL para exclusão:', urlErr);
      return res.status(400).json({ error: 'URL da mídia inválida.', details: urlErr.message });
    }

    console.log(`Tentando excluir blob: "${blobName}" no container: "${containerName}"`);

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();

    return res.status(200).json({ message: 'Arquivo excluído com sucesso do Azure Storage.' });

  } catch (error: any) {
    console.error('Erro fatal ao excluir arquivo do Azure:', error);
    return res.status(500).json({ 
      error: 'Falha ao excluir arquivo do Azure Storage.', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};
