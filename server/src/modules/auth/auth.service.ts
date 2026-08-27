import { PrismaClient, Role } from "@prisma/client"

import { GraphQLError } from "graphql"
import { comparePassword, hashPassword } from "../utils/hash"
import { signToken } from "../utils/jwt"

const prisma = new PrismaClient()

export const registerUser = async (
  email: string,
  password: string,
  role: Role
) => {
  if (!password || password.trim().length < 6) {
    throw new GraphQLError("Password must be at least 6 characters long", {
      extensions: { code: "BAD_REQUEST" }
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    throw new GraphQLError("User already exists", {
      extensions: { code: "BAD_REQUEST" }
    })
  }

  const hashed = await hashPassword(password)

  const user = await prisma.user.create({
    data: { email, password: hashed, role }
  })

  const token = signToken({
    userId: user.id,
    role: user.role
  })

  return { token, user }
}

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    throw new GraphQLError("Invalid credentials", {
      extensions: { code: "UNAUTHORIZED" }
    })
  }

  const valid = await comparePassword(password, user.password)

  if (!valid) {
    throw new GraphQLError("Invalid credentials", {
      extensions: { code: "UNAUTHORIZED" }
    })
  }

  const token = signToken({
    userId: user.id,
    role: user.role
  })

  return { token, user }
}