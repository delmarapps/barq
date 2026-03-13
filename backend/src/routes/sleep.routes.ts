import { Router } from 'express';
import { getLastNightSleep, getSleepHistory, logSleep } from '../controllers/sleep.controller';
const r = Router();
r.get('/last-night', getLastNightSleep);
r.get('/history',    getSleepHistory);
r.post('/log',       logSleep);
export default r;
