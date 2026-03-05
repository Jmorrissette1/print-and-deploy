import { HttpRequest, HttpResponseInit } from "@azure/functions";
import { ALLOWED_ORIGINS } from "../config";

export function getCorsOrigin(request: HttpRequest): string {
  const origin = request.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

export function getCorsHeaders(request: HttpRequest): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(request),
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function corsResponse(
  request: HttpRequest,
  response: HttpResponseInit,
): HttpResponseInit {
  return {
    ...response,
    headers: {
      ...response.headers,
      ...getCorsHeaders(request),
    },
  };
}

export function handlePreflight(request: HttpRequest): HttpResponseInit {
  return {
    status: 204,
    headers: getCorsHeaders(request),
  };
}
