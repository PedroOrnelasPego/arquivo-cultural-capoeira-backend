import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - Acervo Cultural de Capoeira',
      version: '1.0.0',
      description: 'Documentação do backend em Node.js focado em Vinis de Capoeira e acervos históricos. O Swagger agora suporta autenticação via chave para testes.',
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:3333',
        description: 'Servidor da API',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'A chave de acesso da API definida no arquivo .env'
        }
      }
    },
    security: [{
      ApiKeyAuth: []
    }]
  },
  // Define os arquivos onde as tags da documentação vão estar (nas rotas)
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
