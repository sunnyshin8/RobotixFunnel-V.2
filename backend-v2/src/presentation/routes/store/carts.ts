import type { FastifyInstance } from "fastify";
import { db } from "../../../infrastructure/database/connection";
import {
  carts,
  cartItems,
  products,
  productVariants,
  shippingOptions,
  paymentCollections,
  paymentSessions,
  orders,
  orderItems,
  promotions,
} from "../../../infrastructure/database/schema/index";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// Helper: Serialize a full cart with items + computed fields
// ============================================================================

async function getFullCart(cartId: string) {
  const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
  if (!cart) return null;

  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));

  // Get variant details for each item
  const enrichedItems = await Promise.all(
    items.map(async (item: any) => {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      return {
        id: item.id,
        cart_id: item.cartId,
        title: item.title,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        compare_at_unit_price: item.compareAtUnitPrice,
        subtotal: item.unitPrice * item.quantity,
        total: item.unitPrice * item.quantity,
        original_total: (item.compareAtUnitPrice ?? item.unitPrice) * item.quantity,
        discount_total: 0,
        tax_total: Math.round(item.unitPrice * item.quantity * 0.19),
        metadata: item.metadata,
        variant_id: item.variantId,
        product_id: item.productId,
        created_at: item.createdAt.toISOString(),
        updated_at: item.updatedAt.toISOString(),
        variant: variant
          ? {
              id: variant.id,
              title: variant.title,
              sku: variant.sku,
              barcode: variant.barcode,
              product_id: variant.productId,
              inventory_quantity: variant.inventoryQuantity,
              manage_inventory: variant.manageInventory,
              allow_backorder: variant.allowBackorder,
              options: variant.options,
              metadata: variant.metadata,
              calculated_price: {
                calculated_amount: variant.price,
                original_amount: variant.compareAtPrice ?? variant.price,
                currency_code: variant.currencyCode,
              },
              images: [],
            }
          : null,
        product: product
          ? {
              id: product.id,
              title: product.title,
              handle: product.handle,
              thumbnail: product.thumbnail,
              description: product.description,
              images: product.images ?? [],
              metadata: product.metadata,
            }
          : null,
      };
    })
  );

  // Get shipping options if cart has a shipping method
  let shippingMethods: any[] = [];
  if (cart.shippingMethodId) {
    const [option] = await db
      .select()
      .from(shippingOptions)
      .where(eq(shippingOptions.id, cart.shippingMethodId))
      .limit(1);
    if (option) {
      shippingMethods = [
        {
          id: option.id,
          name: option.name,
          amount: option.amount,
          shipping_option_id: option.id,
        },
      ];
    }
  }

  // Get payment collection
  let paymentCollection = null;
  if (cart.paymentCollectionId) {
    const [pc] = await db
      .select()
      .from(paymentCollections)
      .where(eq(paymentCollections.id, cart.paymentCollectionId))
      .limit(1);
    if (pc) {
      const sessions = await db
        .select()
        .from(paymentSessions)
        .where(eq(paymentSessions.paymentCollectionId, pc.id));
      paymentCollection = {
        id: pc.id,
        status: pc.status,
        amount: pc.amount,
        currency_code: pc.currencyCode,
        payment_sessions: sessions.map((s: any) => ({
          id: s.id,
          provider_id: s.providerId,
          status: s.status,
          amount: s.amount,
          currency_code: s.currencyCode,
          data: s.data,
        })),
        payments: [],
      };
    }
  }

  return {
    id: cart.id,
    customer_id: cart.customerId,
    email: cart.email,
    region_id: cart.regionId,
    status: cart.status,
    currency_code: cart.currencyCode,
    shipping_address: cart.shippingAddress,
    billing_address: cart.billingAddress,
    items: enrichedItems,
    subtotal: cart.subtotal,
    discount_total: cart.discountTotal,
    shipping_total: cart.shippingTotal,
    tax_total: cart.taxTotal,
    total: cart.total,
    item_total: cart.subtotal,
    item_tax_total: cart.taxTotal,
    shipping_methods: shippingMethods,
    payment_collection: paymentCollection,
    promotions: cart.promoCodes,
    metadata: cart.metadata,
    created_at: cart.createdAt.toISOString(),
    updated_at: cart.updatedAt.toISOString(),
  };
}

