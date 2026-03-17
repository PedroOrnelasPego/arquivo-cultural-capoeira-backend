import { Router } from 'express';
import multer from 'multer';
import { uploadFiles, deleteFile } from '../controllers/upload.controller';

const router = Router();

// Configuramos o Multer para pegar os binários brutos pra RAM (memory) em vez do disco HD da máquina virtual
const storageConfig = multer.memoryStorage();
const uploadMiddleware = multer({
  storage: storageConfig,
  limits: {
    fileSize: 50 * 1024 * 1024, // Limite brutal de 50MB por arquivo para aguentar PDF dos livros gigantes e FLAC/WAV se necessário
  }
});

/**
 * @swagger
 * tags:
 *   name: Midias (Storage)
 *   description: Armazenamento e upload no Azure Blob Storage
 */

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Envia entre 1 a X arquivos multiformes (Imagens/Sons) para a Nuvem de uma só vez
 *     tags: [Midias (Storage)]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               arquivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Arquivos enviados, retornando vetor com as URLs definitivas
 *       400:
 *         description: Nenhum arquivo anexo
 */
router.post('/', uploadMiddleware.array('arquivos'), uploadFiles);
router.delete('/', deleteFile);

export default router;
