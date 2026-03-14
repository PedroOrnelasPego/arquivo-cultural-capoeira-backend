import { Router } from 'express';
// import { getCDs, createCD } from '../controllers/cd.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: CDs
 *   description: Gerenciamento do Acervo de CDs de Áudio
 */

/**
 * @swagger
 * /api/cds:
 *   get:
 *     summary: Retorna a lista de todos os CDs do Acervo
 *     tags: [CDs]
 *     responses:
 *       200:
 *         description: Lista de CDs do Cosmos DB
 */
router.get('/', (req, res) => res.json({ message: "Rota de GET CDs" }));

/**
 * @swagger
 * /api/cds:
 *   post:
 *     summary: Cadastra um novo CD de Capoeira
 *     tags: [CDs]
 *     responses:
 *       201:
 *         description: CD registrado
 */
router.post('/', (req, res) => res.status(201).json({ message: "Rota de POST CDs" }));

export default router;
