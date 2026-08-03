import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Storage {
	async folderSize(dirPath) {
		let total = 0;
		const pending = [dirPath];

		while (pending.length > 0) {
			const current = pending.pop();
			const entries = await fs.promises.readdir(current, { withFileTypes: true });

			for (const entry of entries) {
				const entryPath = path.join(current, entry.name);
				if (entry.isDirectory()) {
					pending.push(entryPath);
				} else if (entry.isFile()) {
					const stats = await fs.promises.stat(entryPath);
					total += stats.size;
				}
			}
		}

		return total;
	}

	async freeSpace() {
		const stats = await fs.promises.statfs(__dirname, { bigint: true });
		return Number(stats.bavail * stats.bsize);
	}
}

export default new Storage();
