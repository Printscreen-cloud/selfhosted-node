import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class API {
	call(path, data = {}) {
		return new Promise((resolve, reject) => {
			axios.post(process.env.dev ? `http://localhost:3000/${path}` : `https://api.printscreen.cloud/${path}`, data)
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