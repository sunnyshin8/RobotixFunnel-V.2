import "dotenv/config";

export const config = {
  server: {
    port: parseInt(process.env.PORT ?? "9000", 10),
    host: process.env.HOST ?? "0.0.0.0",
    nodeEnv: process.env.NODE_ENV ?? "development",
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? "change-me-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "24h",
  },
  cookie: {
    secret: process.env.COOKIE_SECRET ?? "change-me-in-production",
  },
  cors: {
    admin: (process.env.ADMIN_CORS ?? "http://localhost:5173").split(","),
    store: (process.env.STORE_CORS ?? "http://localhost:8000").split(","),
    auth: (process.env.AUTH_CORS ?? "http://localhost:5173").split(","),
  },
  pni: {
    apiUrl: process.env.PNI_API_URL ?? "https://b2b.mypni.com/api/v1",
    username: process.env.PNI_USERNAME ?? "",
    password: process.env.PNI_PASSWORD ?? "",
  },
  warehouse: {
    orchestratorUrl:
      process.env.WAREHOUSE_ORCHESTRATOR_URL ?? "http://localhost:4000",
  },
  backend: {
    url: process.env.BACKEND_URL ?? "http://localhost:9000",
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? "admin@example.com",
    password: process.env.ADMIN_PASSWORD ?? "supersecret",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_placeholder",
  },
  base: {
    rpcUrl: process.env.BASE_RPC_URL ?? "https://sepolia.base.org",
    receiverAddress: process.env.BASE_RECEIVER_ADDRESS ?? "",
    network: process.env.BASE_NETWORK ?? "base-sepolia",
  },
} as const;

// Validate required env vars in production
if (config.server.nodeEnv === "production") {
  const required = ["DATABASE_URL", "JWT_SECRET", "COOKIE_SECRET"];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
