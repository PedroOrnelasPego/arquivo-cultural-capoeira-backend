"use strict";
// SERVIÇO DE EMAIL DESATIVADO
// Como mudamos para a estratégia de Single Sign-On (Entra ID Microsoft), 
// o motor de Nodemailer não é mais estritamente necessário agora e estava
// causando o erro de inicialização. Se no futuro for religar, 
// volte com a lógica e re-instale as dependências.
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.createTransporter = void 0;
const createTransporter = async () => { };
exports.createTransporter = createTransporter;
const sendEmail = async (to, subject, html) => { };
exports.sendEmail = sendEmail;
