import emailjs from '@emailjs/browser';
import { EmailJSConfig } from './types';

export interface SendEmailParams {
  toName: string;
  toEmail: string;
  revealUrl: string;
  eventTitle: string;
  budget?: string;
  customMessage?: string;
}

/**
 * Sends a single Secret Santa invite email via EmailJS client SDK
 */
export async function sendSecretSantaEmail(
  config: EmailJSConfig,
  params: SendEmailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = (params.toEmail || '').trim();

    if (!cleanEmail) {
      return {
        success: false,
        error: "L'adresse email du destinataire est vide.",
      };
    }

    // Pass all common aliases to avoid issues if the user named the variable {{email}}, {{to_email}}, {{user_email}}, etc. in their EmailJS template settings
    const templateParams = {
      // Recipient email aliases (used in the "To Email" field of EmailJS template)
      to_email: cleanEmail,
      email: cleanEmail,
      user_email: cleanEmail,
      recipient_email: cleanEmail,
      recipient: cleanEmail,
      to: cleanEmail,
      reply_to: cleanEmail,

      // Recipient name aliases (used in the "To Name" field and body)
      to_name: params.toName,
      user_name: params.toName,
      name: params.toName,
      recipient_name: params.toName,
      participant_name: params.toName,

      // Secret link aliases
      reveal_url: params.revealUrl,
      link: params.revealUrl,
      url: params.revealUrl,

      // Event details
      event_title: params.eventTitle,
      budget: params.budget || 'Non spécifié',
      budget_amount: params.budget || '',
      custom_message: params.customMessage || '',
    };

    console.log('[EmailJS] Envoi en cours vers :', cleanEmail, 'avec paramètres :', templateParams);

    const response = await emailjs.send(
      config.serviceId.trim(),
      config.templateId.trim(),
      templateParams,
      config.publicKey.trim()
    );

    if (response.status === 200) {
      return { success: true };
    }

    return {
      success: false,
      error: `Réponse inattendue de EmailJS (Statut ${response.status})`,
    };
  } catch (err: unknown) {
    console.error('Erreur envoi EmailJS:', err);
    let errorMessage =
      err instanceof Error
        ? err.message
        : (err as { text?: string })?.text || "Erreur inconnue lors de l'envoi de l'email.";

    if (errorMessage.toLowerCase().includes('recipients address is empty')) {
      errorMessage =
        'EmailJS : Le champ "To Email" dans les paramètres de votre Template EmailJS est vide. Vous devez y inscrire {{to_email}} !';
    }

    return { success: false, error: errorMessage };
  }
}
