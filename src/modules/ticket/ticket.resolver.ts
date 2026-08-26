import * as service from "./ticket.service";
import { GraphQLError } from "graphql";
import { getSLAStatus } from "../utils/sla";

export const ticketResolvers = {
  Query: {
    tickets: async (_: any, args: any, ctx: any) => {
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
    slaStatus: (parent: any) => {
      if (!parent.slaDeadline) return "ON_TRACK";
      return getSLAStatus(parent.slaDeadline, parent.priority);
    },
  },

  Mutation: {
    createTicket: async (_: any, args: any, ctx: any) => {
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

    assignTicket: async (_: any, args: any, ctx: any) => {
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

    addComment: async (_: any, args: any, ctx: any) => {
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