import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { ValidationError } from "../lib/errors";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | "));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new ValidationError(result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | "));
    }
    req.query = result.data as any;
    next();
  };
}
