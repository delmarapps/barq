import { Router } from 'express';
import { getTodayActivities, startActivity, endActivity, getActivityHistory, deleteActivity } from '../controllers/activity.controller';
const r = Router();
r.get('/today',    getTodayActivities);
r.get('/history',  getActivityHistory);
r.post('/start',   startActivity);
r.put('/:id/end',  endActivity);
r.delete('/:id',   deleteActivity);
export default r;
