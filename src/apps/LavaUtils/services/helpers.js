module.exports = function() {
	this.unStyleEmail = (email) => {
		let parts = email.split('@');
		return parts[0].replace(/\./g, '') + '@' + parts[1];
	};
};