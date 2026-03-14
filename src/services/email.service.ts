// SERVIÇO DE EMAIL DESATIVADO
// Como mudamos para a estratégia de Single Sign-On (Entra ID Microsoft), 
// o motor de Nodemailer não é mais estritamente necessário agora e estava
// causando o erro de inicialização. Se no futuro for religar, 
// volte com a lógica e re-instale as dependências.

export const createTransporter = async () => {};
export const sendEmail = async (to: string, subject: string, html: string) => {};
