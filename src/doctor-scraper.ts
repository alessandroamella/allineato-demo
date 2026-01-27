import puppeteer, { type Browser, type Page } from "puppeteer";

export const browserPath =
	process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser";

// Helper to clean up newlines, tabs, and double spaces
function cleanText(text: string | undefined | null): string {
	if (!text) return "";
	return text
		.replace(/\s+/g, " ") // Replace all newlines/tabs with a single space
		.trim();
}

interface DoctorInfo {
	name: string;
	rating: number | null;
	reviewCount: number | null;
	aboutText: string;
	extendedAbout: string | null;
	avatar: string | null;
}

async function scrapeDoctorInfo(
	url: string,
	browser?: Browser,
): Promise<DoctorInfo> {
	let ownBrowser: Browser | null = null;
	let page: Page | null = null;

	try {
		if (!browser) {
			ownBrowser = await puppeteer.launch({
				headless: false,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
				executablePath: browserPath,
			});
			browser = ownBrowser;
		}

		page = await browser.newPage();
		await page.setViewport({ width: 1280, height: 800 });

		// Use domcontentloaded for speed, networkidle2 is too strict/slow
		await page.goto(url, { waitUntil: "domcontentloaded" });

		// 1. Get Name
		let name = "";
		try {
			const rawName = await page.$eval(
				".unified-doctor-header-info__name",
				(el) => el.textContent,
			);
			name = cleanText(rawName);
		} catch {
			// Fallback if the specific class isn't found
			try {
				const rawName = await page.$eval("h1", (el) => el.textContent);
				name = cleanText(rawName);
			} catch {
				console.log("Name not found");
			}
		}
		console.log("Found doctor name:", name);

		// Avatar
		let avatar: string | null = null;
		try {
			avatar = await page.$eval(".unified-doctor-header-info__avatar", (el) =>
				el.getAttribute("href"),
			);
			if (avatar?.startsWith("//")) {
				avatar = `https:${avatar}`;
			}
			console.log("Found avatar:", avatar);
		} catch {
			console.log("Avatar not found");
		}

		// 2. Rating
		let rating: number | null = null;
		try {
			const ratingStr = await page.$eval("u.rating", (el) =>
				el.getAttribute("data-score"),
			);
			rating = ratingStr ? parseFloat(ratingStr) : null;
		} catch {
			console.log("Rating not found");
		}

		// 3. Review Count
		let reviewCount: number | null = null;
		try {
			const reviewText = await page.$eval(
				"u.rating > span:nth-child(1)",
				(el) => el.textContent,
			);
			const match = (reviewText || "").match(/\d+/);
			reviewCount = match ? parseInt(match[0], 10) : null;
		} catch {
			console.log("Review count not found");
		}

		// 4. About Text (Short/Main)
		let aboutText = "";

		// Click on .about-item > a:nth-child(2) if available
		try {
			const linkSelector = ".about-item > a:nth-child(2)";
			const linkExists = await page.$(linkSelector);
			if (linkExists) {
				await linkExists.click();
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		} catch {
			console.log("Link not found or clickable");
		}

		try {
			// Try to find the specific description div first to avoid grabbing the whole card garbage
			// This selector targets the text specifically inside the about section
			const rawAbout = await page.$eval(
				"#about-section div[data-test-id='doctor-about-description-short'], #about-section div[itemprop='description'], #about-section",
				(el) => el.textContent,
			);
			aboutText = cleanText(rawAbout);
			console.log("Found about text length:", aboutText.length);
		} catch {
			console.log("About section not found");
		}

		// 5. Extended About (Modal)
		let extendedAbout: string | null = null;

		try {
			// Reverted to your original class selectors + added a fallback
			const buttonSelector =
				"#about-section button.btn-block, #about-section button[data-test-id='doctor-about-description-show-more']";
			const buttonExists = await page.$(buttonSelector);

			if (buttonExists) {
				// Scroll into view to ensure clickability
				await buttonExists.evaluate((b) => b.scrollIntoView());
				await buttonExists.click();

				// Wait for modal
				await new Promise((resolve) => setTimeout(resolve, 500));

				try {
					await page.waitForSelector(".about-details-modal", { timeout: 3000 });

					const rawExtended = await page.$eval(
						".about-details-modal",
						(el) => el.textContent,
					);
					extendedAbout = cleanText(rawExtended);
					console.log("Found extended about length:", extendedAbout.length);
				} catch {
					console.log("Modal did not open within timeout");
				}
			}
		} catch {
			// Button likely doesn't exist, which is fine (no extended bio)
			console.log("No extended about button found");
		}

		return {
			name,
			rating,
			reviewCount,
			aboutText,
			extendedAbout,
			avatar,
		};
	} catch (error) {
		console.error("Error scraping doctor info:", error);
		throw error;
	} finally {
		if (page) await page.close();
		if (ownBrowser) await ownBrowser.close();
	}
}

export { scrapeDoctorInfo, type DoctorInfo };
