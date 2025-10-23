import express from 'express';
import logs from './classes/logs.js';
import logic from './classes/logic.js';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3001;

// Define API keys
const auth = process.env.AUTH || "9Yw1-asLyCxyikksejiGu";
const secret = process.env.SECRET || "2ba7c7c7146f290bb34e82a640f22d22:add30cdf8cd9f4da3c5c3e9a7d9ad55871b01366b646b3d54127c81feb150c71";
const version = fs.readFileSync('./version.txt', 'utf8').trim();

await logic.setup(app);
logic.loop(auth, secret, version);
setInterval(() => {
	logic.loop(auth, secret, version);
}, 20000);

app.listen(port, () => {
	logs.log(`Node.js server running on port ${port}`);
});
