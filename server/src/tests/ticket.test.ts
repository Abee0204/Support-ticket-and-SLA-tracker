import { describe, it, expect } from "vitest";
import request from "supertest";
import { calculateBusinessMinutesBetween, getSLAStatus } from "../modules/utils/sla";
import { server } from "../server";

// 🔥 helper for random emails
const getEmail = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;

let userToken: string;
let agentToken: string;
let agentId: string;
let ticketId: string;

describe("SLA Business Hours Unit Tests", () => {
  it("calculates working minutes on same day within working hours", () => {
    // Mon Aug 24 2026, 10:00 to 12:00 -> 120 min
    const start = new Date(2026, 7, 24, 10, 0, 0);
    const end = new Date(2026, 7, 24, 12, 0, 0);
    expect(calculateBusinessMinutesBetween(start, end)).toBe(120);
  });

  it("ignores non-working hours before 9 AM and after 6 PM", () => {
    // Mon Aug 24 2026, 07:00 to 10:00 -> 60 min (9 AM to 10 AM)
    const start = new Date(2026, 7, 24, 7, 0, 0);
    const end = new Date(2026, 7, 24, 10, 0, 0);
    expect(calculateBusinessMinutesBetween(start, end)).toBe(60);
  });

  it("skips weekend hours completely", () => {
    // Fri Aug 28 2026, 17:00 to Mon Aug 31 2026, 10:00 -> 120 min (Fri 17-18: 60m + Mon 9-10: 60m)
    const start = new Date(2026, 7, 28, 17, 0, 0);
    const end = new Date(2026, 7, 31, 10, 0, 0);
    expect(calculateBusinessMinutesBetween(start, end)).toBe(120);
  });

  it("returns 0 if start >= end", () => {
    const start = new Date(2026, 7, 24, 12, 0, 0);
    const end = new Date(2026, 7, 24, 10, 0, 0);
    expect(calculateBusinessMinutesBetween(start, end)).toBe(0);
  });

  it("determines correct SLA status", () => {
    const now = new Date(2026, 7, 24, 10, 0, 0); // Mon 10 AM

    // Expired deadline -> BREACHED
    const pastDeadline = new Date(2026, 7, 24, 9, 0, 0);
    expect(getSLAStatus(pastDeadline, "HIGH", now)).toBe("BREACHED");

    // HIGH priority (120 min total, 25% threshold = 30 min)
    // 20 min remaining -> AT_RISK
    const atRiskDeadline = new Date(2026, 7, 24, 10, 20, 0);
    expect(getSLAStatus(atRiskDeadline, "HIGH", now)).toBe("AT_RISK");

    // 60 min remaining -> ON_TRACK
    const onTrackDeadline = new Date(2026, 7, 24, 11, 0, 0);
    expect(getSLAStatus(onTrackDeadline, "HIGH", now)).toBe("ON_TRACK");
  });
});

describe("Ticket System (Integration)", () => {

  it("register user", async () => {
    const email = getEmail("user");

    const res = await request(server).post("/graphql").send({
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

    const res = await request(server).post("/graphql").send({
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
    const res = await request(server)
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
    const res = await request(server)
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
    const res = await request(server)
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
    const res = await request(server)
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

  it("user can query tickets with pagination metadata", async () => {
    const res = await request(server)
      .post("/graphql")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        query: `
          query {
            tickets(page: 1, limit: 10) {
              tickets {
                id
                title
                slaStatus
              }
              total
              page
              limit
            }
          }
        `
      });

    console.log("TICKETS QUERY:", res.body);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.tickets.tickets).toBeDefined();
    expect(Array.isArray(res.body.data.tickets.tickets)).toBe(true);
    expect(typeof res.body.data.tickets.total).toBe("number");
    expect(res.body.data.tickets.page).toBe(1);
    expect(res.body.data.tickets.limit).toBe(10);
  });

  it("random user CANNOT comment", async () => {
    const email = getEmail("hacker");

    const resUser = await request(server).post("/graphql").send({
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

    const res = await request(server)
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