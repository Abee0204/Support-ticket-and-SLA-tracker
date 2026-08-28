import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { verifyToken } from "./modules/utils/jwt";

import { authResolvers } from "./modules/auth/auth.resolver";
import { ticketResolvers } from "./modules/ticket/ticket.resolver";

dotenv.config();

console.log("🔥 SERVER STARTING...");
console.log("PORT:", process.env.PORT);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "FOUND" : "MISSING");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "FOUND" : "MISSING");

const typeDefs = readFileSync("./src/schema.graphql", "utf-8");

const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...ticketResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...ticketResolvers.Mutation,
  },
  Ticket: ticketResolvers.Ticket,
};

const schema = createSchema({
  typeDefs,
  resolvers,
});


const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  maskedErrors: false, 
  context: ({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) return { user: null };

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) return { user: null };

    try {
      const decoded = verifyToken(token);
      return { user: decoded };
    } catch {
      return { user: null };
    }
  },
});


const port = Number(process.env.PORT) || 4000;

Bun.serve({
  port,
  fetch: async (req) => {
  console.log("➡️ Incoming:", req.url);

  const url = new URL(req.url);

  if (url.pathname === "/") {
    return new Response("OK");
  }

  try {
    const res = await yoga.fetch(req);
    console.log("✅ Response sent");
    return res;
  } catch (err) {
    console.error("❌ Yoga crash:", err);
    return new Response("Internal Error", { status: 500 });
  }
},
});

console.log(`🚀 Server running on port ${port}`);