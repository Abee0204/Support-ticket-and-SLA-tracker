import { calculateSLA, getSLAStatus } from "../utils/sla";
import { Priority, TicketStatus, Prisma, PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";

const prisma = new PrismaClient();

export const createTicket = async (
  userId: string,
  title: string,
  description: string,
  priority: Priority,
) => {
  if (!title || !title.trim() || !description || !description.trim()) {
    throw new GraphQLError("Invalid input", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

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
  if (!message || !message.trim()) {
    throw new GraphQLError("Invalid input", {
      extensions: { code: "BAD_REQUEST" },
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
    assignedToId?: string;
    page?: number;
    limit?: number;
  }
) => {
  const { status, priority, assignedToId, page = 1, limit = 10 } = filters;

  const where: Prisma.TicketWhereInput = {
    ...(status && { status: status as TicketStatus }),
    ...(priority && { priority: priority as Priority }),
    ...(assignedToId && { assignedToId }),
  };

  if (role !== "AGENT") {
    where.OR = [
      { createdById: userId },
      { assignedToId: userId },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.ticket.count({ where })
  ]);

  return {
    tickets,
    total,
    page,
    limit
  };
};
