import { type DoctorResult, scrapeMultipleDoctors } from "./batch-scraper";

/**
 * In questa demo, viene fatto lo scraping di profili di psicoterapeuti
 * da "miodottore.it", raccogliendo informazioni come nome, valutazioni,
 * numero di recensioni e biografie estese.
 *
 * I risultati vengono salvati in un file JSON per poi essere analizzati
 * da un'intelligenza artificiale (per ora, Gemini) in modo da valutare
 * l'idoneità di ogni terapeuta rispetto a un profilo paziente specifico
 * (`mock-profile.ts`).
 */

const listPageUrl =
	"https://www.miodottore.it/cerca?filters%5Bspecializations%5D%5B0%5D=22&loc=Bologna%2C%20BO&q=psicoterapeuta";

async function main() {
	const concurrency = 12; // Number of pages to scrape simultaneously
	const maxPages = 10; // Maximum number of pages to scrape

	try {
		console.log("Starting scrape...");
		console.log(
			`Will scrape up to ${maxPages} pages with concurrency of ${concurrency}`,
		);

		const results = await scrapeMultipleDoctors(
			listPageUrl,
			concurrency,
			maxPages,
		);

		console.log("\n=== SCRAPING COMPLETE ===");
		console.log(`Total doctors scraped: ${results.length}`);
		console.log(`Successful: ${results.filter((r) => r.data !== null).length}`);
		console.log(`Failed: ${results.filter((r) => r.data === null).length}`);

		// Group by page
		const byPage: { [key: number]: DoctorResult[] } = {};
		results.forEach((result) => {
			const page = result.pageNumber || 1;
			if (!byPage[page]) byPage[page] = [];
			byPage[page].push(result);
		});

		console.log("\nResults by page:");
		Object.keys(byPage)
			.sort((a, b) => Number(a) - Number(b))
			.forEach((page) => {
				const pageResults = byPage[Number(page)];
				if (!pageResults) {
					console.log(`  Page ${page}: No results`);
					return;
				}
				console.log(
					`  Page ${page}: ${pageResults.length} doctors (${pageResults.filter((r) => r.data).length} successful)`,
				);
			});

		// Save results to JSON file
		Bun.write("doctor-results.json", JSON.stringify(results, null, 2));
		console.log("\nResults saved to doctor-results.json");

		// Print summary
		console.log("\n=== SUMMARY ===");
		results.forEach((result, index) => {
			console.log(`\n[${index + 1}] Page ${result.pageNumber} - ${result.url}`);
			if (result.data) {
				console.log(`  Name: ${result.data.name}`);
				console.log(`  Rating: ${result.data.rating || "N/A"}`);
				console.log(`  Reviews: ${result.data.reviewCount || "N/A"}`);
				console.log(
					`  Has extended about: ${result.data.extendedAbout ? "Yes" : "No"}`,
				);
			} else {
				console.log(`  Error: ${result.error}`);
			}
		});
	} catch (error) {
		console.error("Failed to scrape doctors:", error);
		process.exit(1);
	}
}

main();
