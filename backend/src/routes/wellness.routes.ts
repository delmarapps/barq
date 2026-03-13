import { Router } from 'express';
import { getToday, getHistory, getWeeklySummary } from '../controllers/wellness.controller';
const r = Router();
r.get('/today',          getToday);
r.get('/history',        getHistory);
r.get('/weekly-summary', getWeeklySummary);
export default r;
