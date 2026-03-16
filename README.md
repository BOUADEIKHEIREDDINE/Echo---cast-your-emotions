## Echo – Cast your emotions

Echo est une application de dictée **100 % locale** qui transforme votre voix en texte tout en respectant votre vie privée.  
Elle utilise un moteur de reconnaissance vocale basé sur **NVIDIA Parakeet (ONNX)**, un frontend **React + TypeScript** et un backend **Rust / Tauri**.

### Fonctionnalités principales

- **Entrée audio en direct**: maintenez un raccourci clavier pour dicter partout (champs de texte, chats, éditeurs…).
- **Transcription de fichiers audio**: ouvrez un fichier WAV et retrouvez-le dans l’éditeur de transcription avec détection des intervenants.
- **Post‑traitement par LLM (optionnel)**: enrichissement du texte (correction, citations, prise en compte d’un dictionnaire personnalisé) via un LLM local ou distant.
- **Historique récent**: les 5 dernières transcriptions sont conservées localement et ré‑ouvrables dans l’éditeur.
- **Mode vocal**: déclenchement de l’enregistrement via des mots‑clés (wake words).
- **Personnalisation**: dictionnaire, règles de formatage, raccourcis clavier, modes LLM, etc.

---

## Prérequis

- **Node.js** ≥ 18
- **pnpm** (recommandé pour ce projet)
- **Rust** et toolchain cible de Tauri installés  
  Voir la doc officielle Tauri pour l’installation par OS.
- (Optionnel) **Ollama** ou un serveur LLM compatible OpenAI si vous voulez utiliser le post‑traitement LLM.

---

## Installation

Depuis la racine du projet :

```bash
pnpm install
```

Cela installe toutes les dépendances frontend ainsi que les outils nécessaires côté Tauri.

---

## Lancement en mode développement

Toujours à la racine du projet :

```bash
pnpm tauri dev
```

Cela :

- lance le serveur Vite pour le frontend React ;
- compile et démarre l’application Tauri ;
- ouvre la fenêtre de bureau Echo en mode développement.

Si vous utilisez un LLM local (par exemple via **Ollama**) :

1. Démarrez le service LLM (ex. : `ollama serve`).
2. Dans Echo, ouvrez l’onglet **Personnaliser → LLM Connect**.
3. Configurez le mode **Local** ou **Remote** selon votre installation, testez la connexion, puis sauvegardez.

---

## Build pour distribution

Pour générer un binaire installable (selon votre OS) :

```bash
pnpm tauri build
```

Les artefacts générés (installeurs / exécutables) se trouveront dans le dossier `src-tauri/target/` (et sous‑dossiers associés à votre plateforme).

---

## Structure principale du projet

- `src/` : frontend **React + TypeScript** (écran d’accueil, éditeur de transcription, statistiques, paramètres, etc.).
- `src-tauri/` : backend **Rust / Tauri** (capture audio, moteur de transcription, intégration LLM, historique, commandes).
- `src/features/home/` : page d’accueil (entrée en direct, transcription de fichier, historique).
- `src/features/transcript-editor/` : éditeur de transcription (blocs, intervenants, téléchargement du texte).
- `src/features/settings/` : raccourcis, système, dictionnaire, règles de formatage.
- `src/features/llm-connect/` : configuration des modes LLM et prompts.

Toutes les données sensibles restent sur la machine de l’utilisateur ; aucune donnée n’est envoyée vers un serveur externe par défaut.

