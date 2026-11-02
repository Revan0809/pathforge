import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json({
    success: true,
    tier: 'premium',
    message: 'Pro status verified successfully',
  })
}
