import axios from 'axios';

class API {
	call(path, data = {}) {
		return new Promise((resolve, reject) => {
			axios.post(`https://api.printscreen.cloud/${path}`, data)
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