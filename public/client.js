const delay = ms => new Promise(res => setTimeout(res, ms));
const socket = io();

if (Cookies.get("name") == undefined || Cookies.get("name") == "") {
    Cookies.set("name", "User");
}

const USER_NAME = Cookies.get("name");

$("#welcome-title").text(`Bienvenue ${USER_NAME} !`);

function openLoadPage() {
    $("#loading").show();
    $("#loading").css("opacity", 1);
}

function closeLoadPage() {
    $("#loading").css("opacity", 0);
    setTimeout(() => $("#loading").hide(), 500);
}

var MUSIC = true;
$("#settings-sounds-music").on("click", () => {
    if (MUSIC) {
        $("#settings-sounds-music-img").attr("src", "https://api.iconify.design/material-symbols:music-off.svg");
        $("#music").prop("volume", 0);
    } else {
        $("#settings-sounds-music-img").attr("src", "https://api.iconify.design/material-symbols:music-note.svg");
        $("#music").prop("volume", 1);
    }
    MUSIC = !MUSIC;
});

var SOUNDS_EFFECTS = true;
$("#settings-sounds-effects").on("click", () => {
    if (SOUNDS_EFFECTS)
        $("#settings-sounds-effects-img").attr("src", "https://api.iconify.design/ic:round-volume-off.svg");
    else
        $("#settings-sounds-effects-img").attr("src", "https://api.iconify.design/ic:round-volume-up.svg");
    SOUNDS_EFFECTS = !SOUNDS_EFFECTS;
});

function playCardSound() {
    if (SOUNDS_EFFECTS) {
        const audio = new Audio("./card-sound-effect.mp3");
        audio.play();
    }
}

async function giveCards(nb) {
    for (let i = 0; i < nb; i++) {
        playCardSound();
        await delay(50);
    }
}

var GAME_SETTINGS_TAB = false;
function changeSettingsTab() {
    if (GAME_SETTINGS_TAB) {
        $("#settings-bg-tab-game").css("opacity", 0);
        setTimeout(() => $("#settings-bg-tab-game").hide(), 500);
    } else {
        $("#settings-bg-tab-game").show();
        $("#settings-bg-tab-game").css("opacity", 1);
    }
    GAME_SETTINGS_TAB = !GAME_SETTINGS_TAB;
}
$("#settings-game-button").on("click", changeSettingsTab);
$("#settings-tab-game-close").on("click", changeSettingsTab);

$("form").on("submit", (e) => {
    e.preventDefault();
    const formID = $(e.target).attr("id")

    openLoadPage();
});

socket.on("connect", () => {
    console.log("Connected to the server!");

    socket.on("join-game", (game) => {
        console.log(`Joining game ${game.code}...`);
        console.log("Game data :", game);

        closeLoadPage();
    });
});

socket.on("error", (err) => {
    closeLoadPage();
    alert(`Une erreur est survenue ! (Code erreur : ${err.code})\n\n${err.message}`);
});

const CARDS_DATA = {
    "1-r": {
        x: 19,
        y: 17,
        width: 191,
        height: 284
    },
    "2-r": {
        x: 208,
        y: 17,
        width: 189,
        height: 284
    }
};

function applyCard(cardType, canvasID) {
    const canvas = document.getElementById(canvasID);
    const ctx = canvas.getContext("2d");
    const cards = document.getElementById("cards-img");
    const cardData = CARDS_DATA[cardType]
    ctx.drawImage(cards, cardData.x, cardData.y, cardData.width, cardData.height, 0, 0, canvas.width, canvas.height);
}

applyCard("1-r", "cards-pile");
applyCard("2-r", "cards-top");
