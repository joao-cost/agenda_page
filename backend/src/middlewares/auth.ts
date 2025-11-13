import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export function ensureAuthenticated(options?: { adminOnly?: boolean }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Token não fornecido." });
    }

    const [, token] = authHeader.split(" ");
    if (!token) {
      return res.status(401).json({ message: "Token mal formatado." });
    }

    try {
      const payload = verifyJwt(token);
      req.user = {
        id: payload.sub,
        role: payload.role,
        clientId: payload.clientId
      };

      if (options?.adminOnly && payload.role !== "ADMIN") {
        return res.status(403).json({ message: "Acesso restrito ao administrador." });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Token inválido ou expirado." });
    }
  };
}