async function recalculateCart(cartId: string) {
  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  const subtotal = items.reduce((sum: any, item: any) => sum + item.unitPrice * item.quantity, 0);

  const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
  const shippingTotal = cart?.shippingTotal ?? 0;
  const discountTotal = cart?.discountTotal ?? 0;
  const taxTotal = Math.round(subtotal * 0.19); // 19% VAT
  const total = subtotal - discountTotal + shippingTotal + taxTotal;

  await db
    .update(carts)
    .set({ subtotal, taxTotal, total, updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}

export async function cartRoutes(
  fastify: FastifyInstance,
  _opts: { container: unknown }
) {
  // POST /store/carts — Create a new cart
  fastify.post("/carts", async (request) => {
    const body = request.body as any;
    const cartId = `cart_${nanoid()}`;

    await db.insert(carts).values({
      id: cartId,
      regionId: body.region_id ?? null,
      currencyCode: body.currency_code ?? "RON",
      locale: body.locale ?? null,
      email: body.email ?? null,
      customerId: body.customer_id ?? null,
    });

    const cart = await getFullCart(cartId);
    return { cart };
  });

  // GET /store/carts/:id — Retrieve a cart
  fastify.get("/carts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const cart = await getFullCart(id);
    if (!cart) return reply.status(404).send({ message: "Cart not found" });
    return { cart };
  });

  // POST /store/carts/:id — Update a cart
  fastify.post("/carts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const [existing] = await db.select().from(carts).where(eq(carts.id, id)).limit(1);
    if (!existing) return reply.status(404).send({ message: "Cart not found" });

    const updates: any = { updatedAt: new Date() };
    if (body.region_id !== undefined) updates.regionId = body.region_id;
    if (body.email !== undefined) updates.email = body.email;
    if (body.shipping_address !== undefined) updates.shippingAddress = body.shipping_address;
    if (body.billing_address !== undefined) updates.billingAddress = body.billing_address;
    if (body.promo_codes !== undefined) updates.promoCodes = body.promo_codes;
    if (body.locale !== undefined) updates.locale = body.locale;
    if (body.metadata !== undefined) updates.metadata = { ...existing.metadata as any, ...body.metadata };
    if (body.customer_id !== undefined) updates.customerId = body.customer_id;

    // Handle promo codes discount calculation
    if (body.promo_codes && Array.isArray(body.promo_codes)) {
      let totalDiscount = 0;
      for (const code of body.promo_codes) {
        const [promo] = await db
          .select()
          .from(promotions)
          .where(and(eq(promotions.code, code), eq(promotions.isActive, true)))
          .limit(1);
        if (promo) {
          if (promo.type === "percentage") {
            totalDiscount += Math.round(existing.subtotal * parseFloat(promo.value) / 100);
          } else {
            totalDiscount += Math.round(parseFloat(promo.value) * 100);
          }
        }
      }
      updates.discountTotal = totalDiscount;
    }

    await db.update(carts).set(updates).where(eq(carts.id, id));
    await recalculateCart(id);

    const cart = await getFullCart(id);
    return { cart };
  });

  // POST /store/carts/:id/line-items — Add a line item
  fastify.post("/carts/:id/line-items", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { variant_id: string; quantity: number };

    const [cart] = await db.select().from(carts).where(eq(carts.id, id)).limit(1);
    if (!cart) return reply.status(404).send({ message: "Cart not found" });

    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, body.variant_id))
      .limit(1);
    if (!variant) return reply.status(404).send({ message: "Variant not found" });

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, variant.productId))
      .limit(1);

    // Check if item already exists
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, id), eq(cartItems.variantId, body.variant_id)))
      .limit(1);

    if (existingItem) {
      await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + (body.quantity ?? 1),
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      const itemId = `item_${nanoid()}`;
      await db.insert(cartItems).values({
        id: itemId,
        cartId: id,
        productId: variant.productId,
        variantId: variant.id,
        title: product?.title ?? variant.title,
        thumbnail: product?.thumbnail ?? null,
        quantity: body.quantity ?? 1,
        unitPrice: variant.price,
        compareAtUnitPrice: variant.compareAtPrice,
      });
    }

    await recalculateCart(id);
    const fullCart = await getFullCart(id);
    return { cart: fullCart };
  });

  // POST /store/carts/:id/line-items/:lineId — Update a line item
  fastify.post("/carts/:id/line-items/:lineId", async (request, reply) => {
    const { id, lineId } = request.params as { id: string; lineId: string };
    const body = request.body as { quantity: number };

    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, lineId), eq(cartItems.cartId, id)))
      .limit(1);
    if (!item) return reply.status(404).send({ message: "Cart item not found" });

    if (body.quantity <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, lineId));
    } else {
      await db
        .update(cartItems)
        .set({ quantity: body.quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, lineId));
    }

    await recalculateCart(id);
    const cart = await getFullCart(id);
    return { cart };
  });

  // DELETE /store/carts/:id/line-items/:lineId — Delete a line item
  fastify.delete("/carts/:id/line-items/:lineId", async (request, reply) => {
    const { id, lineId } = request.params as { id: string; lineId: string };

    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, lineId), eq(cartItems.cartId, id)));

    await recalculateCart(id);
    const cart = await getFullCart(id);
    return { cart };
  });

  // POST /store/carts/:id/shipping-methods — Add shipping method
  fastify.post("/carts/:id/shipping-methods", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { option_id: string };

    const [cartRecord] = await db
      .select()
      .from(carts)
      .where(eq(carts.id, id))
      .limit(1);

    if (!cartRecord) return reply.status(404).send({ message: "Cart not found" });

    let [option] = await db
      .select()
      .from(shippingOptions)
      .where(eq(shippingOptions.id, body.option_id))
      .limit(1);

    // Frontend can send stale/legacy option ids; fall back to the first valid
    // option for the cart region instead of failing checkout with 404.
    if (!option) {
      ;[option] = await db
        .select()
        .from(shippingOptions)
        .where(eq(shippingOptions.regionId, cartRecord.regionId))
        .limit(1);
    }

    if (!option) {
      ;[option] = await db.select().from(shippingOptions).limit(1);
    }

    if (!option) {
      return reply.status(404).send({ message: "Shipping option not found" });
    }

    await db
      .update(carts)
      .set({
        shippingMethodId: option.id,
        shippingTotal: option.amount,
        updatedAt: new Date(),
      })
      .where(eq(carts.id, id));

    await recalculateCart(id);
    const updatedCart = await getFullCart(id);
    return { cart: updatedCart };
  });

  // POST /store/carts/:id/complete — Complete cart (place order)
  fastify.post("/carts/:id/complete", async (request, reply) => {
    const { id } = request.params as { id: string };

    const cart = await getFullCart(id);
    if (!cart) return reply.status(404).send({ message: "Cart not found" });

    if (cart.items.length === 0) {
      return reply.status(400).send({ message: "Cart is empty" });
    }

    // Create order from cart
    const orderId = `order_${nanoid()}`;

    // Get next display ID
    const [maxDisplay] = await db
      .select({ max: sql<number>`COALESCE(MAX(display_id), 0)` })
      .from(orders);
    const displayId = (maxDisplay?.max ?? 0) + 1;

    await db.insert(orders).values({
      id: orderId,
      customerId: cart.customer_id ?? "guest",
      email: cart.email ?? "",
      status: "pending",
      fulfillmentStatus: "not_fulfilled",
      paymentStatus: "captured",
      currencyCode: cart.currency_code,
      shippingAddress: cart.shipping_address as any,
      billingAddress: cart.billing_address as any,
      subtotal: cart.subtotal,
      discountTotal: cart.discount_total,
      shippingTotal: cart.shipping_total,
      taxTotal: cart.tax_total,
      total: cart.total,
      metadata: cart.metadata as any,
    });

    // Create order items
    for (const item of cart.items) {
      const itemId = `oi_${nanoid()}`;
      await db.insert(orderItems).values({
        id: itemId,
        orderId,
        productId: item.product_id,
        variantId: item.variant_id,
        title: item.title,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        compareAtUnitPrice: item.compare_at_unit_price,
        total: item.total,
      });
    }

    // Mark cart as completed
    await db
      .update(carts)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(carts.id, id));

    // Decrease inventory
    for (const item of cart.items) {
      await db
        .update(productVariants)
        .set({
          inventoryQuantity: sql`GREATEST(${productVariants.inventoryQuantity} - ${item.quantity}, 0)`,
        })
        .where(eq(productVariants.id, item.variant_id));
    }

    // Get the created order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const oItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    return {
      type: "order",
      order: {
        id: order.id,
        display_id: order.displayId,
        customer_id: order.customerId,
        email: order.email,
        status: order.status,
        fulfillment_status: order.fulfillmentStatus,
        payment_status: order.paymentStatus,
        currency_code: order.currencyCode,
        shipping_address: order.shippingAddress,
        billing_address: order.billingAddress,
        subtotal: order.subtotal,
        discount_total: order.discountTotal,
        shipping_total: order.shippingTotal,
        tax_total: order.taxTotal,
        total: order.total,
        items: oItems.map((i: any) => ({
          id: i.id,
          order_id: i.orderId,
          product_id: i.productId,
          variant_id: i.variantId,
          title: i.title,
          thumbnail: i.thumbnail,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total: i.total,
          metadata: i.metadata,
        })),
        metadata: order.metadata,
        created_at: order.createdAt.toISOString(),
        updated_at: order.updatedAt.toISOString(),
      },
    };
  });

  // POST /store/carts/:id/transfer — Transfer cart to customer
  fastify.post("/carts/:id/transfer", async (request, reply) => {
    const { id } = request.params as { id: string };
    // The customer ID should come from the auth token
    const customerId = (request as any).user?.id;
    if (!customerId) return reply.status(401).send({ message: "Authentication required" });

    await db
      .update(carts)
      .set({ customerId, updatedAt: new Date() })
      .where(eq(carts.id, id));

    return { success: true };
  });
}
