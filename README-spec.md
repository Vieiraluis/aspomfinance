# NeonMusic — Especificação Técnica

App web responsivo para músicos, com tema **neon/tecnológico**, focado em prática, repertório e treino vocal com IA.

> Cole este arquivo no chat de um **novo projeto Lovable em branco** e peça: *"Implemente conforme o README-spec.md"*.

---

## 1. Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Auth (email/senha + Google), Postgres com RLS, Storage, Edge Functions
- **IA**: Lovable AI Gateway (chat/transcrição quando necessário) via edge function
- **Áudio**: Web Audio API + `AudioContext` + `AnalyserNode` (pitch detection client-side com autocorrelação/YIN)
- **Player**: `<audio>` HTML5 + Wavesurfer.js (waveform)
- **PDF/Export**: jsPDF
- **Ícones**: lucide-react

---

## 2. Identidade Visual (Neon)

Design system em `index.css` com tokens HSL semânticos — **nunca** cores hardcoded nos componentes.

```css
:root {
  --background: 240 15% 6%;         /* preto-azulado profundo */
  --foreground: 180 100% 92%;
  --card: 240 20% 9%;
  --primary: 315 100% 60%;          /* magenta neon */
  --primary-glow: 315 100% 70%;
  --secondary: 180 100% 50%;        /* ciano neon */
  --accent: 270 100% 65%;           /* roxo neon */
  --success: 140 100% 55%;          /* verde neon */
  --warning: 50 100% 60%;
  --destructive: 0 100% 60%;
  --border: 240 30% 18%;
  --ring: 315 100% 60%;

  --gradient-neon: linear-gradient(135deg, hsl(315 100% 60%), hsl(270 100% 65%), hsl(180 100% 50%));
  --shadow-neon-primary: 0 0 24px hsl(315 100% 60% / 0.6), 0 0 48px hsl(315 100% 60% / 0.3);
  --shadow-neon-secondary: 0 0 24px hsl(180 100% 50% / 0.5);
}
```

Fontes: **Orbitron** (títulos) + **Rajdhani** ou **Inter** (corpo). Bordas com glow, grid sutil de fundo, animações `pulse-glow` e `scan-line`.

---

## 3. Módulos

### 3.1 Autenticação
- Login/cadastro por email+senha e Google OAuth (Lovable Cloud managed).
- Tabela `profiles` (id → auth.users, display_name, avatar_url, instrument, voice_range).
- Trigger `handle_new_user` cria profile automático.
- RLS: user só vê/edita o próprio perfil.

### 3.2 Repertório (Músicas)
Tabela `songs`:
- `id, user_id, title, artist, key_original, bpm, duration_sec, audio_url (storage), cover_url, lyrics, notes, tags[], created_at`.
- Bucket `songs-audio` (privado, signed URLs) e `songs-cover` (público).
- Upload de MP3/WAV até 25 MB. Player com waveform e controle de velocidade (0.5x–1.5x) e transposição de pitch (via `playbackRate` + correção opcional).
- CRUD com filtros por tag, tom, artista, BPM.

### 3.3 Cifras & Acordes
Tabela `chord_charts`:
- `id, song_id, user_id, content (texto com marcações [C], [Am7]…), key_current, capo`.
- Renderizador que interpreta `[Acorde]palavra` e mostra o acorde acima da sílaba.
- **Transposição em tempo real** (±11 semitons) com botões +/-.
- Biblioteca local de **diagramas de violão/guitarra** (JSON com posições de dedos) — renderizados em SVG.
- Modo apresentação (tela cheia, auto-scroll com velocidade ajustável — útil no palco).

