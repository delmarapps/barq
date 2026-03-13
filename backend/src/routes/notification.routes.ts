import { Router } from 'express';
import { getNotifications, markRead, deleteNotification } from '../controllers/other.controllers';
const r = Router();
r.get('/',           getNotifications);
r.put('/:id/read',   markRead);
r.delete('/:id',     deleteNotification);
export default r;
