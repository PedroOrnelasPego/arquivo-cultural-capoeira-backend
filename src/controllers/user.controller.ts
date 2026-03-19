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
      const formattedUsers = resources.map((user: any) => {
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
   * Adiciona ou Atualiza um Curador (pelo e-mail)
   */
  public async upsertCurator(req: Request, res: Response) {
    try {
      const { email, role, name } = req.body;

      if (!email || !role) {
        return res.status(400).json({ error: 'E-mail e papel (role) são obrigatórios.' });
      }

      const container = await getUsersContainer();
      const normalizedEmail = email.toLowerCase().trim();

      // Verifica se já existe
      const querySpec = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: normalizedEmail }]
      };
      const { resources: users } = await container.items.query(querySpec).fetchAll();

      const SUPER_ADMIN_EMAIL = "contato@capoeiraminasbahia.com.br";
      const requesterEmail = req.header('x-user-email')?.toLowerCase().trim();

      // TRAVA DE SEGURANÇA: Apenas o Administrador Mestre pode gerenciar o painel de curadores
      if (requesterEmail !== SUPER_ADMIN_EMAIL) {
          console.error(`[AUTH] Bloqueio: ${requesterEmail} tentou gerenciar curadores sem permissão de Mestre.`);
          return res.status(403).json({ error: 'Acesso Negado. Apenas o Administrador Mestre pode alterar papéis de curadoria.' });
      }
      
      // Proteção: Não permitir que o próprio admin perca sua role
      if (normalizedEmail === SUPER_ADMIN_EMAIL && role !== 'admin') {
         return res.status(403).json({ error: 'Não é possível remover privilégios do Super Administrador.' });
      }

      const userData = {
        id: users.length > 0 ? users[0].id : Math.floor(1000000 + Math.random() * 9000000).toString(),
        email: normalizedEmail,
        name: name || (users.length > 0 ? users[0].name : 'Novo Usuário'),
        role: role,
        isCurator: role.startsWith('curador-') || normalizedEmail === SUPER_ADMIN_EMAIL,
        updatedAt: new Date().toISOString(),
        isEmailVerified: users.length > 0 ? users[0].isEmailVerified : true 
      };

      const { resource } = await container.items.upsert(userData);

      return res.status(200).json({
        message: 'Curador atualizado com sucesso!',
        user: resource
      });

    } catch (error: any) {
      console.error('Erro ao gerenciar curador:', error);
      return res.status(500).json({ error: 'Falha ao salvar curador no CosmosDB.', details: error.message });
    }
  }

  /**
   * Remove um usuário do banco de dados (Cuidado: Operação destrutiva)
   */
  public async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const container = await getUsersContainer();

      // Buscamos o usuário primeiro para alterar a role
      const { resource: user } = await container.item(id, id).read();
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // 🛑 Em vez de deletar do CosmosDB, apenas removemos o acesso especial (torna-se 'public')
      // Isso atende à regra de que o registro do usuário deve permanecer no sistema
      user.role = 'public';
      user.updatedAt = new Date().toISOString();

      await container.items.upsert(user);

      return res.status(200).json({ message: 'Acesso especial revogado com sucesso. O usuário agora é nível público.' });
    } catch (error: any) {
      console.error('Erro ao revogar acesso do usuário:', error);
      return res.status(500).json({ error: 'Falha ao processar revogação no banco de dados CosmosDB.', details: error.message });
    }
  }
}
