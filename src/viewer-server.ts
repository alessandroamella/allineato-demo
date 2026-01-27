import { file } from "bun";

const PORT = 3000;

Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);

		// Serve the HTML file at root
		if (url.pathname === "/" || url.pathname === "/index.html") {
			return new Response(file("./therapist-viewer.html"), {
				headers: {
					"Content-Type": "text/html",
				},
			});
		}

		// Serve the merged JSON data at /api/therapists
		if (url.pathname === "/api/therapists") {
			// Load both JSON files
			const analysisData: {
				url: string;
				nome_terapeuta: string;
				score: number;
				approccio_rilevato: string;
				match_reasoning: string;
				logistica_check?: string;
				logistica_online?: string;
				logistica_estero?: string;
				logistica_match?: string;
				logistica?: string;
				criticità?: string;
			}[] = await Bun.file("analysis_results.json").json();
			const doctorData: {
				url: string;
				data: {
					name: string;
					rating?: number;
					reviewCount?: number;
					aboutText: string;
					extendedAbout?: string;
					avatar?: string;
				};
				pageNumber: number;
			}[] = await Bun.file("doctor-results.json").json();

			// Create a Map for faster lookup of doctor data by URL
			const doctorMap = new Map(doctorData.map((doc) => [doc.url, doc.data]));

			// Merge the data
			const mergedData = analysisData.map((therapist) => ({
				...therapist,
				rating: doctorMap.get(therapist.url)?.rating || null,
				reviewCount: doctorMap.get(therapist.url)?.reviewCount || null,
				avatar: doctorMap.get(therapist.url)?.avatar || null,
			}));

			return new Response(JSON.stringify(mergedData), {
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		// 404 for other routes
		return new Response("Not Found", { status: 404 });
	},
});

console.log(`🚀 Server running at http://localhost:${PORT}`);
console.log(`📊 View therapist data at http://localhost:${PORT}`);
console.log(`🔗 API endpoint at http://localhost:${PORT}/api/therapists`);
