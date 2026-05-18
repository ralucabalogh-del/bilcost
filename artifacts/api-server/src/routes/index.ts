import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bilcostRouter from "./bilcost";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bilcostRouter);

export default router;
