import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { apiErrorResponse } from '@/lib/api-error';
import {
  listProjectTranslations,
  createProjectTranslation,
  updateProjectTranslation,
  removeProjectTranslation,
} from '@/services/project-api';

// GET /api/project/project-translations — list all project translations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await listProjectTranslations(session.accessToken));
  } catch (error) {
    return apiErrorResponse(error, 'listing project translations');
  }
}

// POST /api/project/project-translations — create a project translation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    return NextResponse.json(await createProjectTranslation(session.accessToken, body), {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error, 'creating project translation');
  }
}

// PUT /api/project/project-translations — update a project translation
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    return NextResponse.json(await updateProjectTranslation(session.accessToken, body));
  } catch (error) {
    return apiErrorResponse(error, 'updating project translation');
  }
}

// DELETE /api/project/project-translations — remove a project translation (body = full entity)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    await removeProjectTranslation(session.accessToken, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, 'deleting project translation');
  }
}
