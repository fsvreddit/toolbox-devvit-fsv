import test from 'ava';
import {
	DEFAULT_CONFIG,
	DEFAULT_REMOVAL_REASONS,
	DEFAULT_USERNOTE_TYPES,
} from '../helpers/config';
import {
	RawBanMacro,
	RawDomainTag,
	RawSubredditConfig,
	RawUsernoteType,
} from '../types/RawSubredditConfig';
import {SubredditConfig} from './SubredditConfig';

test('constructor: throws error when object has additional properties', t => {
	const badObject = {
		ver: 1,
		notAValidToolboxConfig: true,
	};

	const error = t.throws(() => new SubredditConfig(JSON.stringify(badObject)));
	t.is(error?.message, 'data must NOT have additional properties');
});

test('constructor: throws error when object is not conformant to schema', t => {
	const badObject = {
		ver: 1,
		usernoteColors: ['red', 'green', 'purple'],
	};

	const error = t.throws(() => new SubredditConfig(JSON.stringify(badObject)));
	t.is(error?.message, 'data/usernoteColors/0 must be object');
});

test('constructor: accepts Toolbox default config and coerces empty strings to undefined', t => {
	const config = new SubredditConfig(JSON.stringify(DEFAULT_CONFIG)).toJSON();
	t.is(config.domainTags, undefined);
	t.is(config.removalReasons, undefined);
	t.is(config.modMacros, undefined);
	t.is(config.usernoteColors, undefined);
	t.is(config.banMacros, undefined);
});

test('getAllNoteTypes: returns note types passed in', t => {
	const noteTypes: RawUsernoteType[] = [
		{key: 'a', color: 'b', text: 'c'},
		{key: 'd', color: 'e', text: 'f'},
		{key: 'g', color: 'h', text: 'i'},
	];

	const myConfig = {
		ver: 1,
		usernoteColors: noteTypes,
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const noteTypesFromConfig = config.getAllNoteTypes();
	t.deepEqual(noteTypesFromConfig, noteTypes);
});

test('getAllNoteTypes: returns default set when config is empty', t => {
	const config = new SubredditConfig(JSON.stringify(DEFAULT_CONFIG));
	const noteTypes = config.getAllNoteTypes();
	t.deepEqual(noteTypes, DEFAULT_USERNOTE_TYPES);
});

test('getNoteType: returns correct note type', t => {
	const myConfig = {
		ver: 1,
		usernoteColors: [
			{key: 'a', color: 'b', text: 'c'},
			{key: 'd', color: 'e', text: 'f'},
			{key: 'g', color: 'h', text: 'i'},
		] as RawUsernoteType[],
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const noteType = config.getNoteType('d');
	const expected = {key: 'd', color: 'e', text: 'f'} as RawUsernoteType;
	t.deepEqual(noteType, expected);
});

test('getNoteType: returns undefined if note type not present', t => {
	const myConfig = {
		ver: 1,
		usernoteColors: [
			{key: 'a', color: 'b', text: 'c'},
			{key: 'd', color: 'e', text: 'f'},
			{key: 'g', color: 'h', text: 'i'},
		] as RawUsernoteType[],
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const noteType = config.getNoteType('j');
	t.is(noteType, undefined);
});

test('getDomainTags: returns configured macros', t => {
	const tags: RawDomainTag[] = [
		{name: 'youtube.com', color: 'red'},
		{name: 'imgur.com', color: 'blue'},
	];

	const myConfig: RawSubredditConfig = {
		ver: 1,
		domainTags: tags,
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const tagsFromConfig = config.getDomainTags();

	t.deepEqual(tagsFromConfig, tags);
});

test('getDomainTags: returns empty array when tags not configured', t => {
	const myConfig: RawSubredditConfig = {
		ver: 1,
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const tagsFromConfig = config.getDomainTags();

	t.deepEqual(tagsFromConfig, []);
});

test('getBanMacro: returns configured ban macro', t => {
	const macro: RawBanMacro = {
		banMessage: 'Message',
		banNote: 'note',
	};

	const myConfig: RawSubredditConfig = {
		ver: 1,
		banMacros: macro,
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const macroFromConfig = config.getBanMacro();

	t.deepEqual(macroFromConfig, macro);
});

test('getBanMacro: returns undefined if no macro configured', t => {
	const myConfig: RawSubredditConfig = {
		ver: 1,
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const macroFromConfig = config.getBanMacro();

	t.is(macroFromConfig, undefined);
});

test('getRemovalReasonSettings: returns specified configuration', t => {
	const myConfig: RawSubredditConfig = {
		ver: 1,
		removalReasons: {
			header: 'Header',
			footer: 'Footer',
			pmsubject: 'PM Subject',
			logreason: '',
			logsub: '',
			logtitle: '',
			bantitle: '',
			getfrom: 'mildlyinteresting',
			removalOption: 'force',
			typeReply: 'both',
			typeStickied: true,
			typeCommentAsSubreddit: true,
			typeLockThread: true,
			typeLockComment: true,
			typeAsSub: true,
			autoArchive: true,
			reasons: [
				{
					title: 'A',
					text: 'B',
					flairCSS: 'C',
					flairText: 'D',
					removeComments: true,
					removePosts: true,
				},
			],
		},
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const reasons = config.getRemovalReasonSettings();

	for (const key in myConfig.removalReasons) {
		if (key !== 'reasons') {
			t.is(reasons[key], myConfig.removalReasons[key]);
		}
	}

	// Confirm that there is no "reasons" property on the new object.
	t.is(reasons['reasons'], undefined);
});

test('getRemovalReasons: returns configured reasons', t => {
	const myConfig: RawSubredditConfig = {
		ver: 1,
		removalReasons: {
			header: 'Header',
			footer: 'Footer',
			pmsubject: 'PM Subject',
			logreason: '',
			logsub: '',
			logtitle: '',
			bantitle: '',
			getfrom: 'mildlyinteresting',
			removalOption: 'force',
			typeReply: 'both',
			typeStickied: true,
			typeCommentAsSubreddit: true,
			typeLockThread: true,
			typeLockComment: true,
			typeAsSub: true,
			autoArchive: true,
			reasons: [
				{
					title: 'A',
					text: 'B',
					flairCSS: 'C',
					flairText: 'D',
					removeComments: true,
					removePosts: true,
				},
			],
		},
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const reasons = config.getRemovalReasons();

	t.deepEqual(reasons, myConfig.removalReasons?.reasons);
});

test('getRemovalReasons: returns default data when not configured', t => {
	const myConfig: RawSubredditConfig = {
		ver: 1,
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const reasons = config.getRemovalReasons();

	t.deepEqual(reasons, []);
});

test('getModMacros: returns configured macros', t => {
	const myConfig: RawSubredditConfig = {
		ver: 1,
		modMacros: [
			{
				title: 'Macro',
				text: 'Macro%20Text',
				distinguish: false,
				ban: false,
				mute: false,
				remove: false,
				approve: false,
				lockthread: false,
				sticky: false,
				archivemodmail: false,
				highlightmodmail: false,
			},
		],
	};

	const expected = myConfig.modMacros;
	if (!expected || expected.length === 0) {
		t.fail('Unexpected undefined mod macros in test config');
		return;
	}

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const macros = config.getModMacros();

	t.deepEqual(macros, expected);
});

test('getModMacros returns empty array if macros not configured', t => {
	const myConfig: RawSubredditConfig = {
		ver: 1,
	};

	const config = new SubredditConfig(JSON.stringify(myConfig));
	const macros = config.getModMacros();

	t.deepEqual(macros, []);
});

test.todo('toJSON');
test.todo('toString');
