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
