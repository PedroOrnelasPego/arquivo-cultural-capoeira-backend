import { Request, Response, NextFunction } from 'express';

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
 * Middleware para autorizar apenas o Super Admin Mestre a realizar alterações (POST, PUT, DELETE)
 */
export function authorizeSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const SUPER_ADMIN_EMAIL = "contato@capoeiraminasbahia.com.br";
  const userEmail = req.header('x-user-email');

  // Operações de leitura (GET) são permitidas para todos com a API KEY
  if (req.method === 'GET') {
    return next();
  }

  if (!userEmail || userEmail.toLowerCase().trim() !== SUPER_ADMIN_EMAIL) {
    console.error(`[AUTH] Tentativa de escrita negada para o usuário: ${userEmail || 'Anônimo'}`);
    return res.status(403).json({ 
      error: 'Acesso Negado. Apenas o administrador mestre (Contato Minas Bahia) tem permissão para realizar alterações no acervo ou gerenciar usuários.' 
    });
  }

  next();
}
