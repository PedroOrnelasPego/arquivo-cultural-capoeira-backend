"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload_controller_1 = require("../controllers/upload.controller");
const router = (0, express_1.Router)();
// Configuramos o Multer para pegar os binários brutos pra RAM (memory) em vez do disco HD da máquina virtual
const storageConfig = multer_1.default.memoryStorage();
const uploadMiddleware = (0, multer_1.default)({
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
router.post('/', uploadMiddleware.array('arquivos'), upload_controller_1.uploadFiles);
router.delete('/', upload_controller_1.deleteFile);
exports.default = router;
