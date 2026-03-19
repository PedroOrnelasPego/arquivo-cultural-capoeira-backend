import { Request, Response, NextFunction } from 'express';
import { getUsersContainer } from '../config/cosmos';

const API_KEY = process.env.API_SECRET_KEY || 'CapoeiraAcervo2026DevSecretKey';

export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  // Ignorar a checagem no Swagger, Health check e Validação de Email Pública
  if (req.path.startsWith('/api-docs') || req.path === '/' || req.path.startsWith('/api/auth/verify')) {
    return next();
  }

  // Esperamos que o front-end envie a chave no header: 'x-api-key'
  const clientApiKey = req.header('x-api-key');

  console.log('--- Auth Debug ---');
  console.log('Path:', req.path);
  console.log('Recebida via Header (clientApiKey):', clientApiKey);
  console.log('Esperada no Backend (API_KEY):', API_KEY);
  console.log('Resultado da Comparação:', clientApiKey === API_KEY);
  console.log('------------------');

  if (!clientApiKey || clientApiKey !== API_KEY) {
    return res.status(401).json({ 
      error: 'Não autorizado. Chave de API inválida ou não fornecida. (x-api-key)' 
    });
  }

  // Se a chave bateu, o fluxo da request continua
  next();
}

/**
 * Middleware para autorizar papéis específicos baseado no método da requisição
 * Regras:
 * - POST: admin, editor, editor-add
 * - PUT: admin, editor, editor-edit
 * - DELETE: admin
 */
export async function authorizeSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const SUPER_ADMIN_EMAIL = "contato@capoeiraminasbahia.com.br";
  const userEmail = req.header('x-user-email');

  // Operações de leitura (GET) são permitidas para todos com a API KEY válida
  if (req.method === 'GET') {
    return next();
  }

  if (!userEmail) {
    return res.status(401).json({ error: 'Identificação de usuário (e-mail) ausente.' });
  }

  const normalizedEmail = userEmail.toLowerCase().trim();

  // 1. Super Admin Mestre sempre tem acesso total
  if (normalizedEmail === SUPER_ADMIN_EMAIL) {
    return next();
  }

  try {
    const container = await getUsersContainer();
    const querySpec = {
      query: "SELECT c.role FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: normalizedEmail }]
    };
    const { resources: users } = await container.items.query(querySpec).fetchAll();
    
    const role = (users && users.length > 0) ? users[0].role : 'public';

    // 2. Lógica de Permissões Granulares
    if (req.method === 'POST') {
      if (role === 'curador-total' || role === 'curador-add') return next();
    } 
    else if (req.method === 'PUT' || req.method === 'PATCH') {
      if (role === 'curador-total' || role === 'curador-edit') return next();
    }
    else if (req.method === 'DELETE') {
      // Deletar via de regra apenas o Admin mestre (já checado acima), 
      // mas se quisermos liberar pro 'editor' total, descomente abaixo:
      // if (role === 'editor') return next();
    }

    console.error(`[AUTH] Acesso negado para ${normalizedEmail} (${role}) tentando ${req.method} em ${req.path}`);
    return res.status(403).json({ 
      error: 'Acesso Negado. Você não tem permissão suficiente para esta operação.',
      requiredRole: req.method === 'POST' ? 'editor-add ou editor' : req.method === 'DELETE' ? 'admin' : 'editor-edit ou editor'
    });

  } catch (error) {
    console.error('Erro ao verificar permissões no banco:', error);
    return res.status(500).json({ error: 'Falha interna ao verificar autorização.' });
  }
}
