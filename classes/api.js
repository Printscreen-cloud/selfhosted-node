import axios from 'axios';

class API {
	call(path, data = {}) {
		return new Promise((resolve, reject) => {
			axios.post(process.env.dev ? `http://172.29.128.1:3000/${path}` : `https://api.printscreen.cloud/${path}`, data, { timeout: 15000 })
				.then(response => {
					resolve(response.data);
				})
				.catch(error => {
					reject(error);
				});
		});
	}
}

export default new API();
