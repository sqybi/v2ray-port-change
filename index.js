const cp = require('child_process');
const exec = require('util').promisify(cp.exec);
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const subscription_name = process.env.SUBSCRIPTION_NAME || "AGENT";
const subscription_addr = process.env.SUBSCRIPTION_ADDR || "127.0.0.1";
const subscription_host = process.env.SUBSCRIPTION_HOST || "example.com";

app.get("/", (req, res) => {
    res.sendFile("./index.html", { root: __dirname });
});

app.get("/socket.io.min.js", (req, res) => {
    res.sendFile("./socket.io.min.js", { root: __dirname });
});

app.get("/subscription", async (req, res) => {
    const { subscription_port } = await exec("grep -oP '(?<=listen )[0-9]+(?=.*; #mark)' /etc/nginx/nginx.conf");
    const { subscription_id } = await exec(`grep -oP '(?<="id": ")[0-9a-f\-]+(?=",)' /usr/local/etc/v2ray/config.json`);
    const { subscription_path } = await exec(`grep -oP '(?<="path": ").*(?=")' /usr/local/etc/v2ray/config.json`);
    const subscription_text = `{"v": "2","ps": "${subscription_name}","add": "${subscription_addr}","port": "${subscription_port}","id": "${subscription_id}","aid": "0","scy": "auto","net": "ws","type": "none","host": "${subscription_host}","path": "${subscription_path}","tls": "","sni": "","alpn": ""}`;
    const subscription_base64 = Buffer.from(subscription_text).toString("base64");

    cp.exec("grep -oP '(?<=listen )[0-9]+(?=.*; #mark)' /etc/nginx/nginx.conf", (err, stdout, stderr) => {
        if (err) {
            res.status(500).send("Error happened!");
        } else {
            res.status(200).send(`vmess://${subscription_base64}`);
        }
    });
});

io.on("connection", async (socket) => {
    socket.emit("status", "Connecting...");
    try {
        const { stdout } = await exec("grep -oP '(?<=listen )[0-9]+(?=.*; #mark)' /etc/nginx/nginx.conf");
        socket.emit("status", `Connected!\nCurrent port: ${stdout}`);
    } catch (err) {
        socket.emit("status", `Error happened when connecting:\n${err}`);
    }

    socket.on("request", async (port) => {
        socket.emit("status", "Executing sed...");
        try {
            await exec(`sed -ri 's/(listen )[0-9]+(.*; #mark)/\\1${port}\\2/g' /etc/nginx/nginx.conf`);
            socket.emit("status", "Restarting Nginx...");
            try {
                await exec("/usr/bin/systemctl restart nginx");
                socket.emit("status", "Done!");
            } catch (err) {
                socket.emit("status", `Error happened when restarting Nginx:\n${err}`);
            }
        } catch (err) {
            socket.emit("status", `Error happened when executing sed:\n${err}`);
        }
    });
});

server.listen("7678");  // PORT = 7678
