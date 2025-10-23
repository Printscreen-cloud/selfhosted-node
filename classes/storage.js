import recursive from 'recursive-fs';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Storage {
	folderSize(dirPath) {
		return new Promise((resolve, reject) => {
			if (process.platform === 'win32') {
				// Check if the folder is empty and return 0
				if (!fs.readdirSync(dirPath).length) {
					return resolve(0);
				}

				exec(`powershell -Command "& {Get-ChildItem -Path '${dirPath}' -Recurse | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum}"`, (error, stdout) => {
					if (error) {
						return reject(error);
					}

					const size = parseInt(stdout.trim(), 10);
					if (!isNaN(size)) {
						resolve(size);
					} else {
						reject(new Error('Could not determine folder size'));
					}
				});
			} else if (process.platform === 'linux' || process.platform === 'darwin') {
				recursive.readdirr(dirPath, (err, dirs, files) => {
					if (err) {
						return reject(err);
					}
					const size = files.reduce((total, file) => {
						try {
							const stats = fs.statSync(file);
							return total + (stats.isFile() ? stats.size : 0);
						} catch (e) {
							return total;
						}
					}, 0);
					resolve(size);
				});
			} else {
				reject(new Error('Unsupported platform'));
			}
		});
	}

	freeSpace() {
		return new Promise((resolve, reject) => {
			if (process.platform === 'win32') {
				exec(`wmic logicaldisk where "DeviceID='${__dirname[0]}:'" get FreeSpace`, (error, stdout) => {
					if (error) {
						return reject(error);
					}
					const freeSpace = parseInt(stdout.match(/\d+/)[0], 10);
					resolve(freeSpace);
				});
			} else if (process.platform === 'linux' || process.platform === 'darwin') {
				exec(`df -k "${__dirname}"`, (error, stdout) => {
					if (error) {
						return reject(error);
					}
					const freeSpace = parseInt(stdout.split('\n')[1].split(/\s+/)[3], 10) * 1024;
					resolve(freeSpace);
				});
			} else {
				reject(new Error('Unsupported platform'));
			}
		});
	}
}

export default new Storage();