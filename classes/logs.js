import api from './api.js'

class Logs {
	logs = "";

	log(t, warning = false) {
		const prefix = warning ? "-" : "~";
		console.log(t);
		this.logs += `${prefix}| ${t}<br>`;
	}

	async transmitLogs(auth, secret, taskList) {
		const postData = {
			auth: auth,
			secret: secret,
			logs: this.logs,
			taskList: taskList,
		};

		api.call('node/submit/', postData)
			.then(response => {
				console.log('Logs transmitted\n')
			})
			.catch(error => console.error('Error transmitting logs:', error));

		this.logs = ""
	}
}

export default new Logs();