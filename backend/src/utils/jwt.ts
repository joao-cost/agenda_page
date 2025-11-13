import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface TokenPayload {
  sub: string;
  role: "ADMIN" | "CLIENT";
  clientId?: string | null;
}

export function signJwt(payload: TokenPayload, expiresIn = "12h") {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, env.jwtSecret) as TokenPayload & jwt.JwtPayload;
}


