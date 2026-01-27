import type { PatientProfile, TherapistCriteria } from "./schemas";

export const MOCK_PROFILE: PatientProfile = {
	mainIssue:
		"Chronic emotional dissociation rooted in early relational trauma and lack of emotional mirroring. Presents a significant gap between high cognitive/intellectual functioning and the ability to access or feel emotions in the present moment.",

	therapeuticNeeds: [
		"Relational-focused therapy emphasizing depth and authenticity",
		"Emotional containment and 'holding' environment",
		"Somatic or body-based interventions to bypass intellectual defenses",
		"Non-verbal attunement and therapeutic presence",
		"A therapist capable of identifying and working 'underneath' a high-functioning facade",
		"Repair of attachment wounds through the therapeutic relationship",
		"Experiential focus on the 'here-and-now'",
		"A collaborative, human, and empathic 'journey' rather than a clinical treatment",
	],

	avoidances: [
		"Cognitive-Behavioral Therapy (CBT) and its derivatives",
		"Strategic Brief Therapy or symptom-focused models",
		"Coaching, goal-oriented, or solution-focused interventions",
		"Strictly logical, rationalized, or protocol-driven methodologies",
		"Detached, neutral, or overly formal therapeutic stances",
		"Focus on symptom reduction or behavioral homework",
		"Intellectualized restructuring or cognitive challenges",
		"Linear or purely verbal-logical therapeutic processes",
	],

	contextualFactors: {
		age: 25, // Età generalizzata
		lifeSituation:
			"High-achieving individual, currently engaged in demanding professional or academic paths. High functional capacity in external life (work/study) contrasting with internal emotional disconnection.",
		personalityTraits: [
			"Exceptional verbal and intellectual capabilities",
			"Strong analytical mind used as a defensive shield",
			"Appears highly competent and 'put together' externally",
		],
		copingMechanisms: [
			"Hyper-rationalization of emotional pain",
			"Use of logic to maintain distance from felt experience",
			"Compensatory self-reliance and performance-oriented mask",
			"Instantaneous dissociation when facing core vulnerabilities",
		],
	},

	pastTherapyExperience: {
		hasPreviousTherapy: true,
		whatDidntWork: [
			"Manualized or structured cognitive approaches",
			"Therapists who were 'seduced' by the patient's intellectual eloquence",
			"Interventions that remained at a surface, behavioral level",
		],
		reasonsForFailure: [
			"The therapist could not see past the high-functioning mask",
			"The approach reinforced the patient's tendency to stay 'in the head'",
			"Lack of relational depth or emotional warmth",
			"Failure to integrate the somatic/body dimension of trauma",
			"Multiple previous attempts (5+) failed due to mismatch in therapeutic depth",
		],
	},

	logistics: {
		onlineRequired: true,
		languagePreferences: ["Italian"],
		locationPreferences: [
			"Initial focus on Italian-speaking clinicians",
			"Requirement for long-term online continuity regardless of geographical relocation",
		],
	},

	additionalContext:
		"This profile represents a classic 'High-Functioning' trauma case. The patient uses intelligence as a survival mechanism to avoid the pain of early emotional neglect. Traditional talk therapies often fail here because the patient is 'too good' at talking, using words to stay away from feelings. The healing agent must be the relationship itself—an authentic, reparative emotional experience. Ideal matches include Gestalt, Relational Psychoanalysis, Bioenergetics, or Sensorimotor therapy. Any approach that prioritizes 'logic' or 'fixing symptoms' (like CBT) is contraindicated and will likely lead to another therapeutic failure by reinforcing the patient's existing defensive walls.",
};

