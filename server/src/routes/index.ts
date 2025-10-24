import { Request, Response, Router } from "express";

const router = Router();

router.get("/get-tweet", async (req: Request, res: Response) => {
  const lookupTweetById = "";

  console.log(lookupTweetById);
  return {
    data: lookupTweetById,
  };
});

export default router;
