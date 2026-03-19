import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getUsersContainer } from '../config/cosmos';
// import { sendEmail } from '../services/email.service';

const JWT_SECRET = process.env.API_SECRET_KEY || 'CapoeiraAcervoProd2026';

export class AuthController {
  
  public async register(req: Request, res: Response) {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
      }

      const container = await getUsersContainer();

      // Verifica se e-mail já existe (CosmosDB cross-partition query)
      const querySpec = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      };
      const { resources: existingUsers } = await container.items.query(querySpec).fetchAll();

      if (existingUsers && existingUsers.length > 0) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }

      // Hash da senha com sal extra (10 rounds)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const verificationToken = crypto.randomBytes(32).toString('hex');

      const newUser = {
        id: new Date().getTime().toString(),
        email,
        password: hashedPassword,
        name,
        role: role || 'public', // 'admin', 'editor', ou 'public'
        isEmailVerified: false, // Flag bloqueadora de Login
        verificationToken,      // Token gerado na URL 
        createdAt: new Date().toISOString()
      };

      const { resource } = await container.items.create(newUser);

      const confirmationLink = `${process.env.BACKEND_URL}/api/auth/verify/${verificationToken}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: #0f172a; margin-bottom: 5px;">🎵 Arquivo Cultural de Capoeira</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 0;">Sistema Administrativo</p>
          </div>
          
          <h2 style="color: #334155;">Olá, ${name}! Quase lá...</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            Recebemos seu pedido de cadastro para acesso ao Acervo. Para sua segurança, você precisa confirmar o seu endereço de e-mail antes de começar a editar ou adicionar mídias.
          </p>
          
          <a href="${confirmationLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block;">
            Confirmar e Ativar a Minha Conta
          </a>
          
          <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            P.S: Este é um e-mail de teste. No futuro usaremos o Gmail da academia. Se você não solicitou este e-mail, pode ignorá-lo com segurança.
          </p>
        </div>
      `;

      // Chamamos agora a API Real em vez do console! (Desligado)
      // await sendEmail(email, "Ativação de Conta - Acervo Capoeira", emailHtml);
      console.log(`[VERIFICAÇÃO DE E-MAIL] Link gerado para ${email}: ${confirmationLink}`);

      // Não devover a senha
      if (resource) {
        delete resource.password;
      }

      return res.status(201).json({ 
        message: 'Conta criada com sucesso!', 
        user: resource 
      });

    } catch (error) {
      console.error('Erro no registro de usuário:', error);
      return res.status(500).json({ error: 'Falha interna ao criar usuário.' });
    }
  }

  public async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Preencha e-mail e senha.' });
      }

      const container = await getUsersContainer();

      const querySpec = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      };
      const { resources: users } = await container.items.query(querySpec).fetchAll();

      if (!users || users.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const user = users[0];

      // Bloqueia com a nova regra caso não tenha confirmado o e-mail no ato da criação
      if (user.isEmailVerified === false) {
        return res.status(403).json({ 
          error: 'Ativação pendente! Por favor, clique no link que enviamos ao seu e-mail para validar a conta no primeiro acesso.',
          unverified: true 
        });
      }

      // Compara a senha informada com a hash salva
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Cria token de acesso JWT (vence em 24h)
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      delete user.password;

      return res.status(200).json({
        message: 'Login bem-sucedido!',
        token,
        user
      });

    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Falha interna no login.' });
    }
  }

  public async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const container = await getUsersContainer();

      const querySpec = {
        query: "SELECT * FROM c WHERE c.verificationToken = @token",
        parameters: [{ name: "@token", value: token }]
      };
      
      const { resources: users } = await container.items.query(querySpec).fetchAll();
      
      if (!users || users.length === 0) {
        return res.status(400).send(`
          <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #ef4444;">Link de ativação expirado ou inválido</h1>
            <p>O token de confirmação não foi encontrado. Talvez sua conta já tenha sido ativada.</p>
          </div>
        `);
      }

      const user = users[0];
      user.isEmailVerified = true;
      user.verificationToken = null; // Remove o token que acabou de ser usado pra não ser reaproveitado

      await container.items.upsert(user); // Grava os dados ativados da partição

      // Redireciona o usuário pra interface react que capturará o param verified!
      res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
    } catch (error) {
       console.error('Erro na verificação de email:', error);
       res.status(500).send("Falha interna ao validar token do servidor.");
    }
  }

  public async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const container = await getUsersContainer();

      const querySpec = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      };
      const { resources: users } = await container.items.query(querySpec).fetchAll();

      // Por segurança, mesmo se o e-mail não existir, mostramos a mesma mensagem (evita brute force)
      if (users && users.length > 0) {
        const user = users[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Vamos guardar o token e um timestamp de expiração (1h de validade)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 Hora

        await container.items.upsert(user); // Salva as alterações

        const resetLink = `${process.env.FRONTEND_URL}/login?reset=${resetToken}`;
        
        const resetHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
            <div style="background-color: #fce7f3; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h1 style="color: #be185d; margin-bottom: 5px;">🎵 Arquivo Cultural de Capoeira</h1>
              <p style="color: #9d174d; font-size: 14px; margin-top: 0;">Recuperação de Senha</p>
            </div>
            
            <h2 style="color: #334155;">Olá, ${user.name}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              Recebemos uma solicitação para redefinir a palavra-passe da sua conta. Caso tenha sido você, clique no link abaixo.
            </p>
            
            <a href="${resetLink}" style="background-color: #be185d; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block;">
              Criar Nova Senha
            </a>
            
            <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">
              Atenção: Este link expira em 1 hora. Se você não solicitou este e-mail, ignore-o e sua senha continuará a mesma.
            </p>
          </div>
        `;

        // await sendEmail(user.email, "Recuperação de Senha Segura", resetHtml);
        console.log(`[RECUPERAÇÃO DE SENHA] Link gerado para ${user.email}: ${resetLink}`);
      }

      return res.status(200).json({ 
        message: 'Se este e-mail estiver cadastrado, nós lhe enviaremos as instruções de recuperação em alguns segundos.' 
      });

    } catch (error) {
      console.error('Erro na solicitação de redefinição:', error);
      return res.status(500).json({ error: 'Erro de conexão ao solicitar recuperação.' });
    }
  }

  public async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      const container = await getUsersContainer();

      const querySpec = {
        query: "SELECT * FROM c WHERE c.resetPasswordToken = @token",
        parameters: [{ name: "@token", value: token }]
      };
      
      const { resources: users } = await container.items.query(querySpec).fetchAll();
      
      if (!users || users.length === 0) {
        return res.status(400).json({ error: 'Link de recuperação expirado ou inválido.' });
      }

      const user = users[0];

      // Checa se já expurou o timeout de 1 hora
      if (user.resetPasswordExpires < Date.now()) {
        return res.status(400).json({ error: 'O link já passou da validade de 1 hora. Solicite outro.' });
      }

      // Tudo ok! Vamos converter a senha pra Hash de novo
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      
      // Limpar os tokens pra não ser usado de novo
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      await container.items.upsert(user);

      return res.status(200).json({ message: 'Senha redefinida com extremo sucesso! Você já pode entrar.' });

    } catch (error) {
      console.error('Erro ao redefinir a senha:', error);
      return res.status(500).json({ error: 'Erro de conexão no servidor.' });
    }
  }

  /**
   * Sincroniza o perfil vindo do Microsoft Entra ID com o CosmosDB (Database AcervoCulturalDB -> Curadores)
   */
  public async syncMicrosoftProfile(req: Request, res: Response) {
    try {
      const { email, name, microsoftId } = req.body;

      console.log(`[AUTH] Recebendo sync para: ${email} (${name})`);

      if (!email || !name) {
        console.warn('[AUTH] Dados insuficientes em syncMicrosoftProfile:', req.body);
        return res.status(400).json({ error: 'Dados insuficientes para sincronização.' });
      }

      const container = await getUsersContainer();
      const normalizedEmail = email.toLowerCase().trim();

      // Buscamos se o usuário já existe na base
      const querySpec = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: normalizedEmail }]
      };
      
      const { resources: users } = await container.items.query(querySpec).fetchAll();
      
      // Regra do Super Admin Único (Como solicitado: apenas este e-mail pode editar/remover)
      const SUPER_ADMIN_EMAIL = "contato@capoeiraminasbahia.com.br";
      let userRole = 'public';
      
      if (normalizedEmail === SUPER_ADMIN_EMAIL) {
        userRole = 'admin';
        console.log(`[AUTH] Super Admin detectado: ${normalizedEmail}`);
      }

      // Se o usuário já existia (ex: foi pré-cadastrado no painel adm), usamos o ID dele
      const existingUser = users.length > 0 ? users[0] : null;

      const userData = {
        id: existingUser ? existingUser.id : this.generateNumericId(),
        email: normalizedEmail,
        name: name,
        // Se já existia, mantém a role antiga e o status de curador
        role: existingUser ? (normalizedEmail === SUPER_ADMIN_EMAIL ? 'admin' : existingUser.role) : userRole,
        isCurator: existingUser ? (normalizedEmail === SUPER_ADMIN_EMAIL ? true : existingUser.isCurator) : (normalizedEmail === SUPER_ADMIN_EMAIL),
        microsoftId: microsoftId,
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEmailVerified: true 
      };

      console.log(`[AUTH] Persistindo usuário: ${userData.email} com role: ${userData.role} (Curador: ${userData.isCurator})`);

      // Upsert: Cria ou Atualiza
      const { resource } = await container.items.upsert(userData);

      return res.status(200).json({
        message: 'Perfil sincronizado com sucesso!',
        user: resource
      });

    } catch (error: any) {
      console.error('Erro ao sincronizar perfil Microsoft:', error);
      return res.status(500).json({ error: 'Falha interna ao sincronizar dados no CosmosDB.', details: error.message });
    }
  }

  /**
   * Função para gerar ID Numérico Aleatório de exatamente 7 dígitos
   */
  private generateNumericId(): string {
    const min = 1000000; // Início dos 7 dígitos
    const max = 9999999; // Fim dos 7 dígitos
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }
}
