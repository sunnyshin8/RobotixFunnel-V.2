import type { FastifyInstance } from "fastify";
import type { Container } from "../../../container.js";
import { config } from "../../../config/index.js";

type VerifyBaseBody = {
  cartId?: string;
  txHash?: string;
  expectedCurrency?: string;
  expectedAmount?: number;
};

type RpcResponse<T> = {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
};

type TxReceipt = {
  status?: string;
  to?: string;
  blockNumber?: string;
  transactionHash?: string;
};

type TxByHash = {
  value?: string;
};

async function rpcCall<T>(method: string, params: unknown[]) {
  const response = await fetch(config.base.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Base RPC request failed with status ${response.status}`);
  }

  const data = (await response.json()) as RpcResponse<T>;
  if (data.error) {
    throw new Error(data.error.message || "Base RPC error");
  }

  return data.result;
}

export async function paymentRoutes(
  fastify: FastifyInstance,
  _opts: { container: Container }
) {
  fastify.post("/payments/verify-base", async (request, reply) => {
    const body = (request.body || {}) as VerifyBaseBody;

    if (!body.cartId || !body.txHash) {
      return reply.status(400).send({
        success: false,
        error: "cartId and txHash are required",
      });
    }

    try {
      const receipt = await rpcCall<TxReceipt | null>("eth_getTransactionReceipt", [
        body.txHash,
      ]);

      if (!receipt) {
        return reply.status(202).send({
          success: false,
          pending: true,
          error: "Transaction not confirmed yet",
        });
      }

      if (receipt.status !== "0x1") {
        return reply.status(400).send({
          success: false,
          error: "Transaction failed on-chain",
          txHash: body.txHash,
        });
      }

      if (
        config.base.receiverAddress &&
        receipt.to &&
        receipt.to.toLowerCase() !== config.base.receiverAddress.toLowerCase()
      ) {
        return reply.status(400).send({
          success: false,
          error: "Transaction receiver does not match merchant address",
        });
      }

      if (typeof body.expectedAmount === "number" && body.expectedAmount > 0) {
        const tx = await rpcCall<TxByHash | null>("eth_getTransactionByHash", [body.txHash]);
        const txValueHex = tx?.value || "0x0";
        const txValueWei = BigInt(txValueHex);

        // expectedAmount is in minor units (x/100). Convert to wei as integer.
        const expectedWei = BigInt(Math.round(body.expectedAmount)) * 10_000_000_000_000_000n;
        const toleranceWei = expectedWei / 100n; // 1% tolerance for gas/rounding constraints in MVP.

        if (txValueWei + toleranceWei < expectedWei) {
          return reply.status(400).send({
            success: false,
            error: "Transferred amount is lower than expected checkout amount",
            details: {
              expectedAmount: body.expectedAmount,
              expectedCurrency: body.expectedCurrency || "BASE",
            },
          });
        }
      }

      return {
        success: true,
        cartId: body.cartId,
        txHash: receipt.transactionHash || body.txHash,
        blockNumber: receipt.blockNumber,
        currency: body.expectedCurrency || "USDC",
        network: config.base.network,
        message: "Base payment verified",
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error?.message || "Unable to verify Base transaction",
      });
    }
  });
}
