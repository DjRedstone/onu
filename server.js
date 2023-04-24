const express = require("express");
const app = express();
const server = require("http").createServer(app);
const path = require("path");
const io = require('socket.io')(server);
const CronJob = require('cron').CronJob;

class Room {
    constructor(hostID) {
        // CODE
        const rand = () => {
            let res = ""
            for (let i = 0; i < 4; i++) {
                res += Math.floor(Math.random() * 10)
            }
            return res
        };
        this.code = `${rand()}-${rand()}`;
        // OTHER
        this.playersID = {p1: hostID, p2: null, p3: null, p4: null};
        this.hostID = hostID;
    }

    getPlayersNumber() {
        let nb = 0;
        for (const playerID of Object.values(this.playersID)) {
            if (playerID != null) nb += 1
        }
        return nb
    }

    containPlayer(playerID) {
        for (const lPlayerID of Object.values(this.playersID)) {
            if (lPlayerID == playerID) {
                return true
            }
        }
        return false
    }

    addPlayer(playerID) {
        for (let i = 1; i <= 4; i++) {
            if (this.playersID["p"+i] == null) {
                this.playersID["p"+i] = playerID
                return
            }
        }
    }

    removePlayer(playerID) {
        for (let i = 1; i <= 4; i++) {
            if (this.playersID["p"+i] == playerID) {
                this.playersID["p"+i] = null
                return
            }
        }
    }

}

class Rooms {
    codeExist(code) {
        return this[code] != undefined
    }

    createRoom(host) {
        let game = new Room(host);
        this[game.code] = game;
        console.log(`Room created : ${game.code}`);
        return game
    }
}

var PORT = 3000;
var ROOMS = new Rooms();

const job = new CronJob("*/30 * * * * *", () => {
    console.log("ROOMS :", ROOMS);
});
job.start();

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
  
app.use("/jquery", express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public"));
});

io.on("connection", (socket) => {
    console.log(`[+] ${socket.id}`);

    let actualRoom = ROOMS.createRoom(socket.id);

    socket.on("get-room-data", () => socket.emit("get-room-data", actualRoom));

    socket.on("join-room", (code, playerName) => {
        if (!ROOMS.codeExist(code)) {
            socket.emit("error", {code: 0, message: "La table n'existe pas !"});
            return
        }
        const actualRoom = ROOMS[code];
        if (actualRoom.getPlayersNumber() >= 4) {
            socket.emit("error", {code: 1, message: "La table contient trop de joueurs !"});
            return
        }
        actualRoom.addPlayer(socket.id);
        socket.emit("join-room", actualRoom);
    });

    socket.on("disconnect", () => {
        console.log(`[-] ${socket.id}`);
    });
});
