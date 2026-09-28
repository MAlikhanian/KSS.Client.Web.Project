import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { apiErrorResponse } from '@/lib/api-error';
import {
  listWorksites,
  createWorksite,
  updateWorksite,
  removeWorksite,
} from '@/services/project-api';

// GET /api/project/worksites — list all worksites
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await listWorksites(session.accessToken));
  } catch (error) {
    return apiErrorResponse(error, 'listing worksites');
  }
}

// POST /api/project/worksites — create a worksite
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    return NextResponse.json(await createWorksite(session.accessToken, body), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'creating worksite');
  }
}

// PUT /api/project/worksites — update a worksite
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    return NextResponse.json(await updateWorksite(session.accessToken, body));
  } catch (error) {
    return apiErrorResponse(error, 'updating worksite');
  }
}

// DELETE /api/project/worksites — remove a worksite (body = full entity)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    await removeWorksite(session.accessToken, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, 'deleting worksite');
  }
}
