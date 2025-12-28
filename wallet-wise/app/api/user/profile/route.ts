import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Safely parse JSON body and validate sizes to avoid huge payloads causing server errors
        let body: any
        try {
            body = await request.json()
        } catch (err: any) {
            console.error('Failed to parse request body for profile update:', err?.message || err)
            return NextResponse.json({ error: 'Invalid JSON body or request too large' }, { status: 400 })
        }

        const { name, avatarUrl, backgroundUrl } = body

        // Log sizes for debugging (development only)
        try {
            if (typeof avatarUrl === 'string') console.log('Avatar payload length:', avatarUrl.length)
            if (typeof backgroundUrl === 'string') console.log('Background payload length:', backgroundUrl.length)
        } catch (e) {
            console.warn('Failed to log payload sizes', e)
        }

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        // enforce safe size limits for base64/data URLs to avoid DB or parsing issues
        const MAX_AVATAR_LENGTH = 500_000 // ~500KB base64
        const MAX_BACKGROUND_LENGTH = 2_500_000 // ~2.5MB base64

        if (typeof avatarUrl === 'string' && avatarUrl.length > MAX_AVATAR_LENGTH) {
            return NextResponse.json({ error: 'Avatar image is too large. Please use a smaller image.' }, { status: 413 })
        }
        if (typeof backgroundUrl === 'string' && backgroundUrl.length > MAX_BACKGROUND_LENGTH) {
            return NextResponse.json({ error: 'Background image is too large. Please use a smaller image.' }, { status: 413 })
        }

        // Build data object dynamically so we only update provided fields
        const data: any = { name: name.trim() }
        if (typeof avatarUrl === "string") data.avatarUrl = avatarUrl
        if (typeof backgroundUrl === "string") data.backgroundUrl = backgroundUrl

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data,
            select: { id: true, name: true, email: true, avatarUrl: true, backgroundUrl: true }
        })

        return NextResponse.json(updatedUser)
    } catch (error: any) {
        console.error("Profile update error:", error?.message || error, error?.stack || '')
        // In development return the error message/stack to help debugging; hide in production
        if (process.env.NODE_ENV === 'development') {
            return NextResponse.json({ error: error?.message || 'Internal server error', stack: error?.stack || '' }, { status: 500 })
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, email: true, avatarUrl: true, backgroundUrl: true }
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json(user)
    } catch (error: any) {
        console.error('Profile GET error:', error?.message || error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}