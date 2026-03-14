import { Request, Response, NextFunction } from 'express';

// Lemos a chave fixa e segura do arquivo .env
const API_KEY = process.env.API_SECRET_KEY || 'chave_secreta_padrao_para_dev';

export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  // Ignorar a checagem no Swagger, Health check e Validação de Email Pública
  if (req.path.startsWith('/api-docs') || req.path === '/' || req.path.startsWith('/api/auth/verify')) {
    return next();
  }

  // Esperamos que o front-end envie a chave no header: 'x-api-key'
  const clientApiKey = req.header('x-api-key');

  if (!clientApiKey || clientApiKey !== API_KEY) {
    return res.status(401).json({ 
      error: 'Não autorizado. Chave de API inválida ou não fornecida. (x-api-key)' 
    });
  }

  // Se a chave bateu, o fluxo da request continua
  next();
}
