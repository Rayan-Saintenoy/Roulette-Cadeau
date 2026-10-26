# 🎁 Roulette Cadeau — Secret Santa & Cartes à Gratter

Application web moderne de tirage au sort de **Secret Santa** (type roulette de cadeaux) développée avec **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** et **EmailJS**.

Chaque participant reçoit par email un lien unique et sécurisé vers une **carte à gratter interactive** afin de découvrir la personne à qui offrir un cadeau, tout en maintenant un suspense maximal !

---

## ✨ Fonctionnalités clés

- 🤹 **Gestion dynamique des participants** :
  - Ajout / suppression fluide de participants (Nom + Adresse email).
  - Validation automatique (formats d'emails valides, minimum 3 participants, pas de doublons).
  - Import en masse (copier-coller une liste de noms et emails).
  - Remplissage rapide d'exemples de test en 1 clic.
- 🚫 **Gestion des exclusions & couples** :
  - Définition d'exclusions personnalisées pour chaque participant (ex: conjoints qui ne doivent pas se tirer mutuellement).
  - Détection automatique et gestion des configurations impossibles.
- 🎲 **Algorithme de tirage au sort (Derangement avec backtracking)** :
  - **Aucune personne ne se tire elle-même** ($giver \neq receiver$).
  - **Bijection stricte** : chaque personne offre à exactement une personne et reçoit d'exactement une personne.
  - Évite les boucles réciproques directes (A ⇄ B) lorsque le nombre de participants le permet ($\ge 4$).
  - Résolution garantie par backtracking aléatoire.
- 🔒 **Confidentialité & Sécurité maximale** :
  - **Le nom tiré n'apparaît JAMAIS dans le corps de l'email, ni dans le code source de la page, ni dans l'URL**.
  - Chaque tirage génère un token cryptographique unique (`UUID v4`).
  - L'association est stockée côté serveur (`data/sessions.json`) et n'est délivrée par l'API (`/api/reveal/[token]`) qu'au moment où le destinataire charge sa page.
- 🪄 **Expérience Carte à Gratter festive (Scratch Card)** :
  - Rendu HTML5 `<canvas>` haute définition avec revêtement métallisé doré/argenté.
  - Grattage réaliste à la souris ou au doigt (sur smartphone / tablette) sans défilement intempestif.
  - Détection automatique dès 40% de grattage avec explosion de confettis (`canvas-confetti`).
  - Effets sonores intégrés via l'API Web Audio (aucun fichier externe requis, son de grattage et carillon festif).
  - Bouton d'accessibilité *"Tout révéler d'un clic"* et option *"Re-gratter"*.
- 📧 **Envoi automatisé avec EmailJS & Mode Simulation** :
  - Envoi séquentiel avec barre de progression en temps réel.
  - Statut par participant (En attente, En cours, Succès, Échec avec message).
  - **Mode Simulation / Démo** activable en 1 clic pour tester toute l'application sans compte EmailJS.
  - Possibilité de copier tous les liens secrets pour les partager via WhatsApp, SMS ou Slack.

---

## 🛠️ Stack technique

- **Framework** : [Next.js](https://nextjs.org/) (App Router, React 19)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Style** : [Tailwind CSS](https://tailwindcss.com/)
- **Envoi d'emails** : [@emailjs/browser](https://www.emailjs.com/)
- **Icônes & animations** : [Lucide React](https://lucide.dev/) & [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Effets audio** : Web Audio API native (synthèse audio sans fichiers mp3/wav)
- **Stockage serveur** : Persistance atomique JSON dans `data/sessions.json` avec mise en cache mémoire

---

## 🚀 Démarrage rapide

### 1. Cloner et installer les dépendances

```bash
git clone <url-du-depot>
cd Roulette-Cadeau
npm install
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

### 3. Tester immédiatement (Mode Démo)

Par défaut, l'application s'ouvre en **Mode Simulation / Démo** :
1. Cliquez sur **"Exemples de test"** dans le formulaire pour charger 5 participants avec une exclusion de couple.
2. Cliquez sur **"Lancer le tirage et envoyer les emails"**.
3. Observez la fenêtre de progression en direct.
4. Cliquez sur l'icône de lien externe à côté d'un participant pour ouvrir sa page secrète `/reveal/[token]` et gratter la carte !

---

## 📬 Configuration EmailJS (Envoi réel)

Pour envoyer de véritables emails aux participants, vous pouvez créer un compte gratuit sur [EmailJS](https://www.emailjs.com/) (jusqu'à 200 emails gratuits par mois).

### Étape 1 : Créer un Email Service
1. Rendez-vous dans **Email Services** sur le dashboard EmailJS.
2. Cliquez sur **"Add New Service"** (ex: Gmail, Outlook, ou SMTP).
3. Connectez votre adresse email et notez votre **Service ID** (ex: `service_abc123`).

### Étape 2 : Créer un Email Template
1. Rendez-vous dans **Email Templates** > **"Create New Template"**.
2. **TRÈS IMPORTANT (champ destinataire)** :
   Dans l'en-tête du template (en haut de l'éditeur) :
   - **To Email** : `{{to_email}}` *(ne laissez surtout pas ce champ vide ou avec votre propre adresse ! C'est ce qui provoque l'erreur "The recipients address is empty")*
   - **To Name** : `{{to_name}}`
   - **Subject** : `🎁 Ton tirage Secret Santa : {{event_title}}`

3. Dans le corps du message (HTML ou texte), collez l'exemple suivant :

```html
Bonjour {{to_name}} ! 👋

Le tirage au sort pour l'événement "{{event_title}}" a été effectué !

Pour découvrir à qui tu dois offrir un cadeau, clique sur le lien secret ci-dessous et gratte ta carte dorée :
👉 {{reveal_url}}

💰 Budget conseillé : {{budget}}
💬 Consignes : {{custom_message}}

🤫 Attention, garde bien le secret jusqu'au jour de l'échange de cadeaux !
Joyeuses fêtes ! 🎄
```

4. Sauvegardez le template et notez votre **Template ID** (ex: `template_xyz789`).

### Étape 3 : Récupérer votre clé publique
1. Rendez-vous dans **Account** > **Public Key**.
2. Copiez votre clé publique (ex: `AbC123XyZ`).

### Étape 4 : Renseigner les identifiants dans l'application

Vous pouvez soit :
- Cliquer sur le bouton **"Configuration EmailJS"** en haut de l'interface et entrer vos clés (elles seront conservées dans votre navigateur).
- Ou créer un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=votre_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=votre_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=votre_cle_publique
```

---

## 🔒 Architecture & Confidentialité

```
[Formulaire Admin]
       │
       ▼ POST /api/draw (participants, exclusions)
[Algorithme Backtracking] ──▶ Bijection complète (giver != receiver)
       │
       ▼ Génération tokens UUID v4 uniques
[Serveur : data/sessions.json] (stockage sécurisé giver ⇄ receiver)
       │
       ▼ Retourne uniquement (giverName, giverEmail, revealUrl)
[EmailJS ou Mode Test] ──▶ Envoie l'email SANS le nom de la personne tirée !
       │
       ▼ Le participant clique sur son lien unique
[Page /reveal/[token]]
       │
       ▼ GET /api/reveal/[token]
[Serveur vérifie le token] ──▶ Retourne receiverName
       │
       ▼
[Carte à Gratter Canvas] ──▶ L'utilisateur gratte pour révéler le nom !
```

---

## 📁 Structure du projet

```
├── data/                       # Stockage persistant des tirages (sessions.json)
├── public/                     # Fichiers statiques
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── draw/route.ts          # API de génération du tirage et sauvegarde
│   │   │   └── reveal/[token]/route.ts # API sécurisée de révélation par token
│   │   ├── reveal/[token]/page.tsx    # Page dédiée au suspense & carte à gratter
│   │   ├── globals.css                # Styles Tailwind CSS
│   │   ├── layout.tsx                 # Layout global avec métadonnées
│   │   └── page.tsx                   # Page principale de gestion du tirage
│   ├── components/
│   │   ├── Header.tsx                 # Barre de navigation et statut EmailJS
│   │   ├── ParticipantForm.tsx        # Formulaire dynamique et gestion des exclusions
│   │   ├── ScratchCard.tsx            # Composant réutilisable de carte à gratter Canvas
│   │   ├── EmailConfigModal.tsx       # Modal de paramétrage EmailJS & guide
│   │   ├── ProgressModal.tsx          # Suivi d'envoi en direct et partage des liens
│   │   └── SoundEffects.ts            # Synthétiseur sonore Web Audio natif
│   └── lib/
│       ├── draw.ts                    # Algorithme de tirage au sort sous contraintes
│       ├── emailjs.ts                 # Envoi des emails via SDK EmailJS
│       ├── storage.ts                 # Gestion de la persistance serveur
│       └── types.ts                   # Interfaces TypeScript
├── .env.example                # Exemple de configuration des variables d'environnement
├── package.json
└── README.md
```

---

## 🧪 Tests de production

Pour tester la compilation et le build de production :

```bash
npm run build
npm run start
```
