import { Router } from 'express';
import { getVinis, getVinisNomes, createVinil, updateVinil } from '../controllers/vinil.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Vinis
 *   description: Gerenciamento do Acervo de Discos de Vinil (LPs)
 */

/**
 * @swagger
 * /api/vinis:
 *   get:
 *     summary: Retorna a lista de todos os vinis do Acervo (Tipo = Vinil)
 *     tags: [Vinis]
 *     responses:
 *       200:
 *         description: Lista de vinis do Cosmos DB
 *       500:
 *         description: Erro no Servidor
 */
router.get('/', getVinis);

/**
 * @swagger
 * /api/vinis/nomes:
 *   get:
 *     summary: Retorna a lista simplificada com apenas Nome e Autor dos Vinis
 *     tags: [Vinis]
 *     responses:
 *       200:
 *         description: Lista projetada apenas com (id, title, author) melhorando o payload.
 *       500:
 *         description: Erro no Servidor
 */
router.get('/nomes', getVinisNomes);

/**
 * @swagger
 * /api/vinis:
 *   post:
 *     summary: Cadastra um novo Vinil Histórico
 *     tags: [Vinis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *             example:
 *               type: "vinil"
 *               title: "Capoeira Cordão de Ouro Volume 3"
 *               author: "Mestre Suassuna e Dirceu"
 *               recordLabel: "Gravodisc"
 *               country: "Brasil"
 *               year: 1983
 *               description: "Gravação original contendo grandes cantigas de capoeira regional."
 *               tracksA:
 *                 - id: "1773250963906"
 *                   side: "A"
 *                   order: 1
 *                   name: "Maculelê"
 *                   artists: "Mestre Bimba e Alunos"
 *                   duration: "03:45"
 *                   audioUrl: "https://acervocapoeiramidias.blob.core.windows.net/acervomidias/vinil/audio-lado-a.mp3"
 *                 - id: "1773251018744"
 *                   side: "A"
 *                   order: 2
 *                   name: "O Mundo De Deus É Grande"
 *                   artists: ""
 *                   duration: "04:20"
 *                   audioUrl: null
 *               tracksB:
 *                 - id: "1773251021339"
 *                   side: "B"
 *                   order: 1
 *                   name: "Capoeira Ligeira"
 *                   artists: "Mestre Pastinha"
 *                   duration: "02:50"
 *                   audioUrl: null
 *               image: "https://acervocapoeiramidias.blob.core.windows.net/acervomidias/vinil/1773251110903-8211a61f56ae.jpeg"
 *               backImage: "https://acervocapoeiramidias.blob.core.windows.net/acervomidias/vinil/1773251110960-8d04dc59d01d.jpeg"
 *               insertImage: "https://acervocapoeiramidias.blob.core.windows.net/acervomidias/vinil/1773251111026-df86e963f474.jpg"
 *     responses:
 *       201:
 *         description: Vinil registrado com sucesso
 *       400:
 *         description: Erro de Validação de dados de schema
 *       500:
 *         description: Erro no servidor ou banco de dados
 */
router.post('/', createVinil);

/**
 * @swagger
 * /api/vinis/{id}:
 *   put:
 *     summary: Edita um Vinil (e suas faixas/imagens)
 *     tags: [Vinis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               type: "vinil"
 *               title: "Capoeira Cordão de Ouro Volume 3 (Edição Limitada)"
 *               author: "Mestre Suassuna e Dirceu"
 *               recordLabel: "Gravodisc"
 *               country: "Brasil"
 *               year: 1983
 *               description: "Editando a obra com a descrição nova e mais faixas..."
 *               tracksA:
 *                 - id: "1773250963906"
 *                   side: "A"
 *                   order: 1
 *                   name: "Maculelê Remasterizado"
 *                   duration: "03:45"
 *                   audioUrl: "https://acervocapoeiramidias.blob.core.windows.net/acervomidias/vinil/audio.mp3"
 *               tracksB: []
 *               image: "https://acervocapoeiramidias.blob.core.windows.net/acervomidias/vinil/1773251110903.jpeg"
 *               backImage: "https://acervocapoeiramidias.blob.core.windows.net/acervomidias/vinil/1773251110960.jpeg"
 *               insertImage: null
 *     responses:
 *       200:
 *         description: Vinil atualizado
 */
router.put('/:id', updateVinil);

export default router;
