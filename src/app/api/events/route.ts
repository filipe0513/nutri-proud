import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';

import { Prisma } from '@prisma/client';

const eventSchema = z.object({
  eventName: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { eventName, metadata } = parsed.data;

    const event = await prisma.systemEvent.create({
      data: {
        eventName,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        userId,
      },
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/events] Error saving event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
