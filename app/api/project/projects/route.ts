import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { apiErrorResponse } from '@/lib/api-error';
import {
  listProjects,
  createProject,
  updateProject,
  removeProject,
} from '@/services/project-api';

// GET /api/project/projects — list all projects
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await listProjects(session.accessToken));
  } catch (error) {
    return apiErrorResponse(error, 'listing projects');
  }
}

// POST /api/project/projects — create a project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    return NextResponse.json(await createProject(session.accessToken, body), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'creating project');
  }
}

// PUT /api/project/projects — update a project
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    return NextResponse.json(await updateProject(session.accessToken, body));
  } catch (error) {
    return apiErrorResponse(error, 'updating project');
  }
}

// DELETE /api/project/projects — remove a project (body = full entity)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    await removeProject(session.accessToken, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, 'deleting project');
  }
}
