import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Participant, DrawSession } from '@/lib/types';
import { generateDraw } from '@/lib/draw';
import { saveDrawSession } from '@/lib/storage';
import { encodeRevealToken } from '@/lib/token';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title = 'Secret Santa', budget, message, participants } = body;

    if (!Array.isArray(participants) || participants.length < 3) {
      return NextResponse.json(
        { error: 'Au moins 3 participants sont requis pour effectuer le tirage.' },
        { status: 400 }
      );
    }

    // Validate participants
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitizedParticipants: Participant[] = [];

    for (const p of participants) {
      const name = (p.name || '').trim();
      const email = (p.email || '').trim().toLowerCase();

      if (!name) {
        return NextResponse.json(
          { error: 'Tous les participants doivent avoir un nom ou prénom.' },
          { status: 400 }
        );
      }

      if (!email || !emailRegex.test(email)) {
        return NextResponse.json(
          { error: `L'adresse email pour "${name}" n'est pas valide (${p.email || 'vide'}).` },
          { status: 400 }
        );
      }

      sanitizedParticipants.push({
        id: p.id || crypto.randomUUID(),
        name,
        email,
        exclusions: Array.isArray(p.exclusions) ? p.exclusions : [],
      });
    }

    // Run draw algorithm
    const rawPairs = generateDraw(sanitizedParticipants);

    const cleanTitle = title.trim() || 'Secret Santa';
    const cleanBudget = budget?.trim();
    const cleanMessage = message?.trim();

    // Attach stateless encrypted token to each pair (works 100% reliably on Vercel)
    const pairs = rawPairs.map((pair) => {
      const encryptedToken = encodeRevealToken({
        sessionTitle: cleanTitle,
        budget: cleanBudget,
        message: cleanMessage,
        giverName: pair.giverName,
        receiverName: pair.receiverName,
        pairId: pair.token || crypto.randomUUID(),
      });
      return {
        ...pair,
        token: encryptedToken,
      };
    });

    const sessionId = crypto.randomUUID();
    const session: DrawSession = {
      id: sessionId,
      title: cleanTitle,
      budget: cleanBudget,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      participants: sanitizedParticipants,
      pairs,
    };

    // Save session in server storage (non-blocking on Vercel)
    await saveDrawSession(session);

    // Build response for admin: giver info + token (receiverName is NOT exposed to client)
    const baseUrl = req.nextUrl.origin;
    const clientPairs = pairs.map((pair) => ({
      giverId: pair.giverId,
      giverName: pair.giverName,
      giverEmail: pair.giverEmail,
      token: pair.token,
      revealUrl: `${baseUrl}/reveal/${pair.token}`,
    }));

    return NextResponse.json({
      success: true,
      sessionId,
      totalParticipants: sanitizedParticipants.length,
      pairs: clientPairs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
    console.error('Erreur lors du tirage au sort:', err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
