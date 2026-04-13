import { Router, type IRouter } from "express";
import healthRouter from "./health";
import surveyRouter from "./survey";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(surveyRouter);

export default router;
