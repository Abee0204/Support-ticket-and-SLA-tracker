import jwt from "jsonwebtoken"

const JWT_SECRET = "supersecret" // later move to env

export const signToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET)
}