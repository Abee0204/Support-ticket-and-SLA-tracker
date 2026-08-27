import * as service from "./ticket.service";
import { GraphQLError } from "graphql";
import { getSLAStatus } from "../utils/sla";

type GraphQLContext = {
  user: {
    userId: string;
    role: "USER" | "AGENT";
  } | null;
};

type CreateTicketArgs = {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
};

type AssignTicketArgs = {
  ticketId: string;
  agentId: string;
};

type AddCommentArgs = {
  ticketId: string;
  message: string;
};

type GetTicketsArgs = {
  status?: string;
  priority?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
};

type TicketParent = {
  slaDeadline: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
};

export const ticketResolvers = {
  Query: {
    agents: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.user) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHORIZED" }
        });
      }

      return await service.getAgents();
    },

    tickets: async (
      _: unknown,
      args: GetTicketsArgs,
      ctx: GraphQLContext
    ) => {
      if (!ctx.user) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHORIZED" }
        });
      }

      return await service.getTickets(
        ctx.user.userId,
        ctx.user.role,
        {
          status: args.status,
          priority: args.priority,
          assignedToId: args.assignedToId,
          page: args.page,
          limit: args.limit
        }
      );
    },
  },

  Ticket: {
    slaStatus: (parent: TicketParent) => {
      if (!parent.slaDeadline) return "ON_TRACK";
      return getSLAStatus(parent.slaDeadline, parent.priority);
    },
  },

  Mutation: {
    createTicket: async (
      _: unknown,
      args: CreateTicketArgs,
      ctx: GraphQLContext
    ) => {
      if (!ctx.user) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      return await service.createTicket(
        ctx.user.userId,
        args.title,
        args.description,
        args.priority,
      );
    },

    assignTicket: async (
      _: unknown,
      args: AssignTicketArgs,
      ctx: GraphQLContext
    ) => {
      if (!ctx.user) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHORIZED" }
        });
      }

      return await service.assignTicket(
        args.ticketId,
        args.agentId,
        ctx.user.role,
      );
    },

    resolveTicket: async (
      _: unknown,
      args: { ticketId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.user) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHORIZED" }
        });
      }

      return await service.resolveTicket(
        args.ticketId,
        ctx.user.userId,
        ctx.user.role,
      );
    },

    addComment: async (
      _: unknown,
      args: AddCommentArgs,
      ctx: GraphQLContext
    ) => {
      if (!ctx.user) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHORIZED" }
        });
      }

      return await service.addComment(
        args.ticketId,
        ctx.user.userId,
        args.message
      );
    }
  }
};