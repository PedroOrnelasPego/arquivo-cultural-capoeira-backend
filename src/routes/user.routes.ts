import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Gerenciamento dos Curadores e Administradores (Database Users -> Items)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retorna a lista de todos os usuários cadastrados
 *     tags: [Usuários]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários do banco CosmosDB 'Users'
 *       401:
 *         description: Não autorizado (Chave de API ausente ou inválida)
 *       500:
 *         description: Erro no Servidor
 */
router.get('/', userController.getAllUsers.bind(userController));
router.post('/curators', userController.upsertCurator.bind(userController));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Busca detalhes de um usuário específico pelo ID
 *     tags: [Usuários]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: O ID único do usuário no CosmosDB
 *     responses:
 *       200:
 *         description: Dados do usuário encontrados
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', userController.getUserById.bind(userController));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Remove um usuário do sistema permanentemente
 *     tags: [Usuários]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário a ser deletado
 *     responses:
 *       200:
 *         description: Usuário removido com sucesso
 *       500:
 *         description: Falha ao deletar do banco
 */
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;
