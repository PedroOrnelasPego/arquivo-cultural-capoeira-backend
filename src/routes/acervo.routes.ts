import { Router } from 'express';
import { getAcervoCompleto, deleteAcervoItem } from '../controllers/acervo.controller';

const router = Router();

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
router.get('/', getAcervoCompleto);

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
router.delete('/:id', deleteAcervoItem);

export default router;
