import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';
import FileController from './app/Controllers/FileController';
import AppointmentsControllers from './app/Controllers/AppointmentsControllers';
import ScheduleController from './app/Controllers/ScheduleController';
import UserControllers from './app/Controllers/UserControllers';
import SessionControllers from './app/Controllers/SessionControllers';
import NotificationsController from './app/Controllers/NotificationsController';
import authMiddleware from './app/middlewares/auth';
import ProviderController from './app/Controllers/ProviderController';
import AvailableController from './app/Controllers/AvailableController';

const upload = multer(multerConfig);
const routes = new Router();
routes.get('/teste', AppointmentsControllers.teste);
routes.post('/users', UserControllers.store);
routes.post('/session', SessionControllers.store);
routes.use(authMiddleware);

routes.post('/appointment', AppointmentsControllers.store);
routes.get('/appointment', AppointmentsControllers.index);
routes.get('/teste', AppointmentsControllers.teste);
routes.delete('/appointment/:id', AppointmentsControllers.delete);

routes.put('/update', UserControllers.update);

routes.get('/provider', ProviderController.index);
routes.get('/providers/:providerId/available', AvailableController.index);

routes.get('/schedule', ScheduleController.index);

routes.get('/notifications', NotificationsController.index);
routes.put('/notifications/:id', NotificationsController.update);

routes.post('/files', upload.single('file'), FileController.store);
export default routes;
