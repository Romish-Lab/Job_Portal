import jwt from "jsonwebtoken";

export interface TokenPayload {
  id: string;
  role: "candidate" | "employer" | "admin";
}

export const signToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret) as TokenPayload;
};
