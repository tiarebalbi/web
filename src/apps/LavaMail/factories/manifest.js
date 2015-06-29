const mimelib = require('mimelib');
const utf8 = require('utf8');
const qEncoding = require('q-encoding');

module.exports = ($translate, contacts, utils, crypto, ManifestPart) => {
	const translations = {
		LB_NO_SUBJECT: ''
	};
	$translate.bindAsObject(translations, 'LAVAMAIL.INBOX');

	function Manifest (manifest) {
		const self = this;

		this.from = Manifest.parseAddresses(manifest.headers.from);
		this.to = Manifest.parseAddresses(manifest.headers.to);
		this.cc = Manifest.parseAddresses(manifest.headers.cc);
		this.bcc = Manifest.parseAddresses(manifest.headers.bcc);

		this.subject = manifest.headers.subject ? manifest.headers.subject : translations.LB_NO_SUBJECT;

		this.getDestinationEmails = () => {
			const emails = utils.uniq([
				...self.to.map(e => e.address),
				...self.cc.map(e => e.address),
				...self.bcc.map(e => e.address)
			]);

			return [...emails];
		};

		this.getFileById = (id) => manifest.parts.find(p => p.id == id);
		
		this.setBody = (data, contentType) => {
			manifest.parts.push({
				id: 'body',
				hash: crypto.hash(data),
				content_type: contentType
			});
		};

		this.getPart = (id = 'body') => {
			let part = manifest.parts.find(p => p.id == id);
			return part ? new ManifestPart(part) : null;
		};

		this.files = manifest.parts.filter(p => p.id != 'body').map(p => new ManifestPart(p));

		this.addAttachment = (id, data, fileName, contentType) => {
			manifest.parts.push({
				id: id,
				hash: crypto.hash(data),
				filename: fileName,
				content_type: contentType ? contentType : 'application/octet-stream',
				charset: 'utf-8',
				size: data.length
			});
		};

		this.isValid = () => !!manifest.parts.find(p => p.id == 'body');

		this.stringify = () => JSON.stringify(manifest);
	}

	Manifest.parseAddresses = (src) => {
		if (!src)
			return [];

		return (angular.isArray(src) ? src : [src])
			.filter(e => !!e)
			.map(e => Manifest.formatAddress(e))
			.filter(e => !!e);
	};

	Manifest.formatAddress = (fromAddress) => {
		if (!fromAddress)
			return null;

		if (!fromAddress.address)
			fromAddress = mimelib.parseAddresses(fromAddress)[0];

		if (!fromAddress)
			return null;

		const address = fromAddress.address ? fromAddress.address : fromAddress;
		const fromContact = contacts.getContactByEmail(address);
		const name = fromAddress.name ? fromAddress.name : (fromContact ? fromContact.getFullName() : '');
		return {
			address,
			name,
			contactPrettyName: fromContact ? fromContact.getFullName() : (
				name ? `${name} <${address}>` : address
			),
			prettyName: address + (name ? ` (${name})` : '')
		};
	};

	Manifest.defaultVersion = '1.0.0';

	Manifest.create = ({fromEmail, to, cc, bcc, subject}) => {
		function encode (s) {
			return s;
			/*if (!s)
				return s;

			return angular.isArray(s)
				? s.map(e => encode(e))
				: '=?utf-8?Q?' + qEncoding.encode(utf8.encode(s)) + '?=';*/
		}

		const manifest = {
			version: Manifest.defaultVersion,
			headers: {
				from: encode(fromEmail),
				to: encode(to),
				subject: encode(subject)
			},
			parts: []
		};

		if (cc && cc.length > 0)
			manifest.headers.cc = encode(cc);

		if (bcc && bcc.length > 0)
			manifest.headers.bcc = encode(bcc);

		console.log('creating email manifest', manifest);

		return new Manifest(manifest);
	};

	function decode (s) {
		if (!s)
			return s;

		return angular.isArray(s)
			? s.map(e => decode(e))
			: s.includes('=') ? utf8.decode(qEncoding.decode(s.replace(/=\?utf-8\?Q\?([^?]+)\?=/, '$1'))) : s;
	}

	function processManifest(rawManifest) {
		if (rawManifest.headers) {
			rawManifest.headers.cc = decode(rawManifest.headers.cc);
			rawManifest.headers.bcc = decode(rawManifest.headers.bcc);
			rawManifest.headers.from = decode(rawManifest.headers.from);
			rawManifest.headers.to = decode(rawManifest.headers.to);
			rawManifest.headers.subject = decode(rawManifest.headers.subject);
		}
	}

	Manifest.createFromObject = (rawManifest) => {
		processManifest(rawManifest);
		return new Manifest(rawManifest);
	};

	Manifest.createFromJson = (manifest) => {
		let rawManifest;
		try {
			rawManifest = JSON.parse(manifest);
		} catch (error) {
			throw new Error('invalid manifest format!');
		}

		processManifest(rawManifest);

		return new Manifest(rawManifest);
	};

	return Manifest;
};