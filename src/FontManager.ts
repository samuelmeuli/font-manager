import "./picker-styles/styles.scss";

import getFontList from "./google-fonts/fontList";
import { loadActiveFont, loadFontPreviews } from "./loadFonts";
import { Font, FONT_FAMILY_DEFAULT, FontList, Options, OPTIONS_DEFAULTS } from "./types";
import { getFontId, validatePickerId } from "./utils/ids";

/**
 * Class for managing the list of fonts for the font picker, keeping track of the active font and
 * downloading/activating Google Fonts
 */
export default class FontManager {
	// Parameters

	private readonly apiKey: string;

	private readonly options: Options;

	private onChange: (font: Font) => void;

	// Other class variables

	// Name of currently applied font
	private activeFontFamily: string;

	// Map from font families to font objects
	private fonts: FontList = new Map<string, Font>();

	// Suffix appended to CSS selectors which would have name clashes if multiple font pickers are
	// used on the same site (e.g. "-test" if the picker has pickerId "test" or "" if the picker
	// doesn't have an ID)
	public selectorSuffix: string;

	/**
	 * Save relevant options, download the default font, add it to the font list and apply it
	 */
	constructor(
		apiKey: string,
		defaultFamily: string = FONT_FAMILY_DEFAULT,
		{
			pickerId = OPTIONS_DEFAULTS.pickerId,
			families = OPTIONS_DEFAULTS.families,
			categories = OPTIONS_DEFAULTS.categories,
			scripts = OPTIONS_DEFAULTS.scripts,
			variants = OPTIONS_DEFAULTS.variants,
			filter = OPTIONS_DEFAULTS.filter,
			limit = OPTIONS_DEFAULTS.limit,
			sort = OPTIONS_DEFAULTS.sort,
		}: Options,
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		onChange: (font: Font) => void = (): void => {},
	) {
		// Validate pickerId parameter
		validatePickerId(pickerId);
		this.selectorSuffix = pickerId ? `-${pickerId}` : "";

		// Save parameters as class variables
		this.apiKey = apiKey;
		this.options = {
			pickerId,
			families,
			categories,
			scripts,
			variants,
			filter,
			limit,
			sort,
		};
		this.onChange = onChange;

		// Download default font and add it to the empty font list
		this.addFont(defaultFamily, false);
		this.setActiveFont(defaultFamily, false);
	}

	/**
	 * Fetch list of all fonts from Google Fonts API, filter it according to the class parameters and
	 * save them to the font map
	 */
	public async init(): Promise<FontList> {
		// Get list of all fonts
		const fonts = await getFontList(this.apiKey);

		// Save desired fonts in the font map
		for (let i = 0; i < fonts.length; i += 1) {
			const font = fonts[i];
			// Exit once specified limit of number of fonts is reached
			if (this.fonts.size >= this.options.limit) {
				break;
			}
			if (
				// Skip default font if it is also contained in the list
				!this.fonts.has(font.family) &&
				// `families` parameter: Only keep fonts whose names are included in the provided array
				(this.options.families.length === 0 || this.options.families.includes(font.family)) &&
				// `categories` parameter: only keep fonts in categories from the provided array
				(this.options.categories.length === 0 || this.options.categories.includes(font.category)) &&
				// `scripts` parameter: Only keep fonts which are available in all specified scripts
				this.options.scripts.every((script): boolean => font.scripts.includes(script)) &&
				// `variants` parameter: Only keep fonts which contain all specified variants
				this.options.variants.every((variant): boolean => font.variants.includes(variant)) &&
				// `filter` parameter: Only keep fonts for which the `filter` function evaluates to `true`
				this.options.filter(font) === true
			) {
				// Font fulfils all requirements: Add it to font map
				this.fonts.set(font.family, font);
			}
		}
		// Download previews for all fonts in list except for default font (its full font has already
		// been downloaded)
		const fontsToLoad = new Map(this.fonts);
		fontsToLoad.delete(this.activeFontFamily);
		loadFontPreviews(fontsToLoad, this.options.scripts, this.options.variants, this.selectorSuffix);

		return this.fonts;
	}

	/**
	 * Return font map
	 */
	public getFonts(): FontList {
		return this.fonts;
	}

	/**
	 * Add a new font to the font map and download its preview characters
	 */
	public addFont(fontFamily: string, downloadPreview = true, url = ''): void {
		// @ts-ignore: Custom font does not need `categories`, `scripts` and `variants` attributes
		const font: Font = {
			family: fontFamily,
			id: getFontId(fontFamily),
      url
		};
		this.fonts.set(fontFamily, font);

		// Download font preview unless specified not to
		if (downloadPreview) {
			const fontMap: FontList = new Map<string, Font>();
			fontMap.set(fontFamily, font);
			loadFontPreviews(fontMap, this.options.scripts, this.options.variants, this.selectorSuffix);
		}
	}

	/**
	 * Remove the specified font from the font map
	 */
	public removeFont(fontFamily: string): void {
		this.fonts.delete(fontFamily);
	}

	/**
	 * Return the font object of the currently active font
	 */
	public getActiveFont(): Font {
		const activeFont = this.fonts.get(this.activeFontFamily);
		if (!activeFont) {
			throw Error(`Cannot get active font: "${this.activeFontFamily}" is not in the font list`);
		} else {
			return activeFont;
		}
	}

	/**
	 * Set the specified font as the active font and download it
	 */
	public setActiveFont(fontFamily: string, runOnChange = true): void {
		const previousFontFamily = this.activeFontFamily;
		const activeFont = this.fonts.get(fontFamily);
		if (!activeFont) {
			// Font is not in fontList: Keep current activeFont and log error
			throw Error(`Cannot update active font: "${fontFamily}" is not in the font list`);
		}

		this.activeFontFamily = fontFamily;
		loadActiveFont(
			activeFont,
			previousFontFamily,
			this.options.scripts,
			this.options.variants,
			this.selectorSuffix,
		).then((): void => {
			if (runOnChange) {
				this.onChange(activeFont);
			}
		});
	}

	/**
	 * Update the onChange function (executed when changing the active font)
	 */
	public setOnChange(onChange: (font: Font) => void): void {
		this.onChange = onChange;
	}
}
