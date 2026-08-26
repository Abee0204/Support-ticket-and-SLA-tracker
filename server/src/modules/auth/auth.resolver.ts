import { registerUser, loginUser } from "./auth.service"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

export const authResolvers = {
    
  Query: {
    me: async (_: any, __: any, ctx: any) => {
  if (!ctx.user) return null

  const user = await prisma.user.findUnique({
    where: { id: ctx.user.userId }
  })

  return user
}
  },
  Mutation: {
    register: async (_: any, args: any) => {
      return registerUser(args.email, args.password, args.role)
    },
    login: async (_: any, args: any) => {
      return loginUser(args.email, args.password)
    }
  }
}