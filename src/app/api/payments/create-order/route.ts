import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json({
    order_id: 'order_demo_unlocked',
    amount: 0,
    currency: 'INR',
    key: 'rzp_test_demo',
    status: 'unlocked',
    message: 'Premium access is completely unlocked for this session!',
  })
}
