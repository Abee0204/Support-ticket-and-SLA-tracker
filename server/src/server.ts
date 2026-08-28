import { createServer } from "node:http";

const port = Number(process.env.PORT) || 4000;

const server = createServer((req, res) => {
  console.log("Incoming:", req.url);

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK WORKING 🚀");
});

server.listen(port, "0.0.0.0", () => {
  console.log("Server running on port", port);
});