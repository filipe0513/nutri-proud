import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const eventSchema = z.object({
  eventName: z.string().min(1).max(100),
  metadata: z.record(z.string().max(100), z.unknown()).optional(),
}).strict();

export async function POST(req: Request) {
  try {
    // Rate limit: 10 events per minute per IP
    const ip = getClientIp(req);
    const rl = rateLimit(`events:${ip}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

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
