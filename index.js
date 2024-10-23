const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const recursive = require('recursive-fs');

const app = express();
const port = process.env.PORT || 3000;

// Define API keys
const auth = process.env.AUTH || "123234234234234234";
const secret = process.env.SECRET || "fdsgdsffw23rwef43rtrgfsdrw";
const nodeversion = "1.0.7";
let taskList = [];

// Setup logs for nodepanel
let logs = "";

function pslog(t, warning = false) {
    const prefix = warning ? "-" : "~";
    console.log(t);
    logs += `${prefix}| ${t}<br>`;
}

// Serve static files from the "public" folder based on dynamic URLs
app.use(express.static(path.join(__dirname, 'public')));

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

function folderSize(dirPath) {
    return new Promise((resolve, reject) => {
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
    });
}

function transmitLogs() {
    const postData = {
        nauth: auth,
        nsecret: secret,
        logs: logs,
        taskList: JSON.stringify(taskList),
    };

    axios.post('https://api.printscreen.cloud/cdn_verification', postData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then(response => console.log('Logs transmitted'))
        .catch(error => console.error('Error transmitting logs:', error));

    logs = ""
}

// Checking infrastructure...
const publicFolder = path.join(__dirname, 'public');

if (!fs.existsSync(publicFolder)) {
    pslog('Folder public missing. Creating...');
    fs.mkdirSync(publicFolder);
}

async function loop() {
    // Get space sizes
    const freeSpace = fs.statSync(__dirname).size;
    const currentUsage = await folderSize(publicFolder);

    // Preparing postdata
    const postData = {
        auth: auth,
        secret: secret,
        free: freeSpace,
        used: currentUsage,
        version: nodeversion
    };

    try {
        const response = await axios.post('https://api.printscreen.cloud/cdn_authentication', postData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        const data = response.data;

        // No data or wrong data received
        if (!data) {
            pslog('Printscreen selfhosted node failed, unknown data received from main node!');
            console.error(response.data);
            return;
        }

        // API didn't accept credentials
        if (!data.authenticated) {
            console.log(data)
            pslog('Authentication with Printscreen main node failed. Invalid credentials!');
            return;
        }

        // Fetching stats
        const { url, ownerUid, ownerUsername, lastOperation, nodename, allocation } = data;

        pslog(`Authenticated node as ${nodename} (${url}) owned by ${ownerUsername} (${ownerUid})`);
        pslog(`Last operation occurred at ${lastOperation} (${Math.round((Date.now() / 1000) - lastOperation)} seconds ago)`);

        // Process actions
        const actions = data.actions;
        pslog(`Found ${actions.length} task(s) to work on...`);

        actions.forEach(async (row) => {
            const { uid, file, ownerUid, extension, createdAt, path: filePath, url } = JSON.parse(row.data);
            const fileFolder = path.join(publicFolder, filePath);
            const fullUrl = `https://${url}/${filePath}/${file}.${extension}`;
            const targetFile = path.join(fileFolder, `${file}.${extension}`);

            switch (row.type) {
                case 'move':
                    if (!fs.existsSync(fileFolder)) {
                        pslog(`Creating folder ${filePath}`);
                        fs.mkdirSync(fileFolder, { recursive: true });
                    }

                    if (!fs.existsSync(targetFile)) {
                        try {
                            const fileResponse = await axios.get(fullUrl, { responseType: 'arraybuffer' });
                            fs.writeFileSync(targetFile, fileResponse.data);
                            pslog(`[${uid}] Processed file ${targetFile}`);
                            taskList[uid] = true;
                        } catch (error) {
                            pslog(`[${uid}] Could not fetch file. HTTP Error: ${error.response.status}`, true);
                        }
                    } else {
                        pslog(`[${uid}] Target file already exists. Skipping...`, true);
                    }
                    break;

                case 'delete':
                    if (fs.existsSync(targetFile)) {
                        fs.unlinkSync(targetFile);
                        pslog(`[${uid}] Deleted file ${targetFile}`, true);
                        taskList[uid] = true;
                    }
                    break;

                default:
                    break;
            }
        });

        transmitLogs();
    } catch (error) {
        pslog('Error communicating with Printscreen main node:', true);
        console.error(error);
    }
}
loop()
setInterval(loop, 20000)

app.listen(port, () => {
    pslog(`Node.js server running on port ${port}`);
});
