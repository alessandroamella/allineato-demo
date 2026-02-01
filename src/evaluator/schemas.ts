/**
 * Copyright 2026 Alessandro Amella
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { z } from "zod";

// Flexible patient profile - AI can capture nuances
export const PatientProfileSchema = z.object({
	// Core required fields
	mainIssue: z
		.string()
		.describe(
			"Primary psychological/emotional concern. Can be complex, multifaceted.",
		),
	therapeuticNeeds: z
		.array(z.string())
		.describe(
			"What the patient is looking for in therapy. Can include emotional needs, therapeutic style preferences, relationship dynamics they seek.",
		),
	avoidances: z
		.array(z.string())
		.describe(
			'Approaches, styles, or therapeutic elements to avoid. Include both concrete (e.g., "CBT") and abstract (e.g., "cold, detached therapists").',
		),

	// Optional but rich fields
	contextualFactors: z
		.object({
			age: z.number().optional(),
			lifeSituation: z
				.string()
				.optional()
				.describe(
					"Current life context: work, study, relationships, transitions, etc.",
				),
			personalityTraits: z
				.array(z.string())
				.optional()
				.describe(
					"Relevant traits: intellectualization, high-functioning, people-pleasing, etc.",
				),
			copingMechanisms: z
				.array(z.string())
				.optional()
				.describe(
					"Defense mechanisms or coping strategies, healthy or unhealthy",
				),
		})
		.optional(),

	pastTherapyExperience: z
		.object({
			hasPreviousTherapy: z.boolean(),
			whatWorked: z
				.array(z.string())
				.optional()
				.describe("What was helpful in past therapy"),
			whatDidntWork: z
				.array(z.string())
				.optional()
				.describe("What failed or felt unhelpful"),
			reasonsForFailure: z
				.array(z.string())
				.optional()
				.describe(
					"Why previous therapies failed: mismatch in approach, therapist style, etc.",
				),
		})
		.optional(),

	logistics: z
		.object({
			onlineRequired: z.boolean().optional(),
			languagePreferences: z.array(z.string()).optional(),
			locationPreferences: z.array(z.string()).optional(),
			budget: z.string().optional(),
			availability: z.string().optional(),
		})
		.optional(),

	// Free-form field for capturing complex nuances
	additionalContext: z
		.string()
		.optional()
		.describe(
			"Any additional nuances, complexities, or important details that don't fit elsewhere. This is important for difficult or unique cases.",
		),
});

export type PatientProfile = z.infer<typeof PatientProfileSchema>;

// Flexible criteria - AI determines what matters
export const TherapistCriteriaSchema = z.object({
	greenFlags: z.object({
		therapeuticApproaches: z
			.array(
				z.object({
					name: z.string(),
					reason: z
						.string()
						.describe("Why this approach is good for THIS patient"),
					importance: z.enum(["critical", "high", "moderate", "nice-to-have"]),
				}),
			)
			.describe("Specific therapeutic modalities that would help"),

		thematicElements: z
			.array(
				z.object({
					theme: z
						.string()
						.describe('e.g., "trauma work", "body-based", "relational depth"'),
					keywords: z
						.array(z.string())
						.describe("Specific words/phrases indicating this theme"),
					importance: z.enum(["critical", "high", "moderate", "nice-to-have"]),
				}),
			)
			.describe("Broader themes beyond specific modalities"),

		therapistQualities: z
			.array(
				z.object({
					quality: z
						.string()
						.describe(
							'e.g., "warm", "non-judgmental", "comfortable with silence"',
						),
					indicators: z
						.array(z.string())
						.describe("How this shows up in profile text"),
					importance: z.enum(["critical", "high", "moderate", "nice-to-have"]),
				}),
			)
			.describe("Personal qualities and therapeutic style"),
	}),

	redFlags: z.object({
		therapeuticApproaches: z.array(
			z.object({
				name: z.string(),
				reason: z
					.string()
					.describe("Why this approach is problematic for THIS patient"),
				severity: z.enum([
					"dealbreaker",
					"major-concern",
					"moderate-concern",
					"minor-concern",
				]),
			}),
		),

		thematicElements: z.array(
			z.object({
				theme: z.string(),
				keywords: z.array(z.string()),
				severity: z.enum([
					"dealbreaker",
					"major-concern",
					"moderate-concern",
					"minor-concern",
				]),
			}),
		),

		therapistQualities: z.array(
			z.object({
				quality: z.string(),
				indicators: z.array(z.string()),
				severity: z.enum([
					"dealbreaker",
					"major-concern",
					"moderate-concern",
					"minor-concern",
				]),
			}),
		),
	}),

	// Flexible scoring rules
	scoringRules: z
		.array(
			z.object({
				rule: z
					.string()
					.describe(
						'Natural language rule, e.g., "If CBT is primary approach, cap score at 30"',
					),
				type: z.enum(["hard-cap", "major-penalty", "bonus", "requirement"]),
				reasoning: z
					.string()
					.describe("Why this rule matters for this patient"),
			}),
		)
		.describe("Special scoring considerations for this case"),

	// Capture edge cases
	specialConsiderations: z
		.string()
		.optional()
		.describe(
			"Any unique aspects of this case that require special attention in matching",
		),
});

export type TherapistCriteria = z.infer<typeof TherapistCriteriaSchema>;

// Scoring response
export const TherapistScoreSchema = z.object({
	score: z.number().min(0).max(100),
	reasoning: z.object({
		summary: z.string().describe("Brief overall assessment"),
		greenFlagsFound: z.array(
			z.object({
				flag: z.string(),
				evidence: z.string().describe("Specific text from profile"),
				impact: z.string().describe("How much this helped the score"),
			}),
		),
		redFlagsFound: z.array(
			z.object({
				flag: z.string(),
				evidence: z.string().describe("Specific text from profile"),
				impact: z.string().describe("How much this hurt the score"),
			}),
		),
		missingElements: z
			.array(z.string())
			.optional()
			.describe("Important things we wished we saw but didn't"),
		unexpectedPositives: z
			.array(z.string())
			.optional()
			.describe("Surprising good elements not in original criteria"),
	}),
	confidence: z
		.enum(["high", "medium", "low"])
		.describe("How confident we are in this score based on available info"),
});

export type TherapistScore = z.infer<typeof TherapistScoreSchema>;
