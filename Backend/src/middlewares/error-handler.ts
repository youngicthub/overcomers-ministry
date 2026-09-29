import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

// Registered last, after every route. Anything that reaches here is a
// bug or a misconfiguration, not an expected validation failure (those
// are all handled inline with their own res.status(...).json(...), so
// they never get here). The important thing is that the client ALWAYS
// gets JSON back — Express's default error page is HTML, which silently
// breaks every frontend fetch() call that expects `{ error: string }`
// and shows up to the user as a generic, unhelpful "Something went
// wrong."
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof Error && err.message === "Not allowed by CORS") {
    res.status(403).json({
      error: "This origin is not allowed to call the API. Check FRONTEND_ORIGIN in Backend/.env.",
    });
    return;
  }

  req.log?.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Something went wrong. Please try again." });
};
