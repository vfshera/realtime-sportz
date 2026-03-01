import { uaBlocker } from "@hono/ua-blocker";
import {
  useAiRobotsTxt as aiRobotsTxt,
  nonRespectingAiBots,
} from "@hono/ua-blocker/ai-bots";
import { rateLimiter, webSocketLimiter } from "hono-rate-limiter";
import { createMiddleware } from "hono/factory";
import { isbot } from "isbot";
import { env } from "~/env.server";
import { getRealIp, sendMessage } from "./helpers";
import type { AppBindings } from "./types";
import type { NodeWSContext } from "~/types/ws";

/**
 * Generic bot blocker — blocks unknown scrapers/scanners.
 *
 * Allows known good crawlers (Googlebot, Bingbot etc.) through.
 */
const ALLOWED_BOTS = [
  "googlebot",
  "bingbot",
  "duckduckbot",
  "twitterbot",
  "discordbot",
  "slurp",
] as const;

export const botBlocker = createMiddleware<AppBindings>(async (c, next) => {
  const ua = c.req.header("user-agent") ?? "";

  if (isbot(ua) && !ALLOWED_BOTS.some((b) => ua.toLowerCase().includes(b))) {
    return c.json({ error: "Forbidden." }, 403);
  }

  await next();
});

/**
 *  AI bot blocker — blocks GPTBot, Bytespider, CCBot etc. that ignore robots.txt.
 *
 *  Well-behaved AI bots (e.g. those that honour robots.txt) are allowed through.
 */
export const aiBotBlocker = uaBlocker({ blocklist: nonRespectingAiBots });

/**
 *  Robots.txt — auto-generated for all known AI bots
 */
export const robotsTxt = aiRobotsTxt();

/**
 *  HTTP rate limiter.
 *
 *  Default: 50 req / 10s (Min: 10 req / 5s)
 */
export const httpLimiter = rateLimiter<AppBindings>({
  windowMs: env.RATE_LIMIT_HTTP_WINDOW_SEC * 1000,
  limit: env.RATE_LIMIT_HTTP_MAX_REQUESTS,
  keyGenerator: (c) => getRealIp(c),
});

/**
 *  Websocket connection rate limiter.
 *
 *  Default: 5 connections / 2s (Min: 1 connections / 1s)
 */
export const wsConnectionLimiter = rateLimiter<AppBindings>({
  windowMs: env.RATE_LIMIT_WS_CONNECTION_WINDOW_SEC * 1000,
  limit: env.RATE_LIMIT_WS_MAX_CONNECTIONS,
  keyGenerator: (c) => getRealIp(c),
});

/**
 *  Websocket message rate limiter
 *
 *  Default: 20 messages / 5s (Min: 5 messages / 2s)
 */
export const wsMessageLimiter = webSocketLimiter<AppBindings>({
  windowMs: env.RATE_LIMIT_WS_MESSAGE_WINDOW_SEC * 1000,
  limit: env.RATE_LIMIT_WS_MAX_MESSAGES,
  keyGenerator: (c) => getRealIp(c),
  handler: (_, ws) => {
    sendMessage(ws as NodeWSContext, {
      type: "error",
      payload: {
        message: "Message rate limit exceeded.",
      },
    });

    ws.close(1008, "Too many messages");
  },
});
