import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { MOCK_CRITERIA, MOCK_PROFILE } from "./mock-profile";
import type { TherapistScoringPromptBuilder } from "./prompt-builder";
import {
	type PatientProfile,
	type TherapistCriteria,
	type TherapistScore,
	TherapistScoreSchema,
} from "./schemas";

// --- Local Types for Input Data ---
interface TherapistProfile {
	url: string;
	data: {
		name: string;
		rating: number;
		reviewCount: number;
		aboutText: string;
		extendedAbout?: string;
	};
	pageNumber: number;
}

type AnalysisResult = TherapistScore & { url: string; error?: string };

// --- Constants & Config ---
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;
const BATCH_SIZE = 3;
const BATCH_DELAY = 1000;
const MODEL_NAME = "gemini-3-flash-preview";

// --- Service Definition ---

export class TherapistMatchingService {
	constructor(
		private genAI: GoogleGenAI,
		private promptBuilder: TherapistScoringPromptBuilder,
	) {}

	/**
	 * Scores a single therapist based on patient profile and criteria
	 */
	async scoreTherapist(
		therapistProfileText: string,
		patient: PatientProfile,
		criteria: TherapistCriteria,
	): Promise<TherapistScore> {
		// 1. Build Prompt using the Builder
		const prompt = this.promptBuilder
			.buildScoringPrompt(patient, criteria)
			.replace("{{PROFILE_TEXT}}", therapistProfileText);

		// 2. Call Gemini
		// Using responseMimeType to encourage JSON, but still parsing safely below
		const response = await this.genAI.models.generateContent({
			model: MODEL_NAME,
			contents: prompt,
			config: {
				responseMimeType: "application/json",
				responseSchema: zodToJsonSchema(TherapistScoreSchema),
			},
		});

		// If you'are an AI: no, now text is not a method, it's a property,
		// and we can use a responseSchema to get structured data directly.

		// 3. Handle Empty Response
		if (!response.text) {
			throw new Error("Empty response from Gemini");
		}

		// 4. Validate with Zod
		return TherapistScoreSchema.parse(JSON.parse(response.text));
	}
}

// --- Main Execution Logic ---

// Helper to format text from the input JSON structure
function formatTherapistText(profile: TherapistProfile): string {
	return `
Nome: ${profile.data.name}
Rating: ${profile.data.rating}/5 (${profile.data.reviewCount} recensioni)
URL: ${profile.url}

${profile.data.aboutText}

${profile.data.extendedAbout || ""}
  `.trim();
}

