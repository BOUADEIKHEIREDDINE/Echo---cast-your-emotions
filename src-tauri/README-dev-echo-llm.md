
# Démarrer Echo + LLM après un redémarrage

Ce fichier résume **toutes les étapes à refaire** après un reboot de la machine pour que Echo fonctionne avec :
- la transcription Parakeet,
- le nouvel éditeur de transcript,
- et le LLM local (Ollama) pour la diarisation / post‑traitement.

> Ces instructions supposent que tu as déjà :
> - installé les dépendances Node/Rust,
> - configuré `OLLAMA_MODELS` vers `A:\ollama\models`,
> - téléchargé au moins un modèle Ollama (ex. `llama3.2:3b` ou similaire),
> - configuré un mode dans **Personnaliser → LLM Connect**.

---

## 1. Lancer le serveur Ollama

1. Ouvrir un premier terminal PowerShell.
2. Lancer le serveur :

```powershell
ollama serve
```

3. Laisser ce terminal **ouvert** en arrière‑plan (ne pas le fermer).

Si tu veux vérifier que les modèles sont bien là :

```powershell
ollama list
```

---

## 2. Démarrer Echo en mode dev

1. Ouvrir **un second terminal** PowerShell.
2. Aller dans le projet :

```powershell
cd A:\murmure-main
```

3. Lancer l’app Tauri :

```powershell
pnpm tauri dev
```

4. Attendre la fin de la compilation puis la fenêtre **Echo – Cast your emotions** s’ouvre.

---

## 3. Vérifier la connexion LLM dans Echo (si nécessaire)

Cette étape est à refaire seulement si tu changes de modèle/URL, sinon la config est persistée.

1. Dans Echo, aller dans **Personnaliser → LLM Connect**.
2. Onglet **Installer Ollama** :
   - Cliquer sur **Tester la connexion**.
   - Si tout est OK, le statut devient vert.
3. Onglet **Général** (modes LLM) :
   - Vérifier qu’un mode est **actif** (par ex. “Général” ou “Diarization”) avec le modèle souhaité.

Le code côté Rust utilise toujours **le mode actif** pour :
- le post‑traitement des transcriptions (prompt `{{TRANSCRIPT}}` / `{{DICTIONARY}}`),
- la diarisation LLM (séparation Speaker 1 / Speaker 2 dans l’éditeur de transcript).

---

## 4. Utiliser l’éditeur de transcript

Une fois Echo lancé et le LLM connecté :

- **Enregistrement live (Standard)**  
  1. Depuis l’écran d’accueil, enregistrer en mode Standard.  
  2. À l’arrêt, Echo ouvre automatiquement le **Transcript Editor**.  
  3. Le backend :
     - transcrit avec Parakeet,
     - envoie le texte brut au LLM pour **diarisation**,
     - renvoie les `TranscriptBlock` + `speakers` à l’UI.

- **Fichier audio (Transcribe an audio file)**  
  1. Sur l’accueil, cliquer sur **Transcribe an audio file** et choisir un `.wav`.  
  2. Echo ouvre le **Transcript Editor** sur ce fichier et applique le même pipeline.

Si aucun LLM n’est disponible (Ollama arrêté, modèle non accessible), le backend retombe automatiquement en **mode fallback** :
- un seul bloc,
- un seul speaker `Speaker 1`.

