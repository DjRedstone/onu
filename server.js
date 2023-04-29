const express = require("express");
const app = express();
const server = require("http").createServer(app);
const path = require("path");
const io = require('socket.io')(server);
const { Input } = require('enquirer');
const chalk = require("chalk");

class Room {
    constructor(hostID, hostName) {
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
        this.playersName = {p1: hostName, p2: null, p3: null, p4: null};
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

    addPlayer(playerID, playerName) {
        for (let i = 1; i <= 4; i++) {
            if (this.playersID["p"+i] == null) {
                this.playersID["p"+i] = playerID;
                this.playersName["p"+i] = playerName;
                return
            }
        }
    }

    removePlayer(playerID) {
        for (let i = 1; i <= 4; i++) {
            if (this.playersID["p"+i] == playerID) {
                this.playersID["p"+i] = null;
                this.playersName["p"+i] = null;
                return
            }
        }
    }

}

class Rooms {
    codeExist(code) {
        return this[code] != undefined
    }

    createRoom(hostID, hostName) {
        let game = new Room(hostID, hostName);
        this[game.code] = game;
        console.log(chalk.green(`[Room] (+) ${game.code}`));
        return game
    }

    clean() {
        for (const game of Object.values(this)) {
            if (game.getPlayersNumber() == 0) {
                console.log(chalk.red(`[Room] (-) ${game.code}`));
                delete this[game.code];
            }
        }
    }
}

var PORT = 3000;
var ROOMS = new Rooms();

async function askCMD() {
    const cmd = await new Input({
        name: "Var name",
        message: "\n"
    }).run();
    switch (cmd) {
        case "rooms":
            console.table(ROOMS);
            break
    }
    askCMD();
}
askCMD();

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
    console.log(chalk.green(`[Users] (+) ${socket.id}`));

    let actualRoom;
    socket.on("apply-host-name", (hostName) => {
        actualRoom = ROOMS.createRoom(socket.id, hostName);

        socket.on("get-room-data", () => socket.emit("get-room-data", actualRoom));

        socket.on("join-room", (code) => {
            if (!ROOMS.codeExist(code)) {
                socket.emit("error", {code: 0, message: "La table n'existe pas !"});
                return
            }
            const actualRoom = ROOMS[code];
            if (actualRoom.containPlayer(socket.id)) {
                socket.emit("error", {code: 2, message: "Vous êtes déjà dans la partie !"});
                return
            }
            if (actualRoom.getPlayersNumber() >= 4) {
                socket.emit("error", {code: 1, message: "La table contient trop de joueurs !"});
                return
            }
            actualRoom.addPlayer(socket.id);
            socket.emit("join-room", actualRoom);
        });

        socket.on("disconnect", () => {
            console.log(chalk.red(`[Users] (-) ${socket.id}`));
            actualRoom.removePlayer(socket.id);
            ROOMS.clean();
        });
    });
});
