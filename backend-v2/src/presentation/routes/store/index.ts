import type { FastifyInstance } from "fastify";
import { cartRoutes } from "./carts.js";
import { paymentRoutes } from "./payments.js";

export async function storeRoutes(
  fastify: FastifyInstance,
  opts: { container: unknown }
) {
  // Health check
  fastify.get("/custom", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Register all store sub-routes
  await fastify.register(cartRoutes, { container: opts.container } as any);
  await fastify.register(paymentRoutes, { container: opts.container } as any);
}
