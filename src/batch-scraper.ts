import puppeteer, { type Browser, type Page } from "puppeteer";
import {
	browserPath,
	type DoctorInfo,
	scrapeDoctorInfo,
} from "./doctor-scraper";

export interface DoctorResult {
	url: string;
	data: DoctorInfo | null;
	error?: string;
	pageNumber?: number;
}

async function getDoctorLinksWithPagination(
	listPageUrl: string,
	maxPages: number = 10,
	browser?: Browser,
): Promise<{ links: string[]; pageNumber: number }[]> {
	let ownBrowser: Browser | null = null;
	let page: Page | null = null;

	try {
		// If no browser provided, launch our own
		if (!browser) {
			ownBrowser = await puppeteer.launch({
				headless: false,
				executablePath: browserPath,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});
			browser = ownBrowser;
		}

		page = await browser.newPage();

		// 1. Handle Cookie Consent ONCE at the start
		try {
			await page.goto(listPageUrl, { waitUntil: "domcontentloaded" });
			const consentButton = await page.waitForSelector(
				"#onetrust-reject-all-handler",
				{
					timeout: 4000,
				},
			);
			if (consentButton) {
				console.log("Rejecting cookies...");
				await consentButton.click();
				await new Promise((r) => setTimeout(r, 1000)); // Wait for banner to close
			}
		} catch {
			console.log("Cookie consent banner not found or already handled.");
		}

		const allPages: { links: string[]; pageNumber: number }[] = [];
		const allUniqueUrls = new Set<string>(); // Track unique URLs across ALL pages

		// 2. Loop through pages via URL manipulation instead of clicking "Next"
		for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
			console.log(`\n=== Scanning Page ${pageNum} ===`);

			// Construct URL: If page 1, use base. If > 1, append &page=X
			const urlToVisit =
				pageNum === 1 ? listPageUrl : `${listPageUrl}&page=${pageNum}`;

			try {
				await page.goto(urlToVisit, {
					waitUntil: "domcontentloaded", // Faster than networkidle2
					timeout: 60000, // Increase timeout to 60s
				});

				// Small random delay to act human
				await new Promise((resolve) => setTimeout(resolve, 1500));

				// 3. CORRECT SELECTOR for Doctor Profile Links
				// We look for the H3 tag inside the card, then the anchor inside that.
				const links = await page.$$eval(
					".card-body h3 a.text-body",
					(anchors) =>
						anchors
							.map((a) => a.href)
							.filter((href) => href?.startsWith("http")), // Filter invalid links
				);

				// Filter out duplicates from current page AND across all pages
				const newUniqueLinks = links.filter((link) => !allUniqueUrls.has(link));

				// Add new unique links to our global set
				for (const link of newUniqueLinks) {
					allUniqueUrls.add(link);
				}

				console.log(
					`Found ${links.length} doctor links on page ${pageNum} (${newUniqueLinks.length} new unique)`,
				);

				if (newUniqueLinks.length === 0) {
					console.log("No new unique links found on this page.");
				}

				// Only add the page if it has new unique links
				if (newUniqueLinks.length > 0) {
					allPages.push({ links: newUniqueLinks, pageNumber: pageNum });
				}

				// Stop if no links at all found on this page
				if (links.length === 0) {
					console.log("No links found on this page. Ending pagination.");
					break;
				}
			} catch (err) {
				console.error(`Failed to load page ${pageNum}:`, err);
			}
		}

		console.log(
			`\nTotal unique doctors found across all pages: ${allUniqueUrls.size}`,
		);
		return allPages;
	} catch (error) {
		console.error("Error getting doctor links:", error);
		throw error;
	} finally {
		if (page) await page.close();
		if (ownBrowser) await ownBrowser.close();
	}
}

export async function scrapeMultipleDoctors(
	listPageUrl: string,
	concurrency: number = 5,
	maxPages: number = 10,
): Promise<DoctorResult[]> {
	let browser: Browser | null = null;

	try {
		browser = await puppeteer.launch({
			headless: false,
			executablePath: browserPath, // Keep commented for local dev, uncomment for Docker/Linux
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
			defaultViewport: { width: 1920, height: 1080 },
		});

		// Get all links first
		const allPages = await getDoctorLinksWithPagination(
			listPageUrl,
			maxPages,
			browser,
		);

		if (allPages.length === 0) {
			console.log("No pages found");
			return [];
		}

		const results: DoctorResult[] = [];
		let totalDoctors = 0;
		const scrapedUrls = new Set<string>(); // Track URLs already scraped in this session

		// Process pages
		for (const pageData of allPages) {
			const { links, pageNumber } = pageData;
			totalDoctors += links.length;

			console.log(
				`\n=== Processing Page ${pageNumber} - ${links.length} doctors ===`,
			);

			// Process in batches
			for (let i = 0; i < links.length; i += concurrency) {
				const batch = links.slice(i, i + concurrency);
				const batchNum = Math.floor(i / concurrency) + 1;
				const totalBatches = Math.ceil(links.length / concurrency);

				console.log(
					`Page ${pageNumber} - Batch ${batchNum}/${totalBatches}: Processing ${batch.length} doctors...`,
				);

				const batchPromises = batch.map(async (url, index) => {
					try {
						// Skip if already scraped in this session
						if (scrapedUrls.has(url)) {
							console.log(`⏭️  Skipped (already scraped): ${url}`);
							return null;
						}

						await Bun.sleep(200 * index); // To not open too many tabs at once

						// biome-ignore lint/style/noNonNullAssertion: it's checked above
						const data = await scrapeDoctorInfo(url, browser!);
						scrapedUrls.add(url); // Mark as scraped
						console.log(`✅ Scraped: ${data.name}`);
						return { url, data, pageNumber };
					} catch (error) {
						scrapedUrls.add(url); // Mark as attempted, even on error
						console.error(
							`❌ Error scraping ${url}:`,
							error instanceof Error ? error.message : error,
						);
						return {
							url,
							data: null,
							error: error instanceof Error ? error.message : "Unknown error",
							pageNumber,
						};
					}
				});

				const batchResults = await Promise.all(batchPromises);
				results.push(...batchResults.filter((r) => r !== null)); // Filter out skipped entries

				// Wait between batches
				if (i + concurrency < links.length) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}
		}

		console.log(`\nTotal pages processed: ${allPages.length}`);
		console.log(`Total doctors found: ${totalDoctors}`);
		console.log(`Total unique doctors scraped: ${scrapedUrls.size}`);

		return results;
	} catch (error) {
		console.error("Error in scrapeMultipleDoctors:", error);
		throw error;
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}
