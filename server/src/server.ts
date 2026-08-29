import { createServer } from "node:http";
import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { verifyToken } from "./modules/utils/jwt";

import { authResolvers } from "./modules/auth/auth.resolver";
import { ticketResolvers } from "./modules/ticket/ticket.resolver";

dotenv.config();

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
  cors: {
    origin: [
      "http://localhost:5173",
      "https://support-ticket-and-sla-tracker-lspf-abee3.vercel.app",
    ],
    credentials: true,
  },
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

const server = createServer(yoga);

const PORT = Number(process.env.PORT) || 4000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