export const MOCK_CRITERIA: TherapistCriteria = {
	greenFlags: {
		therapeuticApproaches: [
			{
				name: "Gestalt / Relational Approaches",
				reason:
					"Focus on present-moment awareness and authentic contact to bypass intellectual defenses.",
				importance: "critical",
			},
			{
				name: "Somatic / Sensorimotor / Bioenergetics",
				reason:
					"Addresses emotional blockages through the body, essential for patients who 'stay in their head'.",
				importance: "high",
			},
			{
				name: "Attachment-based Therapy",
				reason:
					"Focuses on repairing relational wounds and emotional mirroring.",
				importance: "critical",
			},
			{
				name: "Humanistic / Existential",
				reason:
					"Prioritizes the authentic therapeutic encounter over rigid techniques.",
				importance: "high",
			},
		],

		thematicElements: [
			{
				theme: "Relational Depth",
				keywords: [
					"autenticità",
					"incontro",
					"relazione terapeutica",
					"presenza",
					"viaggio insieme",
				],
				importance: "critical",
			},
			{
				theme: "Body & Emotion",
				keywords: [
					"corpo",
					"somatico",
					"sentire",
					"vissuto emotivo",
					"regolazione affettiva",
				],
				importance: "critical",
			},
			{
				theme: "Trauma & Attachment",
				keywords: [
					"attaccamento",
					"trauma relazionale",
					"ferite evolutive",
					"base sicura",
				],
				importance: "high",
			},
		],

		therapistQualities: [
			{
				quality: "Empathic & Human",
				indicators: ["calore", "umano", "non giudicante", "accogliente"],
				importance: "critical",
			},
			{
				quality: "Intuitive / Beyond Words",
				indicators: [
					"ascolto profondo",
					"cogliere il non detto",
					"oltre la maschera",
				],
				importance: "high",
			},
			{
				quality: "Collaborative",
				indicators: [
					"co-costruire",
					"orizzontalità",
					"umiltà",
					"assenza di piedistallo",
				],
				importance: "high",
			},
		],
	},

	redFlags: {
		therapeuticApproaches: [
			{
				name: "CBT (Cognitive Behavioral Therapy)",
				reason:
					"Risk of reinforcing intellectualization; focuses on logic rather than felt experience.",
				severity: "dealbreaker",
			},
			{
				name: "Brief Strategic Therapy / Coaching",
				reason:
					"Problem-solving focus is too superficial for deep-seated relational trauma.",
				severity: "dealbreaker",
			},
			{
				name: "Strictly Manualized Protocols",
				reason:
					"Rigidity prevents the authentic relational connection required.",
				severity: "major-concern",
			},
		],

		thematicElements: [
			{
				theme: "Over-intellectualization",
				keywords: [
					"ristrutturazione cognitiva",
					"pensieri disfunzionali",
					"esercizi",
					"compiti a casa",
				],
				severity: "dealbreaker",
			},
			{
				theme: "Superficiality",
				keywords: [
					"tempi brevi",
					"soluzioni pratiche",
					"performance",
					"risultati rapidi",
				],
				severity: "major-concern",
			},
		],

		therapistQualities: [
			{
				quality: "Cold / Detached",
				indicators: [
					"distaccato",
					"puramente tecnico",
					"neutrale in modo rigido",
					"aziendale",
				],
				severity: "dealbreaker",
			},
			{
				quality: "Authoritarian",
				indicators: [
					"direttivo",
					"esperto assoluto",
					"prescrittivo",
					"mancanza di umiltà",
				],
				severity: "major-concern",
			},
		],
	},

	scoringRules: [
		{
			rule: "Cap score at 30 if primary approach is CBT or Strategic",
			type: "hard-cap",
			reasoning:
				"Counter-indicated for patients with strong intellectual defenses.",
		},
		{
			rule: "Add +15 bonus for Gestalt, Somatic or Relational expertise",
			type: "bonus",
			reasoning:
				"Ideal for bypassing verbal masks and accessing core emotions.",
		},
		{
			rule: "Mandatory: Must support remote/online sessions",
			type: "requirement",
			reasoning:
				"Continuity of care is essential regardless of patient location.",
		},
		{
			rule: "Penalty (-20) for overly 'New Age' or unscientific claims",
			type: "major-penalty",
			reasoning: "High-functioning patients require professional credibility.",
		},
	],

	specialConsiderations: `
		Focus on the 'High-Functioning Mask': The patient is articulate and intelligent. 
		The ideal therapist must not be seduced by the patient's verbal competence, but should 
		focus on the underlying emotional disconnection. Relational warmth and a body-oriented 
		approach are more important than academic credentials.
	`,
};
