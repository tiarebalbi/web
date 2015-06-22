module.exports = (crypto) => {
	function ManifestPart (manifestPart) {
		const self = this;

		this.id = manifestPart.id;
		this.size = manifestPart.size;
		this.filename = manifestPart.filename;
		this.hash = manifestPart.hash;
		this.data = manifestPart.data;

		this.isValid = (body) => body.length == self.size && crypto.hash(body) == self.hash;

		const contentType = manifestPart.content_type;
		if (contentType) {
			this.contentType = (contentType.defaultValue ? contentType.defaultValue : contentType).toLowerCase();
			this.charset = (contentType.charset ? contentType.charset : 'utf-8').toLowerCase();
		} else {
			this.contentType = 'text/plain';
			this.charset = 'utf-8';
		}

		this.isHtml = () => self.contentType.includes('/html');
	}



	return ManifestPart;
};