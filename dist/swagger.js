"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API - Acervo Cultural de Capoeira - ICMBC',
            version: '1.0.0',
            description: 'Documentação do backend em Node.js focado em Vinis de Capoeira e acervos históricos. O Swagger agora suporta autenticação via chave para testes.',
        },
        servers: [
            {
                url: process.env.BACKEND_URL || 'http://localhost:3333',
                description: 'Servidor da API',
            },
        ],
        components: {},
        security: []
    },
    // Define os arquivos onde as tags da documentação vão estar (nas rotas)
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
