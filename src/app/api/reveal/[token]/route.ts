import { NextRequest, NextResponse } from 'next/server';
import { getRevealData, markAsRevealed } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: 'Token manquant.' }, { status: 400 });
    }

    const data = await getRevealData(token);

    if (!data) {
      return NextResponse.json(
        { error: 'Lien de tirage invalide ou expiré.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionTitle: data.sessionTitle,
        budget: data.budget,
        message: data.message,
        giverName: data.giverName,
        receiverName: data.receiverName,
        revealed: data.revealed,
        revealedAt: data.revealedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: 'Token manquant.' }, { status: 400 });
    }

    const updated = await markAsRevealed(token);
    if (!updated) {
      return NextResponse.json(
        { error: 'Impossible de marquer le tirage comme révélé.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Tirage marqué comme révélé.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
