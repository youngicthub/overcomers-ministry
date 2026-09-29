import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { allowedOrigins } from "./lib/origin";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Security headers (X-Content-Type-Options, X-Frame-Options, a
// conservative default Content-Security-Policy, HSTS, etc). This is a
// JSON API with no server-rendered HTML views of its own, so CSP is kept
// simple and mainly guards against this origin ever being embedded in a
// clickjacking frame or having its responses sniffed as something else.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);

// Reflects only origins explicitly listed in FRONTEND_ORIGIN (falls back
// to local dev ports) — never `origin: true`. Combined with
// `credentials: true`, blindly reflecting any origin would let any
// website make authenticated (cookie-carrying) requests to this API on
// behalf of a logged-in admin.
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // requests with no Origin header (server-to-server, curl, same-origin
      // in some setups) are allowed through; browser-based cross-site
      // requests always send Origin, and requireMediaAdmin double-checks
      // it again for state-changing admin requests regardless.
      if (!origin || allowedOrigins().includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(cookieParser());
// Caps request body size — comfortably larger than the longest realistic
// article, small enough to blunt request-body-based memory exhaustion.
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

// A generous global ceiling on top of the stricter per-route limiters
// (see routes/admin.ts and routes/public.ts) — mainly to blunt basic
// scraping/DoS-style abuse rather than to shape normal traffic.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use("/api", router);

// Anything under /api that didn't match a route above -> JSON 404, not
// Express's default HTML page.
app.use("/api", notFoundHandler);

// Must be registered last: catches anything thrown or rejected by a
// route above and always responds with JSON. See middlewares/error-handler.ts.
app.use(errorHandler);

export default app;
