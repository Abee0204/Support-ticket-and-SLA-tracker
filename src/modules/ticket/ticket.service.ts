import { calculateSLA, getSLAStatus } from "../utils/sla";
import { Priority, PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";

const prisma = new PrismaClient();

export const createTicket = async (
  userId: string,
  title: string,
  description: string,
  priority: Priority,
) => {
  const slaDeadline = calculateSLA(priority);

  return prisma.ticket.create({
    data: {
      title,
      description,
      priority,
      status: "OPEN",
      createdById: userId,
      slaDeadline,
    },
  });
};

export const assignTicket = async (
  ticketId: string,
  agentId: string,
  userRole: string,
) => {
  if (userRole !== "AGENT") {
    throw new GraphQLError("Only agents can assign tickets", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new GraphQLError("Ticket not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedToId: agentId,
      status: "IN_PROGRESS",
    },
  });
};

export const addComment = async (
  ticketId: string,
  userId: string,
  message: string,
) => {

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new GraphQLError("Ticket not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (
    ticket.createdById !== userId &&
    ticket.assignedToId !== userId
  ) {
    throw new GraphQLError("Not allowed to comment on this ticket", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  if (!ticket.firstResponseAt) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        firstResponseAt: new Date(),
      },
    });
  }

  const comment = await prisma.comment.create({
    data: {
      message,
      ticket: { connect: { id: ticketId } },
      user: { connect: { id: userId } },
    },
  });

  return comment;
};

export const getTickets = async (
  userId: string,
  role: string,
  filters: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }
) => {

  const { status, priority, page = 1, limit = 10 } = filters;

  const where: any = {};

  if (role !== "AGENT") {
    where.createdById = userId;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;

  return prisma.ticket.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc"
    }
  });
};
