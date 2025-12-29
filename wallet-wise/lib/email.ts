import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationCode(email: string, code: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'WalletWise <onboarding@resend.dev>',
      to: email,
      subject: 'Your Password Reset Code - WalletWise',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💰 WalletWise</h1>
          </div>
          
          <div style="background: #171717; border-radius: 12px; padding: 30px; border: 1px solid #262626;">
            <h2 style="color: #ffffff; margin: 0 0 15px 0; font-size: 20px;">Password Reset Request</h2>
            
            <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
              You requested to reset your password. Use the verification code below to continue:
            </p>
            
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center; border-radius: 8px; margin: 0 0 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: white; font-family: monospace;">
                ${code}
              </span>
            </div>
            
            <p style="color: #a3a3a3; font-size: 13px; margin: 0 0 10px 0;">
              ⏰ This code expires in <strong style="color: #ffffff;">10 minutes</strong>.
            </p>
            
            <p style="color: #737373; font-size: 12px; margin: 25px 0 0 0;">
              If you didn't request this password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #525252; font-size: 11px; margin: 0;">
              © 2025 WalletWise. All rights reserved.
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
