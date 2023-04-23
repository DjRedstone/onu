const express = require("express");
const app = express();
const server = require("http").createServer(app);
const path = require("path");
const io = require('socket.io')(server);
const CronJob = require('cron').CronJob;

class Player {
    /**
     * @param {String} id 
     * @param {String} name 
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

class Game {
    /**
     * @param {Player} host 
     * @param {Boolean} isPrivate 
     */
    constructor(host, isPrivate) {
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
        this.players = [host];
        this.host = host;
        this.isPrivate = isPrivate;
    }

    containPlayer(player) {
        for (const lPlayer of this.players) {
            if (lPlayer.id == player.id) {
                return true
            }
        }
        return false
    }

    addPlayer(player) {
        if (!this.containPlayer(player))
            this.players.push(player);
    }

    removePlayer(player) {
        if (this.containPlayer(player)) {
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].id == player.id) {
                    this.players.splice(i, 1);
                }
            }
        }
    }

}

class Games {
    constructor() {
        this.data = [];
    }

    codeExist(code) {
        for (const game of this.data) {
            if (game.code == code) {
                return true
            }
        }
        return false
    }

    getGame(code) {
        for (const game of this.data) {
            if (game.code == code) {
                return game
            }
        }
    }

    updateGame(game) {
        for (let i = 0; i < this.data.length; i++) {
            const oldGame = this.data[i];
            if (oldGame.code == game.code) {
                this.data[i] = game;
            }
        }
    }

    createGame(host, isPrivate) {
        let game = new Game(host, isPrivate);
        /*
        do {
            game = new Game(host, isPrivate);
        } while(!this.codeExist(game.code));
        */
        this.data.push(game);
        console.log(`Game created : ${game.code}`);
        return game
    }

    kickPlayer(playerID) {
        const player = new Player(playerID, undefined);
        for (const game of this.data) {
            if (game.containPlayer(player)) {
                game.removePlayer(player);
                this.updateGame(game);
            }
        }
    }

    clean() {
        for (const game of this.data) {
            if (game.players == []) {
                this.data.slice(i, 1);
            }
        }
    }

}

var PORT = 3000;
var GAMES = new Games();

const job = new CronJob("*/30 * * * * *", () => {
    GAMES.clean();
    console.log("GAMES :", GAMES);
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

    socket.on("create-private-game", (hostName) => {
        const game = GAMES.createGame(new Player(socket.id, hostName), false);
        socket.emit("create-private-game", game.code);
    });

    socket.on("create-public-game", (hostName) => {
        const game = GAMES.createGame(new Player(socket.id, hostName), true);
        socket.emit("create-public-game", game.code);
    });

    socket.on("join-game", (code, playerName) => {
        const game = GAMES.getGame(code);
        if (game == undefined) {
            socket.emit("error", {code: 0, message: "La partie n'existe pas !"});
            return
        }
        game.addPlayer(new Player(socket.id, playerName));
        GAMES.updateGame(game);
        socket.emit("join-game", game);
    });

    socket.on("disconnect", () => {
        GAMES.kickPlayer(socket.id);

        console.log(`[-] ${socket.id}`);
    });
});
