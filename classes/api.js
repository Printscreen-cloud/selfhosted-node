import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class API {
	call(path, data = {}) {
		return new Promise((resolve, reject) => {
			const url = process.env.dev ? (process.env.url ? process.env.url + `/${path}` : `http://localhost:3000/${path}`) : `https://api.printscreen.cloud/${path}`;
			axios.post(url, data)
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