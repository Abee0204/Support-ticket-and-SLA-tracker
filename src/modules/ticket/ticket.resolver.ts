import * as service from "./ticket.service";
import { GraphQLError } from "graphql";

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
          page: args.page,
          limit: args.limit
        }
      );
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