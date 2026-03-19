import { Request, Response } from 'express';
import { getUsersContainer } from '../config/cosmos';

export class UserController {
  /**
   * Retorna a lista completa de usuários cadastrados (Database Users -> Items)
   */
  public async getAllUsers(req: Request, res: Response) {
    try {
      const container = await getUsersContainer();
      const { resources } = await container.items.query('SELECT * FROM c ORDER BY c._ts DESC').fetchAll();

      // Mapeamento simples para esconder informações sensíveis se necessário
      const formattedUsers = resources.map(user => {
        const { password, verificationToken, resetPasswordToken, ...safeUser } = user;
        return safeUser;
      });

      return res.status(200).json(formattedUsers);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar lista de usuários.', details: error.message });
    }
  }

  /**
   * Busca um usuário específico pelo ID
   */
  public async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const container = await getUsersContainer();

      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }]
      };
      
      const { resources } = await container.items.query(querySpec).fetchAll();

      if (!resources || resources.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const { password, ...safeUser } = resources[0];
      return res.status(200).json(safeUser);
    } catch (error: any) {
      console.error('Erro ao buscar usuário por ID:', error);
      return res.status(500).json({ error: 'Falha ao buscar detalhes do usuário.', details: error.message });
    }
  }

  /**
   * Remove um usuário do banco de dados (Cuidado: Operação destrutiva)
   */
  public async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const container = await getUsersContainer();

      // No Cosmos, para deletar precisamos do ID e da Partition Key (que definimos como /id no print anterior)
      await container.item(id, id).delete();

      return res.status(200).json({ message: 'Usuário removido com sucesso do sistema.' });
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      return res.status(500).json({ error: 'Falha ao remover usuário do CosmosDB.', details: error.message });
    }
  }
}
