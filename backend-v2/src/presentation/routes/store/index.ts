import type { FastifyInstance } from "fastify";
import type { Container } from "../../../container.js";
import { regionRoutes } from "./regions.js";
import { productRoutes } from "./products.js";
import { cartRoutes } from "./carts.js";
import { customerRoutes } from "./customers.js";
import { orderRoutes } from "./orders.js";
import { catalogRoutes } from "./catalog.js";
import { paymentCollectionRoutes } from "./payment-collections.js";
import { paymentRoutes } from "./payments.js";

export async function storeRoutes(
  fastify: FastifyInstance,
  opts: { container: Container }
) {
  // Health check
  fastify.get("/custom", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Register all store sub-routes
  await fastify.register(regionRoutes, { container: opts.container } as any);
  await fastify.register(productRoutes, { container: opts.container } as any);
  await fastify.register(cartRoutes, { container: opts.container } as any);
  await fastify.register(customerRoutes, { container: opts.container } as any);
  await fastify.register(orderRoutes, { container: opts.container } as any);
  await fastify.register(catalogRoutes, { container: opts.container } as any);
  await fastify.register(paymentCollectionRoutes, { container: opts.container } as any);
  await fastify.register(paymentRoutes, { container: opts.container } as any);
}
