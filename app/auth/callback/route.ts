import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // Supabase's PKCE redirect chain can strip custom query params from redirectTo,
  // so we fall back to a cookie set by the page that initiated the auth flow.
  // For invite links, always redirect to onboarding.
  const next = searchParams.get('next')
    ?? request.cookies.get('auth_redirect')?.value
    ?? (type === 'invite' ? '/onboarding' : '/dashboard')

  const supabase = await createClient()

  const buildRedirect = (destination: string) => {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    let baseUrl: string
    if (isLocalEnv) {
      baseUrl = origin
    } else if (forwardedHost) {
      baseUrl = `https://${forwardedHost}`
    } else {
      baseUrl = origin
    }
    const response = NextResponse.redirect(`${baseUrl}${destination}`)
    // Clear the auth_redirect cookie after use
    response.cookies.delete('auth_redirect')
    return response
  }

  // Handle token_hash flow (email OTP / recovery links)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return buildRedirect(next)
    }
  }

  // Handle PKCE code exchange flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return buildRedirect(next)
    }
  }

  return buildRedirect('/?error=auth-callback-failed')
}
