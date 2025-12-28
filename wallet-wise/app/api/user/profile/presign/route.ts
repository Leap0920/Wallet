import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// This route returns a presigned PUT URL and the resulting public URL for an object key.
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { filename, contentType, keyPrefix } = body || {}
    if (!filename || !contentType) return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 })

    const region = process.env.S3_REGION
    const bucket = process.env.S3_BUCKET
    const accessKeyId = process.env.S3_ACCESS_KEY_ID
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: 'S3 not configured on server' }, { status: 500 })
    }

    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })

    // Build a key: optional prefix (e.g. user id) + timestamp + filename
    const prefix = keyPrefix ? `${keyPrefix.replace(/[^a-zA-Z0-9-_\\/]/g, '')}/` : ''
    const key = `${prefix}${Date.now()}-${encodeURIComponent(filename)}`

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read'
    })

    const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 3600 })

    // Derive public URL. Allow override with S3_PUBLIC_URL_BASE env var for custom domains / CDN
    const publicBase = process.env.S3_PUBLIC_URL_BASE || `https://${bucket}.s3.${region}.amazonaws.com`
    const publicUrl = `${publicBase}/${key}`

    return NextResponse.json({ uploadUrl, publicUrl, key })
  } catch (err: any) {
    console.error('Presign error', err)
    return NextResponse.json({ error: err?.message || 'Presign failed' }, { status: 500 })
  }
}
