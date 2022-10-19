const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cp = require('child_process');

app.get("/", (req, res) => {
  res.sendFile("./index.html", { root: __dirname });
});

app.get("/socket.io.min.js", (req, res) => {
  res.sendFile("./socket.io.min.js", { root: __dirname });
})

io.on("connection", (socket) => {
  socket.emit("status", "Connected!");

  socket.on("request", (port) => {
    socket.emit("status", "Executing sed...");
    cp.exec(`sed -ri 's/(listen) [0-9]+ (ssl http2;)/\\1 ${port} \\2/g' /etc/nginx/nginx.conf`, (err, stdout, stderr) => {
      if (err) {
        socket.emit("status", `Error happened when executing sed:\n${err}`);
      } else {
        socket.emit("status", "Restarting Nginx...");
				cp.exec("/usr/bin/systemctl restart nginx", (err, stdout, stderr) => {
					if (err) {
            socket.emit("status", `Error happened when restarting Nginx:\n${err}`);
					} else {
            socket.emit("status", "Done!");
					}
				});
      }
    });
  });
});

server.listen("7678");  // PORT = 7678

