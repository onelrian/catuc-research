import serverless from "serverless-http";
import app from "../../../api-server/src/app";
import { type Config } from "@netlify/functions";

export default serverless(app);

export const config: Config = {
  path: "/api/*",
};
