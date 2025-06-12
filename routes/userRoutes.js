import express from 'express'
import authMiddleware from '../middlewares/auth.js';
import { getUser, redirectUser, updateUser } from '../controllers/userController.js';


const router = express.Router();

router.use(authMiddleware);

router.get("/", getUser)
router.post("/", updateUser)
router.post("/redirect", redirectUser)

export default router;