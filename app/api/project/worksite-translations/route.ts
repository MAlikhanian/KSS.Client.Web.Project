import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { apiErrorResponse } from '@/lib/api-error';
import {
  listWorksiteTranslations,
  createWorksiteTranslation,
  updateWorksiteTranslation,
  removeWorksiteTranslation,
} from '@/services/project-api';

// GET /api/project/worksite-translations — list all worksite translations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await listWorksiteTranslations(session.accessToken));
  } catch (error) {
    return apiErrorResponse(error, 'listing worksite translations');
  }
}

// POST /api/project/worksite-translations — create a worksite translation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    return NextResponse.json(await createWorksiteTranslation(session.accessToken, body), {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error, 'creating worksite translation');
  }
}

// PUT /api/project/worksite-translations — update a worksite translation
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    return NextResponse.json(await updateWorksiteTranslation(session.accessToken, body));
  } catch (error) {
    return apiErrorResponse(error, 'updating worksite translation');
  }
}

// DELETE /api/project/worksite-translations — remove a worksite translation (body = full entity)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    await removeWorksiteTranslation(session.accessToken, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, 'deleting worksite translation');
  }
}
