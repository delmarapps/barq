import { Router } from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/other.controllers';
const r = Router();
r.get('/',      getGoals);
r.post('/',     createGoal);
r.put('/:id',   updateGoal);
r.delete('/:id',deleteGoal);
export default r;
