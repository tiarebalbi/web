const MailParser = require('mailparser').MailParser;
const chan = require('chan');

module.exports = (co, crypto, user, Manifest, ManifestPart) => {
	const reRegex =
		/([\[\(] *)?(RE?S?|FYI|RIF|I|FS|VB|RV|ENC|ODP|PD|YNT|ILT|SV|VS|VL|AW|WG|ΑΠ|ΣΧΕΤ|ΠΡΘ|תגובה|הועבר|主题|转发|FWD?) *([-:;)\]][ :;\])-]*|$)|\]+ *$/i;

	function Email (opt, manifest, files, isHtml = false) {
		const self = this;

		this.id =  opt.id;
		this.threadId = opt.thread;
		this.date = opt.date_created;

		this.manifest = manifest;
		this.subject = manifest && manifest.subject ? manifest.subject : opt.name;
		if (!self.subject)
			self.subject = '';

		this.files = manifest ? manifest.files : files;

		this.getFileById = (id) => self.files.find(f => f.id == id);
		this.isHtml = (() => {
			if (!manifest)
				return isHtml;

			let body = manifest.getPart('body');
			return body ? body.isHtml() : isHtml;
		})();

		const prettify = (a) => a.map(e => e.prettyName).join(',');

		this.kind = opt.kind;
		this.from = manifest ? manifest.from : Manifest.parseAddresses(opt.from);
		if (!this.from)
			this.from = [];

		this.fromAllPretty = prettify(self.from);

		this.to = manifest ? manifest.to : [];
		this.toPretty = prettify(self.to);

		this.cc = manifest ? manifest.cc : [];
		this.ccPretty = prettify(self.cc);

		this.bcc = manifest ? manifest.bcc : [];
		this.bccPretty = prettify(self.bcc);

		this.preview = opt.preview;
		this.body = opt.body;
		this.attachments = opt.attachments ? opt.attachments : [];
	}

	Email.getSubjectWithoutRe = (subject) => subject ? subject.replace(reRegex, '') : '';

	Email.isSecuredKeys = (keys) => !Object.keys(keys).some(e => !keys[e]);

	Email.keysMapToList = (keys) => {
		const publicKeysValues = Object.keys(keys).filter(e => keys[e]).map(e => keys[e]);

		return [...publicKeysValues];
	};

	Email.toEnvelope = ({body, attachmentIds, threadId}, manifest, keys) => co(function *() {
		if (manifest && manifest.isValid && !manifest.isValid())
			throw new Error('invalid manifest');

		if (!attachmentIds)
			attachmentIds = [];
		if (!threadId)
			threadId = null;

		let isSecured = Email.isSecuredKeys(keys);

		const subjectHash = crypto.hash(Email.getSubjectWithoutRe(manifest.subject));

		if (isSecured) {
			keys[user.email] = user.key.armor();
			let publicKeys = Email.keysMapToList(keys);

			console.log('Email.toEnvelope keys', keys, publicKeys);

			let manifestString = manifest.stringify();

			let [envelope, manifestEncoded] = yield [
				crypto.encodeEnvelopeWithKeys({data: body}, publicKeys, 'body', 'body'),
				crypto.encodeWithKeys(manifestString, publicKeys)
			];

			return angular.extend({}, envelope, {
				kind: 'manifest',
				manifest: manifestEncoded.pgpData,

				to: manifest.to.map(e => e.address),
				cc: manifest.cc.map(e => e.address),
				bcc: manifest.bcc.map(e => e.address),
				subject_hash: subjectHash,

				files: attachmentIds,
				thread: threadId
			});
		}

		return {
			kind: 'raw',
			content_type: 'text/html;charset=utf-8',

			to: manifest.to.map(e => e.address),
			cc: manifest.cc.map(e => e.address),
			bcc: manifest.bcc.map(e => e.address),
			subject: manifest.subject,
			subject_hash: subjectHash,
			body: body,

			files: attachmentIds,
			thread: threadId
		};
	});

	Email.fromEnvelope = (envelope) => co(function *() {
		let [body, manifestRaw] = [null, null];
		let isHtml = false;
		let files = [];

		try {
			let [bodyData, manifestRawData] = yield [
				crypto.decodeRaw(envelope.body),
				envelope.kind == 'manifest' ? crypto.decodeRaw(envelope.manifest) : null
			];
			body = {state: 'ok', data: bodyData};
			manifestRaw = manifestRawData;

			if (envelope.kind == 'pgpmime') {
				let ch = chan();
				let mailparser = new MailParser();
				mailparser.on('end', function(mailObject){
					ch(mailObject);
				});
				mailparser.write(body.data);
				mailparser.end();

				let mailObject = yield ch;
				console.log('parsed mime', mailObject);

				isHtml = !!mailObject.html;
				body.data = mailObject.text ? mailObject.text : mailObject.html;

				if (mailObject.attachments) {
					for (let a of mailObject.attachments)
						files.push(new ManifestPart({
							id: a.contentId,
							hash: a.checksum,
							filename: a.fileName,
							content_type: a.contentType ? a.contentType : 'application/octet-stream',
							charset: 'utf-8',
							size: a.length,
							data: a.content
						}));
				}
			}
		} catch (err) {
			console.error('Email.fromEnvelope decrypt error', err);
			body = {state: err.message, data: envelope.body};
		}

		let email = new Email(angular.extend({}, envelope, {
			body: body,
			preview: body
		}), manifestRaw ? Manifest.createFromJson(manifestRaw) : null, files, isHtml);

		console.log('email decoded', email, manifestRaw);

		return email;
	});

	Email.fromDraftFile = (file) => co(function *() {
		let manifest = file.meta ? Manifest.createFromObject({headers: file.meta, parts: []}) : null;

		let email = new Email({
			id: file.id,
			thread: file.id,
			kind: 'manifest',
			date_created: file.created,
			date_modified: file.modified,
			body: file.body
		}, manifest, null, true);

		console.log('fromDraftFile', email);

		return email;
	});

	return Email;
};