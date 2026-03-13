import { Router } from 'express';
import { getDevices, pairDevice, syncDevice, deleteDevice } from '../controllers/other.controllers';
const r = Router();
r.get('/',         getDevices);
r.post('/pair',    pairDevice);
r.put('/:id/sync', syncDevice);
r.delete('/:id',   deleteDevice);
export default r;
