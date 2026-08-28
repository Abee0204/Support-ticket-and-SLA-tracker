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
    const url = new URL(req.url);

    
    if (url.pathname === "/") {
      return new Response("OK", { status: 200 });
    }

    try {
      return await yoga.fetch(req); 
    } catch (err) {
      console.error("Server Error:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`🚀 Server running on port ${port}`);