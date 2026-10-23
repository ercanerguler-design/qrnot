import { NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/dpp/openapi'

// Herkese açık OpenAPI tanımı (Postman, Swagger, kod üreticiler için).
export function GET() {
  return NextResponse.json(openApiSpec(), { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } })
}
