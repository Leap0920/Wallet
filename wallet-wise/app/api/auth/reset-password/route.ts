import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    try {
        const { email, code, newPassword } = await request.json()

        if (!email || !code || !newPassword) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Find user with reset record
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { passwordReset: true },
        })

        if (!user || !user.passwordReset) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 }
            )
        }

        const resetRecord = user.passwordReset

        // Verify code again
        if (resetRecord.code !== code || new Date() > resetRecord.expiresAt) {
            return NextResponse.json(
                { error: 'Invalid or expired code' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        })

        // Delete reset record
        await prisma.passwordReset.delete({
            where: { userId: user.id },
        })

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully',
        })
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        )
    }
}
