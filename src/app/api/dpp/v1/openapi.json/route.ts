import { NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/dpp/openapi'

// Herkese açık OpenAPI tanımı (Postman, Swagger, kod üreticiler için).
export function GET() {
  return NextResponse.json(openApiSpec(), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } })
}
