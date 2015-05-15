module.exports = /*@ngInject*/(co, inbox) => {
	let foldersByLabelName = {};

	function Folder (labelsByName, labelName, limit = 15) {
		const self = this;

		let list = [];
		let hash = {};

		let offset = 0;
		let isEnd = false;

		function getLabelIdByName(labelName) {
			return labelsByName[labelName];
		}

		this.getView = (count) => co(function *(){
			if (isEnd)
				return list;

			if (list.length < count) {
				let listPiece = yield inbox.requestList(labelName, offset, count);

				offset += listPiece.length;
				if (listPiece.length < limit)
					isEnd = true;

				list = list.concat(listPiece);
			}

			return list;
		});

		this.push = (entry) => {
			if (hash[entry.id])
				return false;

			list.unshift(entry);
			hash[entry.id] = entry;
			return true;
		};

		this.pull = (entry) => {
			if (!hash[entry.id])
				return false;

			list = list.filter(e => e.id != entry.id);
			delete hash[entry.id];
			return true;
		};

		this.addToFolder = (thread) => {
			thread.addLabel(labelName);
			self.push(thread);
		};

		this.removeFromFolder = (thread) => {
			thread.removeLabel(labelName);
			self.pull(thread);
		};

		this.switchFolder = (thread, folderName) => {
			let desiredFolder = foldersByLabelName[folderName];

			if (thread.isLabel(folderName))
				desiredFolder.removeFromFolder(thread);
			else
				desiredFolder.addToFolder(thread);
		};

		this.star = (thread) => {
			self.switchFolder(thread, 'Starred');
		};

		this.removeSafely = (threadId) => {

		};

		this.removePermanently = (threadId) => {

		};

		this.restoreFromSpam = (threadId) => {

		};

		this.restoreFromTrash = (threadId) => {

		};

		foldersByLabelName[labelName] = this;
	}

	return Folder;
};