module.exports = (co, utils, crypto) => {
	function File(opt) {
		const self = this;

		this.id = opt.id;
		this.name = opt.name;
		this.tags = opt.tags;

		this.body = opt.body;
		this.meta = opt.meta;

		self.created = opt.date_created;
		self.modified = opt.date_modified;
	}

	File.fromEnvelope = (envelope) => co(function *() {
		let [body, meta] = yield [crypto.decodeRaw(envelope.body, true), crypto.decodeRaw(envelope.meta.meta, true)];

		envelope.body = body;
		envelope.meta = JSON.parse(meta);

		let r = new File(envelope);

		console.log('file created', r);

		return r;
	});
	
	return File;
};