import { onRequest as sendConfirmation } from "./functions/api/send-confirmation.js";
import { onRequest as marketplaceComps } from "./functions/api/marketplace-comps.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route API requests
    if (url.pathname === "/api/send-confirmation" || url.pathname === "/api/send-confirmation/") {
      return sendConfirmation({ request, env, ctx });
    }

    if (url.pathname === "/api/marketplace-comps" || url.pathname === "/api/marketplace-comps/") {
      return marketplaceComps({ request, env, ctx });
    }

    // Pass through all other requests to static assets in ./public
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Asset binding not found", { status: 500 });
  }
};
