// auth.routes.ts
import { Router } from 'express';
import { register, login, refreshToken, logout } from '../controllers/auth.controller';
const authRouter = Router();
authRouter.post('/register',      register);
authRouter.post('/login',         login);
authRouter.post('/refresh-token', refreshToken);
authRouter.post('/logout',        logout);
export default authRouter;
