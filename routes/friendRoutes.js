import express from 'express';
import { acceptRequest, myFriendsData, rejectRequest, sendRequest } from '../controllers/friendController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.use(authMiddleware);


router.post("/request/:email", sendRequest);
router.post("/request/accept/:id", acceptRequest) 
router.post("/request/reject/:id", rejectRequest)
router.get("/me", myFriendsData)

export default router;