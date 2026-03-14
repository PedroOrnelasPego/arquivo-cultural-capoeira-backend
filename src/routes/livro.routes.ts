import { Router } from 'express';
// import { getLivros, createLivro } from '../controllers/livro.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Livros
 *   description: Gerenciamento do Acervo de Livros e Publicações
 */

/**
 * @swagger
 * /api/livros:
 *   get:
 *     summary: Retorna a lista de todos os livros do Acervo
 *     tags: [Livros]
 *     responses:
 *       200:
 *         description: Lista de livros do Cosmos DB
 */
router.get('/', (req, res) => res.json({ message: "Rota de GET livros" }));

/**
 * @swagger
 * /api/livros:
 *   post:
 *     summary: Cadastra um novo Livro Histórico
 *     tags: [Livros]
 *     responses:
 *       201:
 *         description: Livro registrado
 */
router.post('/', (req, res) => res.status(201).json({ message: "Rota de POST livros" }));

export default router;
