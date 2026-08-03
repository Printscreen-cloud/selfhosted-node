import 'dotenv/config';
import express from 'express';
import logs from './classes/logs.js';
import logic from './classes/logic.js';
import fs from 'fs';

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);
const auth = process.env.AUTH;
const secret = process.env.SECRET;
const version = fs.readFileSync('./version.txt', 'utf8').trim();

if (!auth || !secret) {
	throw new Error('AUTH and SECRET must be provided through the environment');
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
	throw new Error('PORT must be a valid TCP port');
}

await logic.setup(app);
logic.loop(auth, secret, version);
setInterval(() => {
	logic.loop(auth, secret, version);
}, 20000);

app.listen(port, () => {
	logs.log(`Node.js server running on port ${port}`);
});
