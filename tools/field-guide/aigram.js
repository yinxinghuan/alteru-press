// AlterU Press · Field Guide · re-export shared bridge.
// All Aigram bridging lives in ../../shared/bridge.js (verbatim port of
// platform's official runtime/bridge.ts).
export {
  api_origin,
  telegramId,
  isInAigram,
  callAigramAPI,
  postAigramAPI,
  openAigramProfile,
  openAigramPost,
  postToFeed,
} from "../../shared/bridge.js";

import { isInAigram, fetchCurrentUser } from "../../shared/bridge.js";

// Backwards-compatible shape used by app.js
export const aigramCtx = { isInside: isInAigram };
export const fetchUser = fetchCurrentUser;
