import { Font, Script, Variant } from "../types";
import get from "../utils/request";

const FONT_BASE_URL = "https://fonts.googleapis.com/css";

/**
 * Return URL to the Google Fonts stylesheet for the specified font families and variants.
 * If previewsOnly is set to true, only the characters contained in the font family names are
 * included
 */
export default async function getStylesheet(
	fonts: Font[],
	scripts: Script[],
	variants: Variant[],
	previewsOnly: boolean,
): Promise<string> {
	const url = new URL(FONT_BASE_URL);

	// Build query URL for specified font families and variants
	const variantsStr = variants.join(",");
	const familiesStr = fonts.map((font): string => `${font.family}:${variantsStr}`);
	url.searchParams.append("family", familiesStr.join("|"));

	// Query the fonts in the specified scripts
	url.searchParams.append("subset", scripts.join(","));

	// If previewsOnly: Only query the characters contained in the font names
	if (previewsOnly) {
		// Concatenate the family names of all fonts
		const familyNamesConcat = fonts.map((font): string => font.family).join("");
		// Create a string with all characters (listed once) contained in the font family names
		const downloadChars = familyNamesConcat
			.split("")
			.filter((char, pos, self): boolean => self.indexOf(char) === pos)
			.join("");
		// Query only the identified characters
		url.searchParams.append("text", downloadChars);
	}

	// Fetch and return stylesheet
	return get(url.href);
}
