import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const AnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  detected_approach: z.string(),
  reasoning: z.object({
    summary: z.string(),
    green_flags: z.array(z.string()),
    red_flags: z.array(z.string())
  }),
  confidence: z.enum(["high", "medium", "low"])
});
type AnalysisResult = z.infer<typeof AnalysisSchema>;

/** Paziente mock */
const buildPrompt = (therapistText: string) => `
Agisci come un esperto selezionatore clinico. Valuta il seguente terapeuta per il paziente descritto.

# PROFILO PAZIENTE: Mario Rossi
- Età: 25 anni. Status: "High-functioning" (lavoratore/professionista), molto intelligente.
- Problema: Dissociazione emotiva cronica e trauma relazionale. Usa l'intelletto e la logica come scudo per non sentire le emozioni nel corpo.
- Necessità: Approccio relazionale profondo, "holding" emotivo, lavoro somatico/corporeo per bypassare le difese intellettuali.
- Cosa EVITARE: CBT (Cognitivo-Comportamentale), Terapia Strategica, Coaching, o approcci freddi e orientati solo al sintomo/soluzione pratica. Mario è "troppo bravo" a parlare; ha bisogno di qualcuno che veda oltre la sua maschera di efficienza.

# CRITERI DI VALUTAZIONE:
- GREEN FLAGS: Gestalt, Bioenergetica, Psicoanalisi Relazionale, Psicoterapia Sensomotoria. Parole come "corpo", "vissuto", "qui ed ora", "autenticità".
- RED FLAGS: Focus su "ristrutturazione cognitiva", "compiti a casa", "risultati rapidi", "protocolli". 
- REGOLE: Se l'approccio principale è CBT o Strategica, lo score NON può superare 30. Bonus se viene menzionata esplicitamente l'esperienza con traumi da attaccamento.

# TERAPEUTA DA ANALIZZARE:
"""
${therapistText}
"""

Rispondi esclusivamente in formato JSON seguendo lo schema richiesto.
`;

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenAI({ apiKey });

  const inputFile = "doctor-results.json";
  const outputFile = "analysis_results.json";

  const profiles = await Bun.file(inputFile).json();
  const results: (AnalysisResult & { name: string; url: string })[] = [];

  console.log(`Analisi avviata per ${profiles.length} profili...`);

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    console.log(`[${i + 1}/${profiles.length}] Analizzando: ${p.data.name}...`);

    try {
      const therapistText = `
        Nome: ${p.data.name}
        Bio: ${p.data.aboutText}
        Extra: ${p.data.extendedAbout ?? ""}
      `.trim();

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: buildPrompt(therapistText),
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(AnalysisSchema)
        }
      });
      if (!response.text) throw new Error("No response text");

      const analysis = AnalysisSchema.parse(JSON.parse(response.text));

      results.push({
        name: p.data.name,
        url: p.url,
        ...analysis
      });

      // Salvataggio incrementale
      await Bun.write(outputFile, JSON.stringify(results, null, 2));

      // Delay minimo per rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Errore su ${p.data.name}:`, err);
    }
  }

  // Ordinamento finale
  results.sort((a, b) => b.score - a.score);
  await Bun.write(outputFile, JSON.stringify(results, null, 2));

  console.log("\nAnalisi Completata. Top 3:");
  results.slice(0, 3).forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} (${r.score}/100) - ${r.reasoning.summary}`);
  });
}

main().catch(console.error);
