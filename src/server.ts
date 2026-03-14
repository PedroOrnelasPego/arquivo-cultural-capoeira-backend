import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import vinilRoutes from './routes/vinil.routes';
import livroRoutes from './routes/livro.routes';
import cdRoutes from './routes/cd.routes';
import acervoRoutes from './routes/acervo.routes';
import uploadRoutes from './routes/upload.routes';
import authRoutes from './routes/auth.routes';
import { authenticateApiKey } from './middlewares/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware de Segurança Intermediária
app.use(cors());
app.use(express.json());

// Rota para visualização e testes do Swagger (Liberada)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota raiz - Health Check (Liberada)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'Online',
    message: 'Servidor Backend do Acervo de Capoeira está rodando.',
    docs: `Acesse http://localhost:${PORT}/api-docs para ver o Swagger.`,
  });
});

// >>> PROTEÇÃO DA API COM CHAVE DE ACESSO <<<
app.use(authenticateApiKey);

// Rotas da API Protegidas
app.use('/api/acervo', acervoRoutes);
app.use('/api/vinis', vinilRoutes);
app.use('/api/livros', livroRoutes);
app.use('/api/cds', cdRoutes);
app.use('/api/uploads', uploadRoutes);

// Rotas de Autenticação (também requerem a chave de API Client)
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📚 Swagger (documentação) disponível em http://localhost:${PORT}/api-docs`);
});
