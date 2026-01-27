import {
	type PatientProfile,
	PatientProfileSchema,
	type TherapistCriteria,
	TherapistCriteriaSchema,
	TherapistScoreSchema,
} from "./schemas";

export class TherapistScoringPromptBuilder {
	buildExtractionPrompt(
		conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
	): string {
		return `You are an expert clinical intake specialist. Analyze this conversation and extract a comprehensive patient profile.

# CONVERSATION HISTORY
${conversationHistory.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n\n")}

# YOUR TASK
Create a rich, nuanced patient profile. Don't oversimplify - capture complexity, ambivalence, and contradictions if present.

**Key principles:**
- Be specific about therapeutic needs (not just "wants help with anxiety" but "seeks relational approach to anxiety rooted in attachment trauma")
- Capture both explicit requests AND implicit needs you infer
- Note defense mechanisms, coping styles, relationship patterns
- If past therapy failed, understand WHY (approach mismatch? therapist style? timing?)
- Don't force structure - if something is complex or unclear, say so in additionalContext

**Example of good vs. rigid extraction:**
❌ Rigid: "mainIssue: anxiety"
✅ Nuanced: "mainIssue: Dissociative anxiety stemming from emotional neglect; high-functioning facade masks deep relational wounds"

Respond with a JSON object matching this schema:
${JSON.stringify(PatientProfileSchema.shape, null, 2)}

Remember: Complex cases NEED rich description in additionalContext. Don't leave it empty if there are nuances!`;
	}

	buildCriteriaPrompt(profile: PatientProfile): string {
		return `You are an expert in therapeutic modalities and therapist-patient matching. Given this patient profile, determine what would make an ideal therapeutic match.

# PATIENT PROFILE
${JSON.stringify(profile, null, 2)}

# YOUR TASK
Create matching criteria that balances specificity with flexibility. Think deeply about:

1. **What therapeutic approaches would genuinely help?** (Not just obvious ones)
2. **What therapist qualities matter most?** (Warmth, directness, tolerance for intellectualization, etc.)
3. **What are absolute deal-breakers vs. just suboptimal?**
4. **Are there green flags we might not think to look for?** (E.g., therapist has personal experience with similar issues)

**Critical: Weight your criteria by importance**
- Use "critical" sparingly - only for must-haves or absolute avoid
- "high" for strong preferences
- "moderate" for nice-to-haves
- Use severity ratings thoughtfully on red flags

**For complex cases:** 
- Add nuanced scoring rules (e.g., "CBT is red flag BUT if combined with Schema Therapy it's okay")
- Note in specialConsiderations any unique matching challenges
- Think about what could be in profile text that we wouldn't explicitly search for

Respond with JSON matching this schema:
${JSON.stringify(TherapistCriteriaSchema.shape, null, 2)}`;
	}

	buildScoringPrompt(
		profile: PatientProfile,
		criteria: TherapistCriteria,
	): string {
		return `You are an expert clinical matcher. Score this therapist's fit for a specific patient.

# PATIENT PROFILE
${JSON.stringify(profile, null, 2)}

# MATCHING CRITERIA
${JSON.stringify(criteria, null, 2)}

# SCORING INSTRUCTIONS

**Your job is to:**
1. Read the therapist profile carefully
2. Look for green flags AND red flags
3. Apply scoring rules but USE YOUR JUDGMENT
4. Assign a score 0-100 with detailed reasoning

**Scoring framework:**
- Start at 50 (neutral)
- Add points for green flags (weighted by importance)
- Subtract for red flags (weighted by severity)
- Apply special scoring rules
- BUT: Use clinical judgment - don't be purely mechanical

**Important nuances:**
- Some green flags might not be explicitly stated but implied by tone/approach
- Absence of information ≠ red flag (e.g., no mention of CBT isn't the same as "does CBT")
- Look for unexpected fit factors not in original criteria
- If profile is vague/thin, note lower confidence
- A "dealbreaker" red flag should cap score around 20-30, not 0 (they might still help someone else)

**What makes a great match (80-100):**
- Multiple critical green flags present
- No major red flags
- Tone/style aligns with patient needs
- Unexpected bonus factors

**What makes a poor match (0-30):**
- Dealbreaker red flags present
- Missing most critical green flags
- Fundamental misalignment in approach

# THERAPIST PROFILE TO SCORE
"""
{{PROFILE_TEXT}}
"""

Respond with JSON matching this schema:
${JSON.stringify(TherapistScoreSchema.shape, null, 2)}

Be thorough in reasoning - cite specific text from profile as evidence.`;
	}
}
