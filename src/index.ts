import express, {
  Request,
  Response,
  Application,
  urlencoded,
  json,
  NextFunction,
} from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import session from "express-session";
import cookieParser from "cookie-parser";
import config from "./config/config";
import routes from "./routes";

const app: Application = express();
const server = createServer(app);
const { PORT: port, DB_URL } = config;
process.setMaxListeners(1);

const { connect, connection } = mongoose;
try {
  connect(DB_URL, { autoIndex: true });
  connection.on("error", (error) => console.log(`error in mongodb connection, ${error}`));
  connection.on("reconnected", () => console.log("Trying to reconnect"));
  connection.on("disconnected", () => console.log("disconnected"));
  connection.on("connected", () => {
    console.log("Connected");
  });
  /** Middleware Configuration */
  app.disable("x-powered-by");
  app.use(urlencoded({ limit: "100mb", extended: true })); // Parse application/x-www-form-urlencoded
  app.use(json({ limit: "100mb" })); // Initializing/Configuration
  app.use(cookieParser("karthikeyanSiteCookies")); // cookieParser - Initializing/Configuration cookie: {maxAge: 8000},
  app.use(
    session({
      secret: "karthikeyanSiteCookies",
      resave: true,
      saveUninitialized: true,
    }),
  ); // express-session - Initializing/Configuration
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    next();
  });
  app.use(cors({ origin: true, credentials: true }));

  /* Dpendency mapping */
  app.use("/admin", routes);
  /* Dependency mapping */
  if (process.env.NODE_ENV !== "test") {
    server.listen(port, () => {
      console.log(`server turned on ${port}`);
    });
  }
} catch (error) {
  console.error(`error in server ${error}`);
}

export default app;
