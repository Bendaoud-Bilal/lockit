import express from "express";
import { CreateSend , GetSendsByUserId , GetSendById, DeleteSendById , updateAccessCount , CreateSendForReceiver , GetEncryptedSendById } from '../controllers/sendController.js';

const router = express.Router();

router.post('/', CreateSend);
router.post('/createSendForReceiver', CreateSendForReceiver);
router.get('/:userId/all', GetSendsByUserId);
router.get('/:id', GetSendById);
router.get('/encrypted/:id', GetEncryptedSendById);
router.delete('/:id', DeleteSendById);
router.put('/:sendId', updateAccessCount);
export default router;