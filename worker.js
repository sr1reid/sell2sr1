import { onRequest as sendConfirmation } from "./functions/api/send-confirmation.js";
import { onRequest as marketplaceComps } from "./functions/api/marketplace-comps.js";
import {
  handleStatusReminderApi,
  handleOneClickStatusUpdate,
  runScheduledStatusReminders
} from "./functions/api/status-reminders.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    // Redirect alternate/legacy domains (sell2sr1.com, selltoosr1.com, www.*) to canonical https://selltosr1.com
    const redirectHosts = new Set([
      "sell2sr1.com",
      "www.sell2sr1.com",
      "selltoosr1.com",
      "www.selltoosr1.com",
      "www.selltosr1.com"
    ]);
    if (redirectHosts.has(host)) {
      const targetUrl = `https://selltosr1.com${url.pathname}${url.search}`;
      return Response.redirect(targetUrl, 301);
    }

    // Route API requests
    if (url.pathname === "/api/send-confirmation" || url.pathname === "/api/send-confirmation/") {
      return sendConfirmation({ request, env, ctx });
    }

    if (url.pathname === "/api/marketplace-comps" || url.pathname === "/api/marketplace-comps/") {
      return marketplaceComps({ request, env, ctx });
    }

    if (url.pathname === "/api/status-reminders" || url.pathname === "/api/status-reminders/") {
      return handleStatusReminderApi({ request, env, ctx });
    }

    if (url.pathname === "/api/update-status" || url.pathname === "/api/update-status/") {
      return handleOneClickStatusUpdate({ request, env, ctx });
    }

    // Pass through all other requests to static assets in ./public
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Asset binding not found", { status: 500 });
  },

  async scheduled(event, env, ctx) {
    // Only execute at 7:00 AM America/New_York (handles both EST and EDT automatically)
    const easternHour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        hour12: false
      }).format(new Date())
    );
    if (easternHour === 7) {
      ctx.waitUntil(runScheduledStatusReminders(env));
    }
  }
};
