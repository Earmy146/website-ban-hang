import { Router } from 'express';
import coreRoutes from './coreRoutes.js';
import catalogRoutes from './catalogRoutes.js';
import operationsRoutes from './operationsRoutes.js';
import crmFinanceRoutes from './crmFinanceRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';
import storefrontRoutes from './storefrontRoutes.js';

const apiRouter = Router();

apiRouter.use('/store', storefrontRoutes);
apiRouter.use(coreRoutes);
apiRouter.use(catalogRoutes);
apiRouter.use(operationsRoutes);
apiRouter.use(crmFinanceRoutes);
apiRouter.use(workspaceRoutes);

export default apiRouter;
