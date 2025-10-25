import { Router } from "express";
import { handleTwitterCallback, initiateTwitterOath } from "../controller";
import { validate } from "../middleware";
import { twitterCallbackSchema } from "../utils";

const router = Router();

router.get("/twitter", initiateTwitterOath);
router.get(
  "/twitter/callback",
  validate(twitterCallbackSchema),
  handleTwitterCallback,
);

export default router;
