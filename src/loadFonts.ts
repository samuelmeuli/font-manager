import { applyActiveFont, applyFontPreview } from "./font-styles/declarations";
import {
	createStylesheet,
	fillStylesheet,
	setStylesheetType,
	stylesheetExists,
} from "./font-styles/stylesheets";
import extractFontStyles from "./google-fonts/extractFontStyles";
import getStylesheet from "./google-fonts/fontStylesheet";
import { Font, FontList, Script, Variant } from "./types";

/**
 * Helper to get a font-face declaration
 */
function getSimpleStylesheet(font: Font): string {
      return `
        @font-face {

        font-family: '${font.family}';
        font-style: normal;
        font-weight: 400;
        src: url(${font.url});`
}

/**
 * Get the Google Fonts stylesheet for the specified font (in the specified scripts and variants,
 * only the characters needed for creating the font previews), add the necessary CSS declarations to
 * apply them and add the fonts' stylesheets to the document head
 */
export async function loadFontPreviews(
	fonts: FontList,
	scripts: Script[],
	variants: Variant[],
	selectorSuffix: string,
): Promise<void> {
	// Only load previews of fonts which don't have a stylesheet (for preview or full font) yet
	const fontsArray: Font[] = Array.from(fonts.values());
	const fontsGoogle = fontsArray
		.filter((font: Font): boolean => font.url === '' || font.url === undefined)
	const fontsToFetch = fontsArray
		.map((font: Font): string => font.id)
		.filter((fontId): boolean => !stylesheetExists(fontId));

	// Create stylesheet elements for all fonts which will be fetched (this prevents other font
	// pickers from loading the fonts as well)
	fontsToFetch.forEach((fontId): void => createStylesheet(fontId, true));

	let fontStyles: Record<string, string> = {};
  if (fontsGoogle.length > 0) {
    // Get Google Fonts stylesheet containing all requested styles
    const response = await getStylesheet(fontsGoogle, scripts, variants, true);
    // Parse response and assign styles to the corresponding font
    fontStyles = extractFontStyles(response);
  }

	// Create separate stylesheets for the fonts
	fontsArray.forEach((font): void => {
		applyFontPreview(font, selectorSuffix);


		// Add stylesheets for fonts which need to be downloaded
		if (fontsToFetch.includes(font.id)) {
      let fontStyle = ''
      if (font.url === '' || font.url === undefined || font.url === null) {
        // Make sure response contains styles for the font
        if (!(font.id in fontStyles)) {
          console.error(
            `Missing styles for font "${font.family}" (fontId "${font.id}") in Google Fonts response`,
          );
          return;
        }
        fontStyle = fontStyles[font.id]
      } else {
        fontStyle = getSimpleStylesheet(font)
      }
			// Insert styles into the stylesheet element which was created earlier
			fillStylesheet(font.id, fontStyle);
		}
	});
}

/**
 * Get the Google Fonts stylesheet for the specified font (in the specified scripts and variants),
 * add the necessary CSS declarations to apply it and add the font's stylesheet to the document head
 */
export async function loadActiveFont(
	font: Font,
	previousFontFamily: string,
	scripts: Script[],
	variants: Variant[],
	selectorSuffix: string,
): Promise<void> {
	// Only load font if it doesn't have a stylesheet yet
	if (stylesheetExists(font.id, false)) {
		// Add CSS declaration to apply the new active font
		applyActiveFont(font, previousFontFamily, selectorSuffix);
	} else {
		if (stylesheetExists(font.id, true)) {
			// Update the stylesheet's "data-is-preview" attribute to "false"
			setStylesheetType(font.id, false);
		} else {
			// Create stylesheet for the font to be fetched (this prevents other font pickers from loading
			// the font as well)
			createStylesheet(font.id, false);
		}

    let fontStyle
    if (font.url === '' || font.url === undefined || font.url === null) {
      // Get Google Fonts stylesheet containing all requested styles
      fontStyle = await getStylesheet([font], scripts, variants, false);
    } else {
      fontStyle = getSimpleStylesheet(font)
    }

		// Add CSS declaration to apply the new active font
		applyActiveFont(font, previousFontFamily, selectorSuffix);

		// Insert styles into the stylesheet element which was created earlier
		fillStylesheet(font.id, fontStyle);
	}
}
