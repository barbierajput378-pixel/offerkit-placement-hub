import { Router, type IRouter } from "express";
import healthRouter from "./health";
import offerkitRouter from "./offerkit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(offerkitRouter);

export default router;
