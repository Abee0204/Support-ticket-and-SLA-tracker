import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { verifyToken } from "./modules/utils/jwt";
import { createServer } from "node:http";

import { authResolvers } from "./modules/auth/auth.resolver";
import { ticketResolvers } from "./modules/ticket/ticket.resolver";

dotenv.config();

// ✅ FIX: path resolve properly (Railway safe)
const typeDefs = readFileSync(
  new URL("./schema.graphql", import.meta.url),
  "utf-8"
);

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

// ✅ FIX: use requestListener (NOT handleNodeRequest)
const server = createServer(yoga);

const port = Number(process.env.PORT) || 4000;

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});