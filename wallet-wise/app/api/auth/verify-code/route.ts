import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    try {
        const { email, code } = await request.json()

        if (!email || !code) {
            return NextResponse.json(
                { error: 'Email and code are required' },
                { status: 400 }
            )
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { passwordReset: true },
        })

        if (!user || !user.passwordReset) {
            return NextResponse.json(
                { error: 'Invalid or expired code' },
                { status: 400 }
            )
        }

        const resetRecord = user.passwordReset

        // Check if code matches
        if (resetRecord.code !== code) {
            return NextResponse.json(
                { error: 'Invalid code' },
                { status: 400 }
            )
        }

        // Check if code expired
        if (new Date() > resetRecord.expiresAt) {
            return NextResponse.json(
                { error: 'Code has expired. Please request a new one.' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Code verified successfully',
        })
    } catch (error) {
        console.error('Verify code error:', error)
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        )
    }
}
