module.exports = ($translate, co, user, crypto, ContactEmail) => {
	const translations = {
		LB_UNNAMED_CONTACT: ''
	};

	$translate.bindAsObject(translations, 'LAVAMAIL.COMPOSE');

	function Contact (opt) {
		const self = this;

		angular.extend(this, opt);

		if (this.isNew)
			this.isDecrypted = true;

		this.privateEmails = this.privateEmails ? this.privateEmails.map(e => new ContactEmail(this, e, 'private')) : [];
		this.businessEmails = this.businessEmails ? this.businessEmails.map(e => new ContactEmail(this, e, 'business')) : [];

		// todo: migration script
		if (this.name == '$hidden')
			this.name = '';
		this.hiddenEmail = this.hiddenEmail ? new ContactEmail(this, this.hiddenEmail, 'private') : null;
		if (this.hiddenEmail)
			this.privateEmails.push(this.hiddenEmail);
		//

		this.isCustomName = () => self.firstName && self.lastName && self.name != `${self.firstName.trim()} ${self.lastName.trim()}`;

		this.getFullName = () => {
			const fullName = self.isCustomName() ? self.name + ` (${self.firstName.trim()} ${self.lastName.trim()})` : self.name;
			return fullName ? fullName : translations.LB_UNNAMED_CONTACT;
		};

		this.isMatchEmail = (email) =>
			(self.privateEmails && self.privateEmails.some(e => e.email == email)) ||
			(self.businessEmails && self.businessEmails.some(e => e.email == email));

		this.getSortingField = (id) => {
			let field = '';

			if (id === 1)
				field = self.firstName;
			else
			if (id === 2)
				field = self.lastName;
			field = self.name;

			if (!field)
				field = '';
			return field.trim();
		};

		this.setFromAnotherContact = (contact) => {
			secureFields.forEach(field => {
				self[field] = contact[field];
			});
		};

		this.isStar = () => {
			if (self.privateEmails)
				if (self.privateEmails.some(e => e.isStar))
					return true;

			if (self.businessEmails)
				if (self.businessEmails.some(e => e.isStar))
					return true;

			return false;
		};

		this.isSecured = () => {
			if (self.privateEmails)
				if (self.privateEmails.some(e => e.isSecured()))
					return true;

			if (self.businessEmails)
				if (self.businessEmails.some(e => e.isSecured()))
					return true;

			return false;
		};

		this.getEmail = (email) => {
			if (self.privateEmails) {
				let e = self.privateEmails.find(e => e.email == email);
				if (e)
					return e;
			}
			if (self.businessEmails) {
				let e = self.businessEmails.find(e => e.email == email);
				if (e)
					return e;
			}

			return null;
		};

		this.getSecureClass = () => `sec-${self.isSecured() ? 1 : 0}`;
	}

	const secureFields = ['name', 'firstName', 'lastName', 'companyName', 'privateEmails', 'businessEmails', 'hiddenEmail'];

	Contact.toEnvelope = (contact) => co(function *() {
		const data = secureFields.reduce((a, field) => {
			switch (field) {
				case 'privateEmails':
				case 'businessEmails':
					a[field] = contact[field] ? contact[field].map(e => e.compress()) : [];
					break;
				case 'hiddenEmail':
					a[field] = contact[field] ? contact[field].compress() : null;
					break;
				default:
					a[field] = contact[field];
			}
			return a;
		}, {});

		console.log('contact to envelope', data);

		const envelope = yield crypto.encodeEnvelopeWithKeys({
			data: data,
			encoding: 'json'
		}, [user.key.armor()], 'data');
		envelope.name = '$contact';

		return envelope;
	});

	Contact.fromEnvelope = (envelope) => co(function *() {
		const data = yield crypto.decodeEnvelope(envelope, 'data');

		console.log('Contact.fromEnvelope data', data);

		switch (data.majorVersion) {
			default:
				let c = new Contact(angular.extend({}, {
					id: envelope.id,
					dateCreated: envelope.date_created,
					dateModified: envelope.date_modified,
					isDecrypted: !!data.data
				}, data.data));

				console.log('contact', c);

				return c;
		}
	});

	return Contact;
};