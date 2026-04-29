# 🔁 Padrões de Código Recorrentes

## 1. API Route (Controller — thin layer)
```typescript
// src/app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { createLogSchema } from '@/schemas/logSchema';
import { logService } from '@/services/logService';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createLogSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const log = await logService.create(session.user.id, parsed.data);
  return NextResponse.json(log, { status: 201 });
}
```

## 2. Service (Business Logic)
```typescript
// src/services/logService.ts
import { prisma } from '@/lib/prisma';
import { CreateLogInput } from '@/schemas/logSchema';

export const logService = {
  async create(userId: string, data: CreateLogInput) {
    // business rules here (check anonymous limits, compute score, etc.)
    return prisma.dailyLog.create({
      data: { user_id: userId, ...data },
    });
  },
};
```

## 3. Zod Schema (isomorphic)
```typescript
// src/schemas/logSchema.ts
import { z } from 'zod';

export const createLogSchema = z.object({
  category: z.enum(['WATER', 'FOOD', 'SLEEP', 'WORKOUT', 'POOP']),
  score: z.number().min(0).max(100),
  details: z.record(z.unknown()),
  created_at: z.string().datetime().optional(),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
```

## 4. Drawer + Toast (UI Pattern)
```tsx
// Always use Drawer for forms; never redirect
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { useToast } from '@/components/ui/use-toast';

export function WaterDrawer() {
  const { toast } = useToast();

  async function handleSave(data: CreateLogInput) {
    await fetch('/api/logs', { method: 'POST', body: JSON.stringify(data) });
    toast({ title: 'Salvo!', description: 'Hidratação registrada.' });
    // close drawer via controlled state
  }
  // ...
}
```

## 5. Vitest Service Test (AAA Pattern)
```typescript
// src/services/__tests__/logService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { logService } from '../logService';

describe('logService.create', () => {
  beforeEach(() => mockReset(prismaMock));

  it('saves a log for a valid user', async () => {
    // Arrange
    const fakeLog = { id: 'uuid', user_id: 'user1', category: 'WATER', score: 80, details: {} };
    prismaMock.dailyLog.create.mockResolvedValue(fakeLog as any);

    // Act
    const result = await logService.create('user1', { category: 'WATER', score: 80, details: {} });

    // Assert
    expect(result).toEqual(fakeLog);
    expect(prismaMock.dailyLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ user_id: 'user1' }) })
    );
  });
});
```
