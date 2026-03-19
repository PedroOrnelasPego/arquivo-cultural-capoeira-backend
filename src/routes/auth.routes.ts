import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// @route   POST /api/auth/register
// @desc    Registra novo usuário no container 'Users'
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Autentica usuário e retorna JWT
router.post('/login', authController.login);

// @route   GET /api/auth/verify/:token
// @desc    Valida click no link do e-mail simulado
router.get('/verify/:token', authController.verifyEmail.bind(authController));

// @route   POST /api/auth/forgot-password
// @desc    Envia e-mail com link para recuperar senha
router.post('/forgot-password', authController.requestPasswordReset.bind(authController));

// @route   POST /api/auth/sync-microsoft
// @desc    Sincroniza perfil Microsoft Entra no CosmosDB Database Users
router.post('/sync-microsoft', authController.syncMicrosoftProfile.bind(authController));

export default router;
