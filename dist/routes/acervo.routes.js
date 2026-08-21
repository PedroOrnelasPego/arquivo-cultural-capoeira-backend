"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const acervo_controller_1 = require("../controllers/acervo.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Acervo
 *   description: Visão Geral de Todos os Itens do Acervo
 */
/**
 * @swagger
 * /api/acervo:
 *   get:
 *     summary: Retorna todos os itens do banco de dados misturados, ordenados pelos mais recentes
 *     tags: [Acervo]
 *     responses:
 *       200:
 *         description: Lista completa do Acervo
 */
router.get('/', acervo_controller_1.getAcervoCompleto);
/**
 * @swagger
 * /api/acervo/{id}:
 *   delete:
 *     summary: Exclui um item do banco pelo seu ID original (GUID)
 *     tags: [Acervo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deletado
 */
router.delete('/:id', acervo_controller_1.deleteAcervoItem);
exports.default = router;
