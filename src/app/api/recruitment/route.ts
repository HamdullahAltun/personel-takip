import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        const { searchParams } = new URL(req.url);
        // Public job board? For now, public can see jobs, but only admin sees candidates.
        const type = searchParams.get('type');
        if (type === 'public-jobs') {
            const jobs = await prisma.jobPosting.findMany({ where: { status: 'ACTIVE' } });
            return NextResponse.json(jobs);
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    try {
        if (mode === 'jobs') {
            const jobs = await prisma.jobPosting.findMany({
                include: { _count: { select: { candidates: true } } },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json(jobs);
        }

        if (mode === 'candidates') {
            const candidates = await prisma.candidate.findMany({
                include: { jobPosting: { select: { title: true } } },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json(candidates);
        }

        return NextResponse.json({ error: 'Invalid Mode' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Candidates can apply publicly?
    // Let's assume public apply for now, but Admin creates jobs.

    // Check if it's a job creation (Admin)
    // or Candidate Application (Public)

    // We'll separate logic by inspecting body or session

    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'CREATE_JOB') {
            const session = await getAuth();
            if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const { title, department, type, description, requirements } = body;
            const job = await prisma.jobPosting.create({
                data: { title, department, type, description, requirements, status: 'ACTIVE' }
            });
            return NextResponse.json(job);
        }

        if (action === 'APPLY') {
            const { jobPostingId, name, email, phone, resumeUrl } = body;
            const candidate = await prisma.candidate.create({
                data: { jobPostingId, name, email, phone, resumeUrl, status: 'NEW' }
            });
            return NextResponse.json(candidate);
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, type, target, status, rating, notes } = body;
        const entityType = target || type;

        if (entityType === 'JOB') {
            const { title, department, type: jobType, description, requirements, status } = body;
            const data: any = {};
            if (title) data.title = title;
            if (department) data.department = department;
            if (jobType) data.type = jobType;
            if (description) data.description = description;
            if (requirements) data.requirements = requirements;
            if (status) data.status = status;

            await prisma.jobPosting.update({ where: { id }, data });
        } else if (entityType === 'CANDIDATE') {
            const data: any = {};
            if (status) data.status = status;
            if (rating) data.rating = rating;
            if (notes) data.notes = notes;

            await prisma.candidate.update({ where: { id }, data });

            // If hired, maybe create User account automatically? 
            // Leaving that as a manual step or separate button for now.
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, type, target } = body;
        const entityType = target || type;

        if (entityType === 'JOB') {
            await prisma.jobPosting.delete({ where: { id } });
        } else if (entityType === 'CANDIDATE') {
            await prisma.candidate.delete({ where: { id } });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
