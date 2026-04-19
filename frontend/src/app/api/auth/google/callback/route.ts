/**
 * Google OAuth Callback for Customer Login (Storefront)
 * GET /api/auth/google/callback?code=xxx&state=xxx
 * 
 * FLOW:
 * 1. Exchange Google code for user info (email, name, sub)
 * 2. Try login with deterministic Google-derived password
 * 3. If no account → register new customer + login
 * 4. If email exists with manual password → sign JWT directly (preserves manual login)
 * 5. Transfer cart, set cookie, redirect
 */

import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const GOOGLE_AUTH_SECRET = 'RobotixFunnel_gauth_2026_salt'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9000'
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret'

function getClient() {
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_CUSTOMER_REDIRECT_URI
      || 'http://localhost:8000/api/auth/google/callback',
  })
}

function derivePassword(googleSub: string): string {
  return crypto
    .createHmac('sha256', GOOGLE_AUTH_SECRET)
    .update(googleSub)
    .digest('hex')
    .substring(0, 32)
}

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'YOUR_PNI_USERNAMEtrafic.ro'
  return `${proto}://${host}`
}

/**
 * Sign a backend JWT directly.
 */
function signJwt(authIdentityId: string, customerId: string): string {
  return jwt.sign(
    {
      actor_id: customerId,
      actor_type: 'customer',
      auth_identity_id: authIdentityId,
      app_metadata: {
        customer_id: customerId,
        roles: [],
      },
      user_metadata: {},
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request)

  // Parse state
  let countryCode = 'ro'
  let redirectAfterLogin = ''
  const stateParam = request.nextUrl.searchParams.get('state')
  if (stateParam) {
    try {
      const parsed = JSON.parse(stateParam)
      countryCode = parsed.countryCode || 'ro'
      redirectAfterLogin = parsed.redirect || ''
    } catch { }
  }

  const accountUrl = redirectAfterLogin
    ? `${baseUrl}/${countryCode}/${redirectAfterLogin.replace(/^\//, '')}`
    : `${baseUrl}/${countryCode}/account`

  try {
    const code = request.nextUrl.searchParams.get('code')
    const error = request.nextUrl.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`${accountUrl}?error=google_denied`))
    }
    if (!code) {
      return NextResponse.redirect(new URL(`${accountUrl}?error=no_code`))
    }

    // ─── Exchange code for Google user info ──────────────────────
    const client = getClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL(`${accountUrl}?error=google_info_failed`))
    }

    const userInfo = await userInfoRes.json()
    const email = userInfo.email?.toLowerCase()
    const firstName = userInfo.given_name || userInfo.name?.split(' ')[0] || ''
    const lastName = userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || ''
    const googleSub = userInfo.sub

    if (!email || !googleSub) {
      return NextResponse.redirect(new URL(`${accountUrl}?error=no_email`))
    }

    console.log(`[GoogleAuth] Login attempt for: ${email} (sub: ${googleSub})`)

    const password = derivePassword(googleSub)
    let token: string | null = null

    // ─── STEP 1: Try login with Google-derived password ──────────
    // Works if user previously logged in via Google
    try {
      const loginRes = await fetch(`${BACKEND_URL}/auth/customer/emailpass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (loginRes.ok) {
        const data = await loginRes.json()
        token = data.token || null
        console.log(`[GoogleAuth] Direct login success for ${email}`)
      }
    } catch (e) {
      console.error('[GoogleAuth] Login attempt error:', e)
    }

    // ─── STEP 2: Try register (brand-new user) ──────────────────
    if (!token) {
      try {
        const regRes = await fetch(`${BACKEND_URL}/auth/customer/emailpass/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if (regRes.ok) {
          const regData = await regRes.json()
          const regToken = regData.token

          console.log(`[GoogleAuth] New registration for ${email}`)

          // Create customer profile
          try {
            await fetch(`${BACKEND_URL}/store/customers`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${regToken}`,
              },
              body: JSON.stringify({
                email,
                first_name: firstName,
                last_name: lastName,
              }),
            })
          } catch (e) {
            console.error('[GoogleAuth] Customer profile create error:', e)
          }

          // Login with fresh account
          const loginRes = await fetch(`${BACKEND_URL}/auth/customer/emailpass`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          if (loginRes.ok) {
            token = (await loginRes.json()).token || null
          } else {
            token = regToken
          }
        } else {
          // ─── STEP 3: Email exists with manual password ──────────
          // Google verified email ownership → sign JWT directly
          // DO NOT overwrite the manual password!
          console.log(`[GoogleAuth] Email ${email} exists with manual password, signing JWT directly`)

          const { Pool } = await import('pg')
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://robotix:YOUR_DB_PASSWORD@localhost:5432/robotixfunnel',
          })

          try {
            // Look up customer by email in backend-v2 schema
            const result = await pool.query(
              `SELECT id FROM customers WHERE email = $1 LIMIT 1`,
              [email]
            )

            if (result.rows.length > 0) {
              const customerId = result.rows[0].id

              if (customerId) {
                token = signJwt(customerId, customerId)
                console.log(`[GoogleAuth] JWT signed directly for ${email} (customer: ${customerId})`)
              }
            } else {
              console.error(`[GoogleAuth] No customer found for ${email}`)
            }
          } catch (dbError) {
            console.error('[GoogleAuth] DB query failed:', dbError)
          } finally {
            await pool.end()
          }
        }
      } catch (regError) {
        console.error('[GoogleAuth] Registration error:', regError)
      }
    }

    if (!token) {
      return NextResponse.redirect(
        new URL(`${accountUrl}?error=google_link_failed&email=${encodeURIComponent(email)}`)
      )
    }

    // ─── Set cookies ─────────────────────────────────────────────
    const cookieStore = await cookies()

    // Set JWT with sameSite: lax (required for cross-origin redirect from Google)
    cookieStore.set('_rf_jwt', token, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    })

    // Set cache ID for ISR revalidation
    if (!cookieStore.get('_rf_cache_id')?.value) {
      cookieStore.set('_rf_cache_id', crypto.randomUUID(), {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      })
    }

    // ─── Transfer cart to authenticated customer ─────────────────
    try {
      const cartIdCookie = cookieStore.get('_rf_cart_id')?.value
      if (cartIdCookie) {
        await fetch(`${BACKEND_URL}/store/carts/${cartIdCookie}/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })
        console.log(`[GoogleAuth] Cart ${cartIdCookie} transferred for ${email}`)
      }
    } catch (cartErr) {
      console.error('[GoogleAuth] Cart transfer error:', cartErr)
    }

    console.log(`[GoogleAuth] SUCCESS for ${email}, redirect → ${accountUrl}`)
    return NextResponse.redirect(new URL(accountUrl))
  } catch (error) {
    console.error('[GoogleAuth] Callback error:', error)
    return NextResponse.redirect(new URL(`${accountUrl}?error=auth_failed`))
  }
}
