import { Router } from 'express';
import { getLatestRecovery, getRecoveryHistory, logRecovery } from '../controllers/recovery.controller';
const r = Router();
r.get('/latest',  getLatestRecovery);
r.get('/history', getRecoveryHistory);
r.post('/log',    logRecovery);
export default r;
