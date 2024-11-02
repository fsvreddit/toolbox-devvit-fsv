import Ajv from 'ajv';
import {
	DEFAULT_REMOVAL_REASONS,
	DEFAULT_USERNOTE_TYPES,
	migrateConfigToLatestSchema,
} from '../helpers/config';
import {
	CONFIG_SCHEMA,
	RawRemovalReasonSettings,
	RawSubredditConfig,
	RawUsernoteType,
} from '../types/RawSubredditConfig';

// type imports for doc references
import type {Usernote} from '../types/Usernote';

/**
 * A class that interfaces with the raw contents of a subreddit's `toolbox`
 * wiki page, automatically handling schema checks and providing methods to read
 * and modify subreddit configuration.
 */
export class SubredditConfig {
	private data: RawSubredditConfig;

	constructor (jsonString: string) {
		this.data = migrateConfigToLatestSchema(JSON.parse(jsonString));
		this.validateConfig();
	}

	private validateConfig () {
		const ajv = new Ajv({coerceTypes: true});
		const validator = ajv.compile(CONFIG_SCHEMA);

		if (!validator(this.data)) {
			throw new Error(ajv.errorsText(validator.errors));
		}

		// AJV coerces to null, not undefined.
		for (const prop in this.data) {
			if (this.data[prop] === null) {
				this.data[prop] = undefined;
			}
		}
	}

	/** Returns all usernote types. */
	getAllNoteTypes (): RawUsernoteType[] {
		// If the config doesn't specify any note types, make a copy of the
		// default set and add them to the config so the unambiguous form will
		// be written back
		if (!this.data.usernoteColors || !this.data.usernoteColors.length) {
			const defaultTypes = DEFAULT_USERNOTE_TYPES.map(noteType => ({
				...noteType,
			}));
			this.data.usernoteColors = defaultTypes;
		}

		return this.data.usernoteColors;
	}

	/**
	 * Returns the usernote type matching the given key. Useful for looking up
	 * display information for a usernote from {@linkcode Usernote.noteType}.
	 *
	 * @example Get the color and text of a note type from the key:
	 * ```ts
	 * const toolbox = new ToolboxClient(reddit);
	 * const subreddit = 'mildlyinteresting';
	 *
	 * // Acquire a note somehow
	 * const usernotes = toolbox.getUsernotes(subreddit);
	 * const note = usernotes.get('eritbh')[0];
	 *
	 * // Look up information about the type of this note
	 * const subConfig = toolbox.getConfig(subreddit);
	 * const {color, text} = subConfig.getNoteType(note.noteType);
	 * ```
	 */
	getNoteType (key: string) {
		const noteTypes = this.getAllNoteTypes();
		return noteTypes.find(noteType => noteType.key === key);
	}

	/**
	 * Returns domain tags configured on the subreddit.
	 * @example Get all domain tags configured for the subreddit
	 * ```ts
	 * const toolbox = new ToolboxClient(reddit);
	 * const subreddit = 'mildlyinteresting';
	 *
	 * const subConfig = toolbox.getConfig(subreddit);
	 * const tags = subConfig.getDomainTags();
	 * ```
	 */
	getDomainTags () {
		return this.data.domainTags ?? [];
	}

	/**
	 * Returns the ban macro for the subreddit, if configured.
	 * If no macro is configured, `undefined` is returned.
	 * @example Get the ban macro for the subreddit
	 * ```ts
	 * const toolbox = new ToolboxClient(reddit);
	 * const subreddit = 'mildlyinteresting';
	 *
	 * const subConfig = toolbox.getConfig(subreddit);
	 * const macro = subConfig.getBanMacro();
	 * ```
	 */
	getBanMacro () {
		return this.data.banMacros;
	}

	/**
	 * Returns the removal reason settings for the subreddit, omitting the
	 * reasons themselves
	 * @example Get the removal reasons for the subreddit
	 * ```ts
	 * const toolbox = new ToolboxClient(reddit);
	 * const subreddit = 'mildlyinteresting';
	 *
	 * const subConfig = toolbox.getConfig(subreddit);
	 * const removalReasonSettings = subConfig.getRemovalReasonSettings();
	 */
	getRemovalReasonSettings (): RawRemovalReasonSettings {
		if (!this.data.removalReasons) {
			return DEFAULT_REMOVAL_REASONS;
		}

		return {
			header: this.data.removalReasons.header,
			footer: this.data.removalReasons.footer,
			pmsubject: this.data.removalReasons.pmsubject,
			logreason: this.data.removalReasons.logreason,
			logsub: this.data.removalReasons.logsub,
			logtitle: this.data.removalReasons.logtitle,
			bantitle: this.data.removalReasons.bantitle,
			getfrom: this.data.removalReasons.getfrom,
			removalOption: this.data.removalReasons.removalOption,
			typeReply: this.data.removalReasons.typeReply,
			typeStickied: this.data.removalReasons.typeStickied,
			typeCommentAsSubreddit: this.data.removalReasons.typeCommentAsSubreddit,
			typeLockThread: this.data.removalReasons.typeLockComment,
			typeLockComment: this.data.removalReasons.typeLockComment,
			typeAsSub: this.data.removalReasons.typeAsSub,
			autoArchive: this.data.removalReasons.autoArchive,
		};
	}

	/**
	 * Returns the removal reasons for the subreddit
	 * @example Get the removal reasons for the subreddit
	 * ```ts
	 * const toolbox = new ToolboxClient(reddit);
	 * const subreddit = 'mildlyinteresting';
	 *
	 * const subConfig = toolbox.getConfig(subreddit);
	 * const removalReasons = subConfig.getRemovalReasons();
	 * ```
	 */
	getRemovalReasons () {
		if (!this.data.removalReasons) {
			return [];
		}

		return this.data.removalReasons.reasons;
	}

	/**
	 * Returns the mod macros for the the subreddit.
	 * Macros are returned with text unescaped.
	 * @example Get the mod macros for the subreddit
	 * ```ts
	 * const toolbox = new ToolboxClient(reddit);
	 * const subreddit = 'mildlyinteresting';
	 *
	 * const subConfig = toolbox.getConfig(subreddit);
	 * const modMacros = subConfig.getModMacros();
	 * ```
	 */
	getModMacros () {
		if (!this.data.modMacros) {
			return [];
		}

		return this.data.modMacros;
	}

	/**
	 * Serializes the subreddit config data for writing back to the wiki. **This
	 * method returns an object; you probably want {@linkcode toString}
	 * instead.**
	 * @returns Object which can be serialized to JSON and written as the
	 * contents of the `toolbox` wiki page
	 */
	toJSON () {
		return this.data;
	}

	/**
	 * Stringifies the subreddit config data for writing back to the wiki.
	 * @param indent Passed as the third argument of `JSON.stringify`. Useful
	 * for debugging; however, because wiki space is limited, never provide this
	 * parameter when actually saving config to the wiki.
	 * @returns JSON string which can be saved as the contents of the `toolbox`
	 * wiki page
	 */
	toString (indent?: string | number) {
		return JSON.stringify(this.data, null, indent);
	}
}
