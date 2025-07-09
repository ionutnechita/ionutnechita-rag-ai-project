# RAG AI Agent

Un agent AI bazat pe tehnologia RAG (Retrieval-Augmented Generation) care permite interacțiunea cu documente în limba română. Acest proiect utilizează modele de inteligență artificială pentru a procesa și răspunde la întrebări bazate pe documentele încărcate.

## 🌟 Caracteristici principale

- ✅ Încărcare și procesare documente (PDF, XML, text)
- ✅ Căutare semantică în documente
- ✅ Chat interactiv bazat pe conținutul documentelor
- ✅ Suport pentru mai multe sesiuni de chat
- ✅ Interfață utilizator modernă și intuitivă
- ✅ Suport pentru modele AI multiple (inclusiv Gemini și Ollama)

## 🚀 Cerințe de sistem

- Node.js 18+
- npm sau yarn
- SQLite3
- Ollama (pentru rularea modelelor locale)
- Cont Google Cloud (pentru Gemini AI, opțional)

## ⚙️ Instalare

1. **Clonează repository-ul**
   ```bash
   git clone [URL-ul-repository-ului]
   cd rag-ai-project
   ```

2. **Instalează dependințele**
   ```bash
   npm install --legacy-peer-deps
   # sau
   yarn install --legacy-peer-deps
   ```

3. **Configurează variabilele de mediu**
   Creează un fișier `.env.local` în directorul rădăcină cu următoarele variabile:
   ```env
   # Configurare Ollama (obligatoriu)
   OLLAMA_BASE_URL=http://localhost:11434
   
   # Configurare Gemini (obligatoriu)
   GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
   ```

## 🚦 Pornirea aplicației

1. **Pornește serverul de dezvoltare**
   ```bash
   npm run dev
   # sau
   yarn dev
   ```

2. **Deschide aplicația în browser**
   Deschide [http://localhost:3000](http://localhost:3000) în browser-ul tău.

## 🛠 Utilizare

1. **Încarcă documente**
   - Apasă pe butonul "Încarcă document"
   - Selectează unul sau mai multe fișiere (PDF, XML sau text)
   - Așteaptă până când documentele sunt procesate

2. **Pune întrebări**
   - Scrie întrebarea ta în câmpul de chat
   - Apasă Enter sau butonul de trimitere
   - AI-ul va răspunde pe baza conținutului documentelor încărcate

3. **Gestionează sesiunile**
   - Poți crea noi sesiuni de chat
   - Poți reveni la conversații anterioare
   - Poți șterge documentele încărcate când nu mai sunt necesare

## 🛠 Tehnologii utilizate

- **Frontend**: Next.js 14, React 19, TypeScript
- **UI**: Radix UI, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes
- **Bază de date**: SQLite3 cu better-sqlite3
- **AI**: Google Gemini, Ollama cu modele locale
- **Procesare documente**: pdf.js-extract, xml2js

## 📂 Structura proiectului

```
.
├── app/                    # Rutele aplicației Next.js
├── components/            # Componentele React
├── lib/                   # Utilitare și logica de bază
│   ├── database.ts        # Interacțiunea cu baza de date
│   ├── document-processor.ts # Procesarea documentelor
│   └── ollama-client.ts   # Clientul pentru Ollama
├── public/               # Fișiere statice
└── styles/               # Stiluri globale
```

## 🤝 Contribuții

Contribuțiile sunt binevenite! Dacă dorești să contribui, te rog să creezi un Pull Request.

## 📄 Licență

Acest proiect este licențiat sub [MIT License](LICENSE).

## ✨ Recunoștințe

- [Next.js](https://nextjs.org/)
- [Ollama](https://ollama.ai/)
- [Google Gemini](https://ai.google.dev/)
- [Shadcn/ui](https://ui.shadcn.com/)

---

<div align="center">
  <p>Realizat cu ❤️ pentru comunitatea de AI din România</p>
</div>
