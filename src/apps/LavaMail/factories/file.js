module.exports = (co, utils, crypto) => {
	function File(opt) {
		const self = this;

		this.id = opt.id;
		this.name = opt.name;
		this.tags = opt.tags;

		this.body = opt.body;
		this.meta = opt.meta;
	}

	File.fromEnvelope = (envelope) => co(function *() {
		let [body, meta] = yield [co.def(crypto.decodeRaw(envelope.body), null), co.def(crypto.decodeRaw(envelope.meta.meta), null)];
		envelope.body = body;
		envelope.meta = JSON.parse(meta);

		return new File(envelope);
	});
	
	return File;
};