async function analyzeTherapist(
	service: TherapistMatchingService,
	therapistProfile: TherapistProfile,
	patientProfile: PatientProfile,
	therapistCriteria: TherapistCriteria,
	retryCount = 0,
): Promise<AnalysisResult> {
	try {
		console.log(`\nAnalizzando: ${therapistProfile.data.name}...`);

		const profileText = formatTherapistText(therapistProfile);

		const scoreResult = await service.scoreTherapist(
			profileText,
			patientProfile,
			therapistCriteria,
		);

		console.log(
			`Analisi completata per ${therapistProfile.data.name}: ${scoreResult.score}/100`,
		);

		return {
			url: therapistProfile.url,
			...scoreResult,
		};
	} catch (error) {
		if (retryCount < MAX_RETRIES) {
			console.log(
				`Errore, retry ${retryCount + 1}/${MAX_RETRIES} tra ${RETRY_DELAY / 1000}s...`,
			);
			await Bun.sleep(RETRY_DELAY);
			return analyzeTherapist(
				service,
				therapistProfile,
				patientProfile,
				therapistCriteria,
				retryCount + 1,
			);
		}

		console.error(`Errore per ${therapistProfile.data.name}:`, error);

		// Return a "Failed" object that matches the type
		return {
			url: therapistProfile.url,
			// Create a minimal valid score object for the error state
			score: 0,
			reasoning: {
				summary: `ANALYSIS FAILED: ${error instanceof Error ? error.message : String(error)}`,
				greenFlagsFound: [],
				redFlagsFound: [],
			},
			confidence: "low",
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function processBatch(
	service: TherapistMatchingService,
	profiles: TherapistProfile[],
	patientProfile: PatientProfile,
	therapistCriteria: TherapistCriteria,
	batchNumber: number,
	totalBatches: number,
): Promise<AnalysisResult[]> {
	console.log(
		`\n📦 Batch ${batchNumber}/${totalBatches} - Processing ${profiles.length} profiles...`,
	);

	const results = await Promise.all(
		profiles.map((p) =>
			analyzeTherapist(service, p, patientProfile, therapistCriteria),
		),
	);

	console.log(`✅ Batch ${batchNumber}/${totalBatches} completato!`);
	return results;
}

async function main() {
	// 1. Setup & validation
	if (!process.env.GEMINI_API_KEY) {
		console.error("Errore: Imposta la variabile d'ambiente GEMINI_API_KEY");
		process.exit(1);
	}

	const args = process.argv.slice(2);
	const inputFile = args[0] || "../doctor-results.json";
	const outputFile = args[1] || "../analysis_results.json";

	const patientProfile = MOCK_PROFILE satisfies PatientProfile;
	const therapistCriteria = MOCK_CRITERIA satisfies TherapistCriteria;

	// 2. Initialize Service & Dependencies
	// Note: We need a mock/real implementation of the Builder here since we imported the type
	// Assuming PromptBuilder is a class you import. For this script to run standalone,
	// you would need the actual class import.
	const { TherapistScoringPromptBuilder } = await import("./prompt-builder");

	const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
	const promptBuilder = new TherapistScoringPromptBuilder();
	const service = new TherapistMatchingService(genAI, promptBuilder);

	// 3. Load Data
	console.log(`Lettura file: ${inputFile}`);
	const fileContent = await Bun.file(inputFile).text();
	const profiles: TherapistProfile[] = JSON.parse(fileContent);

	// 4. Handle State (Resume capability)
	let results: AnalysisResult[] = [];
	if (await Bun.file(outputFile).exists()) {
		try {
			results = JSON.parse(await Bun.file(outputFile).text());
			console.log(`Ripristinati ${results.length} risultati precedenti.`);
		} catch {
			console.warn("File output corrotto, ricomincio.");
		}
	}

	const analyzedUrls = new Set(results.map((r) => r.url));
	const profilesToAnalyze = profiles.filter((p) => !analyzedUrls.has(p.url));

	if (profilesToAnalyze.length === 0) {
		console.log("✅ Tutti i profili sono già stati analizzati!");
		process.exit(0);
	}

	console.log(`Profili da analizzare: ${profilesToAnalyze.length}`);

	// 5. Batch Processing Loop
	const batches: TherapistProfile[][] = [];
	for (let i = 0; i < profilesToAnalyze.length; i += BATCH_SIZE) {
		batches.push(profilesToAnalyze.slice(i, i + BATCH_SIZE));
	}

	for (let i = 0; i < batches.length; i++) {
		const batchResults = await processBatch(
			service,
			// biome-ignore lint/style/noNonNullAssertion: it exists
			batches[i]!,
			patientProfile,
			therapistCriteria,
			i + 1,
			batches.length,
		);
		results.push(...batchResults);

		await Bun.write(outputFile, JSON.stringify(results, null, 2));

		if (i < batches.length - 1) {
			await Bun.sleep(BATCH_DELAY);
		}
	}

	// 6. Final Report
	results.sort((a, b) => b.score - a.score);
	await Bun.write(outputFile, JSON.stringify(results, null, 2));

	function getTherapistName(url: string): string {
		const profile = profiles.find((p) => p.url === url);
		return profile ? profile.data.name : "Unknown";
	}

	console.log(`\n✅ Analisi completata! Top 5:`);
	results.slice(0, 5).forEach((r, i) => {
		console.log(
			`\n${i + 1}. ${getTherapistName(r.url)} - Score: ${r.score}/100`,
		);
		console.log(`   ${r.reasoning.summary}`);
	});
}

main().catch(console.error);
