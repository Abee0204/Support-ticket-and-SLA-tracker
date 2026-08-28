import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { verifyToken } from "./modules/utils/jwt";

dotenv.config();

const typeDefs = readFileSync("./src/schema.graphql", "utf-8");

import { authResolvers } from "./modules/auth/auth.resolver";
import { ticketResolvers } from "./modules/ticket/ticket.resolver";

const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...ticketResolvers.Query
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...ticketResolvers.Mutation
  },
  Ticket: ticketResolvers.Ticket
};

const schema = createSchema({
  typeDefs,
  resolvers
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  context: ({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) return { user: null };

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return { user: null };
    }

    const token = parts[1];

    if (!token) return { user: null }

    try {
      const decoded = verifyToken(token);
      return { user: decoded };
    } catch {
      return { user: null };
    }
  }
});


const port = Number(process.env.PORT) || 4000;

Bun.serve({
  port,
  fetch: (req) => {
    
    if (new URL(req.url).pathname === "/") {
      return new Response("Backend running 🚀");
    }

    return yoga.fetch(req);
  }
});

console.log(`Server running on port ${port}`);