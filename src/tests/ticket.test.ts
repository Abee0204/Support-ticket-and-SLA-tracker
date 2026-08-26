import { describe, it, expect } from "vitest";
import request from "supertest";

const URL = "http://localhost:4000/graphql";

// 🔥 helper for random emails
const getEmail = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;

let userToken: string;
let agentToken: string;
let agentId: string;
let ticketId: string;

describe("Ticket System (Integration)", () => {

  it("register user", async () => {
    const email = getEmail("user");

    const res = await request(URL).post("/graphql").send({
      query: `
        mutation {
          register(
            email: "${email}"
            password: "123456"
            role: USER
          ) {
            token
            user { id }
          }
        }
      `
    });

    console.log("USER REGISTER:", res.body);

    expect(res.body.errors).toBeUndefined();

    userToken = res.body.data.register.token;
    expect(userToken).toBeDefined();
  });

  it("register agent", async () => {
    const email = getEmail("agent");

    const res = await request(URL).post("/graphql").send({
      query: `
        mutation {
          register(
            email: "${email}"
            password: "123456"
            role: AGENT
          ) {
            token
            user { id }
          }
        }
      `
    });

    console.log("AGENT REGISTER:", res.body);

    expect(res.body.errors).toBeUndefined();

    agentToken = res.body.data.register.token;
    agentId = res.body.data.register.user.id;
  });

  it("user creates ticket", async () => {
    const res = await request(URL)
      .post("/graphql")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        query: `
          mutation {
            createTicket(
              title: "Test Ticket"
              description: "Testing"
              priority: HIGH
            ) {
              id
            }
          }
        `
      });

    console.log("CREATE TICKET:", res.body);

    expect(res.body.errors).toBeUndefined();

    ticketId = res.body.data.createTicket.id;
  });

  it("agent assigns ticket", async () => {
    const res = await request(URL)
      .post("/graphql")
      .set("Authorization", `Bearer ${agentToken}`)
      .send({
        query: `
          mutation {
            assignTicket(
              ticketId: "${ticketId}"
              agentId: "${agentId}"
            ) {
              id
              status
            }
          }
        `
      });

    console.log("ASSIGN:", res.body);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.assignTicket.status).toBe("IN_PROGRESS");
  });

  it("user CANNOT assign ticket (RBAC)", async () => {
    const res = await request(URL)
      .post("/graphql")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        query: `
          mutation {
            assignTicket(
              ticketId: "${ticketId}"
              agentId: "${agentId}"
            ) {
              id
            }
          }
        `
      });

    console.log("USER ASSIGN ATTEMPT:", res.body);

    expect(res.body.errors).toBeDefined();
  });

  it("user can comment on own ticket", async () => {
    const res = await request(URL)
      .post("/graphql")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        query: `
          mutation {
            addComment(
              ticketId: "${ticketId}"
              message: "User comment"
            ) {
              id
            }
          }
        `
      });

    console.log("USER COMMENT:", res.body);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.addComment.id).toBeDefined();
  });

  it("random user CANNOT comment", async () => {
    const email = getEmail("hacker");

    const resUser = await request(URL).post("/graphql").send({
      query: `
        mutation {
          register(
            email: "${email}"
            password: "123456"
            role: USER
          ) {
            token
            user { id }
          }
        }
      `
    });

    console.log("HACKER REGISTER:", resUser.body);

    expect(resUser.body.errors).toBeUndefined();

    const hackerToken = resUser.body.data.register.token;

    const res = await request(URL)
      .post("/graphql")
      .set("Authorization", `Bearer ${hackerToken}`)
      .send({
        query: `
          mutation {
            addComment(
              ticketId: "${ticketId}"
              message: "hack"
            ) {
              id
            }
          }
        `
      });

    console.log("HACKER COMMENT ATTEMPT:", res.body);

    expect(res.body.errors).toBeDefined();
  });

});