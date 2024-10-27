import test from 'ava';
import {DEFAULT_CONFIG, DEFAULT_USERNOTE_TYPES} from '../helpers/config';
import {RawUsernoteType} from '../types/RawSubredditConfig';
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

test('getAllNoteTypes: returns default set when config is empty', t => {
	const config = new SubredditConfig(JSON.stringify(DEFAULT_CONFIG));
	const noteTypes = config.getAllNoteTypes();
	t.deepEqual(noteTypes, DEFAULT_USERNOTE_TYPES);
});

test('getAllNoteTypes: returns note types passed in', t => {
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

test('getAllNoteTypes: returns undefined if note type not present', t => {
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

test.todo('toJSON');
test.todo('toString');
