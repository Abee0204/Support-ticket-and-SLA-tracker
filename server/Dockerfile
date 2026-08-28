FROM oven/bun:1.1.13

WORKDIR /app

COPY . .

RUN bun install
RUN bun prisma generate

EXPOSE 3000

CMD ["bun", "run", "start"]