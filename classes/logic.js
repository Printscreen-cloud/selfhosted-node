import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import storage from './storage.js';
import logs from './logs.js';
import api from './api.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicFolder = path.join(__dirname, "../", 'public');

class Logic {
	taskList = {};

	async moveFile(fileFolder, fullUrl, targetFile, uid) {
		const fullPath = path.join(publicFolder, fileFolder);
		if (!fs.existsSync(fullPath)) {
			logs.log(`Creating folder ${fullPath}`);
			fs.mkdirSync(fullPath, { recursive: true });
		}

		if (!fs.existsSync(targetFile)) {
			try {
				const fileResponse = await axios.get(fullUrl, { responseType: 'arraybuffer' });

				fs.writeFileSync(targetFile, fileResponse.data);
				logs.log(`[${uid}] Processed file ${targetFile}`);
				this.taskList[uid] = true;
			} catch (error) {
				logs.log(`[${uid}] Could not fetch file. HTTP Error: ${error.response.status}`, true);
			}
		} else {
			logs.log(`[${uid}] Target file already exists. Skipping...`, true);
		}
	}

	async delete(targetFile, uid) {
		if (fs.existsSync(targetFile)) {
			fs.unlinkSync(targetFile);
			logs.log(`[${uid}] Deleted file ${targetFile}`, true);
			this.taskList[uid] = true;
		} else {
			logs.log(`[${uid}] File to delete does not exist. Skipping...`, true);
		}
	}

	async loop(auth, secret, version) {
		let freeSpace = 0;
		let currentUsage = 0;

		try {
			freeSpace = await storage.freeSpace();
		} catch (error) {
			logs.log('Error fetching free space:', true);
			logs.log(error.message, true);
		}

		try {
			currentUsage = await storage.folderSize(publicFolder);
		} catch (error) {
			logs.log('Error calculating folder size:', true);
			logs.log(error.message, true);
		}

		// Preparing postdata
		const postData = {
			auth: auth,
			secret: secret,
			free: freeSpace,
			used: currentUsage,
			version: version
		};

		try {
			var data = []
			await api.call('nodes/verify', postData)
				.then(response => {
					data = response;
				})
				.catch(error => console.error('Error authenticating:', error));


			// No data or wrong data received
			if (!data) {
				logs.log('Printscreen selfhosted node failed, unknown data received from main node!', true);
				return;
			}

			// API didn't accept credentials
			if (!data.success) {
				logs.log('Authentication with Printscreen main node failed!', true);
				logs.log(data, true);
				return;
			}

			// Fetching stats
			const { url, ownerUid, ownerUsername, lastOperation, nodename, allocation, active } = data;

			logs.log(`Authenticated node as ${nodename} (${url}) owned by ${ownerUsername} (${ownerUid})`);
			logs.log(`Last operation occurred at ${lastOperation} (${Math.round((Date.now() / 1000) - lastOperation)} seconds ago)`);

			if(active === 0) {
				logs.log('Node is marked as inactive. Skipping operations...', true);
				logs.transmitLogs(auth, secret, this.taskList);
				return;
			}

			// Process actions
			const actions = data.actions;
			logs.log(`Found ${actions.length} task(s) to work on...`);

			await Promise.all(actions.map(async (row) => {
				const { uid, file, folder, filename, extension, hostnode, hostdomain } = row.data;
				const fileFolder = path.join(publicFolder, folder);
				const fullUrl = `http://${hostdomain}/${folder}/${filename}.${extension}`;
				const targetFile = path.join(fileFolder, `${filename}.${extension}`);

				switch (row.type) {
					case 'move':
						await this.moveFile(folder, fullUrl, targetFile, uid);
						break;

					case 'delete':
						await this.delete(targetFile, uid);
						break;

					default:
						break;
				}
			}));

			await logs.transmitLogs(auth, secret, this.taskList);
		} catch (error) {
			logs.log(error);
			logs.log('Error communicating with Printscreen main node:', true);
			if (!error.response.data.error) return;
			logs.log(error.response.data.error, true);
		}
	}

	setup(app) {
		app.use(express.static(path.join(__dirname, "../", 'public')));

		app.get("/health", (_, res) => {
			logs.log("Health check received. Responding OK.");
			res.status(200).send("OK");
		});

		// Fallback route to handle dynamic paths manually
		app.get('/*', (req, res) => {
			const filePath = path.join(__dirname, 'public', req.path);

			res.sendFile(filePath, (err) => {
				if (err) {
					res.status(404).json({
						error: 'File not found',
						path: req.path,
						status: 404,
					});
				}
			});
		});
/*
		if (!fs.existsSync(publicFolder)) {
			logs.log('Folder public missing. Creating...');
			fs.mkdirSync(publicFolder);
		}
*/
	}
}

export default new Logic();