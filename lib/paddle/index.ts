import { Environment, Paddle } from "@paddle/paddle-node-sdk";

/** NEXT_PUBLIC_PADDLE_ENV drives both this (server SDK) and the client-side
 * Paddle.js init — keeping one env var as the single source of truth means
 * they can't drift apart and start hitting different Paddle environments. */
function paddleEnvironment(): Environment {
  return process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? Environment.production : Environment.sandbox;
}

export function createPaddleClient(): Paddle {
  const key = process.env.PADDLE_API_KEY;
  if (!key) {
    throw new Error("PADDLE_API_KEY is not configured");
  }
  return new Paddle(key, { environment: paddleEnvironment() });
}

export function createPaddleClientSafe(): Paddle | null {
  if (!process.env.PADDLE_API_KEY) return null;
  return createPaddleClient();
}
