"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./swagger");
const vinil_routes_1 = __importDefault(require("./routes/vinil.routes"));
const livro_routes_1 = __importDefault(require("./routes/livro.routes"));
const cd_routes_1 = __importDefault(require("./routes/cd.routes"));
const acervo_routes_1 = __importDefault(require("./routes/acervo.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3333;
// Middleware de Segurança Intermediária
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rota para visualização e testes do Swagger (Liberada)
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// Rota raiz - Health Check (Liberada)
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'Online',
        message: `Servidor Backend do Acervo de Capoeira está rodando. Versão: ${process.env.npm_package_version}`,
        docs: `Acesse ${process.env.BACKEND_URL || 'http://localhost:' + PORT}api-docs para ver o Swagger.`,
    });
});
// A API do Acervo agora delega a segurança/usuários para a aplicação consumidora (Minas Bahia)
// Rotas da API Protegidas pelo Role-Based Access Control
app.use('/api/acervo', acervo_routes_1.default);
app.use('/api/vinis', vinil_routes_1.default);
app.use('/api/livros', livro_routes_1.default);
app.use('/api/cds', cd_routes_1.default);
app.use('/api/uploads', upload_routes_1.default);
// Fim rotas Acervo
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📚 Swagger (documentação) disponível em http://localhost:${PORT}/api-docs`);
});
