import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';
import FileController from './app/Controllers/FileController';

import UserControllers from './app/Controllers/UserControllers';
import SessionControllers from './app/Controllers/SessionControllers';
import authMiddleware from './app/middlewares/auth';
import ProviderController from './app/Controllers/ProviderController';

const upload = multer(multerConfig);
const routes = new Router();

routes.post('/users', UserControllers.store);
routes.post('/session', SessionControllers.store);
routes.use(authMiddleware);
routes.put('/update', UserControllers.update);
routes.get('/provider', ProviderController.index);
routes.post('/files', upload.single('file'), FileController.store);
export default routes;
