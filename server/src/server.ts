import { createServer } from "node:http"
import { createYoga, createSchema } from "graphql-yoga"
import { readFileSync } from "fs"
import { verifyToken } from "./modules/utils/jwt"
import dotenv from "dotenv";
dotenv.config();
const typeDefs = readFileSync("./src/schema.graphql", "utf-8")

import { authResolvers } from "./modules/auth/auth.resolver"
import { ticketResolvers } from "./modules/ticket/ticket.resolver"

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
}

const schema = createSchema({
  typeDefs,
  resolvers
})

const yoga = createYoga({
  schema,
  context: ({ request }) => {
  const authHeader = request.headers.get("authorization")

  if (!authHeader) return { user: null }

  const parts = authHeader.split(" ")

  // ✅ validate format
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return { user: null }
  }

  const token = parts[1]

  // ✅ extra safety (THIS fixes TS error)
  if (!token) return { user: null }

  try {
    const decoded = verifyToken(token as string)
    return { user: decoded }
  } catch {
    return { user: null }
  }
}
})

const server = createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Backend is running 🚀");
  } else {
    yoga(req, res);
  }
});

const PORT = Number(process.env.PORT) || 4000;

server.listen(PORT,"0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
