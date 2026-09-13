import { Router, type IRouter } from "express";
import {
  GetLiveAnswerQueryParams,
  GetLiveAnswerResponse,
  GetLiveOfferResponse,
  PublishLiveOfferBody,
  PublishLiveOfferResponse,
  StopLiveSessionBody,
  StopLiveSessionResponse,
  SubmitLiveAnswerBody,
  SubmitLiveAnswerResponse,
} from "@workspace/api-zod";
import { requireMediaAdmin } from "../middlewares/requireMediaAdmin";
import {
  getAnswer,
  getOffer,
  liveStatus,
  publishAnswer,
  publishOffer,
  stopLive,
} from "../services/live-state";

const router: IRouter = Router();

router.get("/live/offer", (_req, res) => {
  res.json(GetLiveOfferResponse.parse(getOffer()));
});

router.post("/live/offer", requireMediaAdmin, (req, res) => {
  const parsed = PublishLiveOfferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.status(201).json(
    PublishLiveOfferResponse.parse(
      publishOffer(
        {
          sessionId: parsed.data.sessionId,
          type: parsed.data.type,
          sdp: parsed.data.sdp,
        },
        parsed.data.title,
      ),
    ),
  );
});

router.get("/live/answer", requireMediaAdmin, (req, res) => {
  const parsed = GetLiveAnswerQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(GetLiveAnswerResponse.parse(getAnswer(parsed.data.sessionId)));
});

router.post("/live/answer", (req, res) => {
  const parsed = SubmitLiveAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const accepted = publishAnswer(parsed.data);
  if (!accepted) {
    res.status(400).json({ error: "No matching live session" });
    return;
  }
  res.status(201).json(
    SubmitLiveAnswerResponse.parse({
      id: `answer-${Date.now()}`,
      message: "Live connection answer received.",
    }),
  );
});

router.post("/live/stop", requireMediaAdmin, (req, res) => {
  const parsed = StopLiveSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!stopLive(parsed.data.sessionId)) {
    res.status(404).json({ error: "Live session not found" });
    return;
  }
  res.json(StopLiveSessionResponse.parse(liveStatus));
});

export default router;