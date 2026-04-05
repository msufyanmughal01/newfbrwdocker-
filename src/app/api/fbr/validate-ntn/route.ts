// GET /api/fbr/validate-ntn?ntn=<7-or-13-digit-value>
//
// Checks buyer NTN/CNIC against the FBR registry using the
// Get_Reg_Type endpoint (DI API v1.12, section 5.12).
//
// Response:
//   { valid: true,  registrationType: "Registered" | "Unregistered", name: "" }
//   { valid: false, message: "..." }

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fbrGetRegType, FBRApiError } from '@/lib/fbr/api-client';

// FBR Get_Reg_Type response shape (section 5.12)
interface FBRRegTypeResponse {
  statuscode: string; // "00" = found, "01" = not found
  REGISTRATION_NO?: string;
  REGISTRATION_TYPE?: string; // "Registered" | "Unregistered"
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ntn = request.nextUrl.searchParams.get('ntn')?.trim();

  if (!ntn || !/^\d{7}$|^\d{9}$|^\d{13}$/.test(ntn)) {
    return NextResponse.json(
      { valid: false, message: 'Enter a valid 7-digit or 9-digit NTN, or 13-digit CNIC' },
      { status: 400 }
    );
  }

  try {
    const raw = (await fbrGetRegType(ntn, session.user.id)) as FBRRegTypeResponse;

    if (raw.statuscode === '00' && raw.REGISTRATION_TYPE) {
      return NextResponse.json({
        valid: true,
        registrationType: raw.REGISTRATION_TYPE, // "Registered" | "Unregistered"
        registrationNo: raw.REGISTRATION_NO ?? ntn,
      });
    }

    // statuscode "01" or any non-"00" = not found / unregistered
    return NextResponse.json({
      valid: false,
      message: 'NTN/CNIC not found in FBR records or is not registered.',
    });
  } catch (err) {
    if (err instanceof FBRApiError) {
      if (err.statusCode === 401) {
        return NextResponse.json(
          { valid: false, message: 'FBR token is invalid or expired. Please update it in Business Settings.' },
          { status: 401 }
        );
      }
      if (err.statusCode === 504) {
        return NextResponse.json(
          { valid: false, message: 'FBR API timed out. Please try again.' },
          { status: 504 }
        );
      }
    }

    const code = (err as Error & { code?: string }).code;
    if (code === 'FBR_TOKEN_MISSING' || code === 'FBR_TOKEN_EXPIRED') {
      return NextResponse.json(
        { valid: false, message: 'FBR token not configured. Please add it in Business Settings.' },
        { status: 400 }
      );
    }

    console.error('[validate-ntn] FBR lookup error:', err);
    return NextResponse.json(
      { valid: false, message: 'FBR lookup failed. Please try again or enter the registration type manually.' },
      { status: 500 }
    );
  }
}
