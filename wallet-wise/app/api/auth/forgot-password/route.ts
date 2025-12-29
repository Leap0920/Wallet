import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationCode } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        })

        // Always return success message (don't reveal if user exists)
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'If an account exists with this email, a verification code has been sent.',
            })
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Store/update the code in database
        await prisma.passwordReset.upsert({
            where: { userId: user.id },
            update: {
                code,
                expiresAt,
                createdAt: new Date()
            },
            create: {
                userId: user.id,
                code,
                expiresAt
            },
        })

        // Send the email
        const result = await sendVerificationCode(email, code)

        if (!result.success) {
            const devMode = process.env.PASSWORD_RESET_DEV_MODE === 'true' || process.env.NODE_ENV !== 'production'
            console.error('Failed to send verification email:', result.error)

            if (devMode) {
                // In dev mode, still allow flow to continue and expose the code for testing purposes
                return NextResponse.json({
                    success: true,
                    message: 'Verification code generated (dev mode). Email sending is not configured.',
                    devMode: true,
                    devCode: code,
                })
            }

            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email.',
        })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}
