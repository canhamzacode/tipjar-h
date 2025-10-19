import express from "express";
import config from "./config/config";
import { errorHandler } from "./middleware";
import appROute from "./routes";
import { BOT_USERNAME, pollMentions } from "./utils/pool";

const app = express();

app.use("/api/v1", appROute);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  setInterval(pollMentions, 60_000);

  console.log(`🤖 ${BOT_USERNAME} is running with DB tracking...`);
});