### 3.4 Treino Vocal com IA (Pitch Detection)
- Captura microfone via `getUserMedia`.
- Detecção de pitch client-side (algoritmo **YIN** ou autocorrelação) rodando em `AudioWorklet`.
- Converte frequência → nota (A4=440Hz) e mostra:
  - Nota atual (ex: C#4)
  - Desvio em cents (afinado / bemol / sustenido)
  - Barra visual neon com alvo
- **Exercícios**: escalas ascendentes/descendentes, sustentar nota, intervalos. Pontuação por precisão e estabilidade.
- Histórico salvo em `vocal_sessions` (user_id, exercise, score, avg_cents_off, notes_hit, duration, created_at).
- **Análise IA** (edge function `analyze-vocal-session`): recebe o resumo da sessão e retorna dicas personalizadas via Lovable AI Gateway (`google/gemini-2.5-flash`).

### 3.5 Setlists / Shows
Tabela `setlists` + `setlist_songs` (join com ordem).
- Montar setlist arrastando músicas.
- Exportar PDF do setlist (jsPDF) com título, data, local, lista com tom e BPM.
- Modo "Show ao vivo": passa de música em música em tela cheia com cifra transposta.

### 3.6 Metrônomo & Afinador
- Metrônomo: BPM 30–300, compasso 2/4, 3/4, 4/4, 6/8, subdivisões, som neon (click sintetizado via `OscillatorNode`).
- Afinador cromático usando o mesmo pitch detector, com display neon estilo pedal.

### 3.7 Dashboard
- KPIs: nº músicas, minutos praticados na semana, precisão vocal média, próximas apresentações.
- Gráfico (Recharts) de evolução vocal (últimos 30 dias).
- Últimas sessões e "continue de onde parou".

---

## 4. Estrutura de Pastas

```
src/
  pages/
    Auth.tsx
    Dashboard.tsx
    Songs.tsx            SongDetail.tsx
    Chords.tsx           ChordEditor.tsx
    VocalTrainer.tsx
    Metronome.tsx        Tuner.tsx
    Setlists.tsx         SetlistDetail.tsx
    Settings.tsx
  components/
    layout/ (TopNav neon, MobileNav)
    songs/ (SongCard, SongPlayer, WaveformPlayer)
    chords/ (ChordRenderer, ChordDiagram, TransposeControls)
    vocal/ (PitchMeter, ExerciseRunner, ScoreChart)
    metronome/ (BpmDial, BeatIndicator)
    ui/ (shadcn)
  hooks/
    useAuth.ts, useSongs.ts, useChords.ts, useSetlists.ts,
    usePitchDetector.ts, useMetronome.ts, useAudioPlayer.ts
  lib/
    pitch.ts         (YIN + freq→nota)
    transpose.ts     (parser cifra + shift semitons)
    chords-db.ts     (diagramas)
    format.ts
  integrations/supabase/*
```

---

## 5. Banco de Dados (migrations)

Criar tabelas com `user_id uuid references auth.users(id) on delete cascade`, `created_at timestamptz default now()`.

Sempre:
1. `CREATE TABLE public.<t>`
2. `GRANT SELECT,INSERT,UPDATE,DELETE ON public.<t> TO authenticated;`
   `GRANT ALL ON public.<t> TO service_role;`
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
4. Policies `USING (auth.uid() = user_id)`.

Tabelas: `profiles, songs, chord_charts, setlists, setlist_songs, vocal_sessions, practice_logs`.

Buckets: `songs-audio` (privado), `songs-cover` (público), `avatars` (público).

---

## 6. Edge Functions

- `analyze-vocal-session` — POST { sessionSummary } → chama Lovable AI (`LOVABLE_API_KEY`) e retorna feedback em pt-BR.
- `transcribe-lyrics` (opcional) — recebe áudio, usa `openai/gpt-4o-mini-transcribe` para gerar letra base.

Nunca expor `LOVABLE_API_KEY` no cliente.

---

## 7. Fora de escopo (deixar claro ao usuário)

- **Download de áudio do YouTube**: proibido pelos ToS do YouTube. Substituir por upload manual de MP3/WAV pelo usuário, ou colar URL de áudio livre (Jamendo, próprio storage).
- Separação de vozes/instrumentos (Spleeter/Demucs) — exige backend Python pesado, não roda em edge function; deixar como fase 2 usando serviço externo (Replicate) via connector.

---

## 8. Roadmap sugerido de implementação

1. Auth + tema neon + layout (TopNav, Dashboard vazio).
2. Songs CRUD + upload + player com waveform.
3. Chord editor + renderer + transposição + diagramas.
4. Pitch detector (YIN em AudioWorklet) + Tuner + Metrônomo.
5. Vocal Trainer com exercícios e histórico + IA de feedback.
6. Setlists + modo palco + export PDF.
7. Polimento: animações neon, responsivo mobile, PWA (opcional).

---

**Pronto para colar em um novo projeto Lovable em branco.**
