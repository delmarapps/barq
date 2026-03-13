import { Router } from 'express';
import { getProfile, updateProfile, updateLanguage, deleteAccount } from '../controllers/other.controllers';
const r = Router();
r.get('/',          getProfile);
r.put('/',          updateProfile);
r.put('/language',  updateLanguage);
r.delete('/',       deleteAccount);
export default r;
