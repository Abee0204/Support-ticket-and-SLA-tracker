import { createServer } from "node:http"
import { createYoga, createSchema } from "graphql-yoga"
import { readFileSync } from "fs"

const typeDefs = readFileSync("./src/schema.graphql", "utf-8")

const resolvers = {
  Query: {
    hello: () => "Hello World"
  }
}

const schema = createSchema({
  typeDefs,
  resolvers
})

const yoga = createYoga({
  schema
})

const server = createServer(yoga)

server.listen(4000, () => {
  console.log("Server running on http://localhost:4000/graphql")
})