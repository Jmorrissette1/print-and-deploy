import { HttpRequest } from "@azure/functions";
import { ALLOWED_ORIGINS } from "../config";

export function getCorsOrigin(request: HttpRequest): string {
  const origin = request.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}