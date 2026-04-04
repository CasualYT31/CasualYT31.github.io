/**
 * @file main.js
 * The code responsible for running the website.
 */

/** @typedef {number} World */
/** @enum {World} */
const WORLD = Object.freeze({
    AsteroidBase: 1,
    Mechtropolis: 2,
    Aquatica: 3,
    Arborea: 4,
    SiliconCity: 5,
    Magma: 6,
    KooFooShip: 7,
});

/** @typedef {number} Level */
/** @enum {Level} */
const LEVEL = Object.freeze({
    One: 1,
    Two: 2,
    Three: 3,
    Four: 4,
});

/** @typedef {number} Gem */
/** @enum {Gem} */
const GEM = Object.freeze({
    Red: 1,
    Cyan: 2,
    Green: 4,
    Pink: 8,
    Orange: 16,
});

/** @typedef {number} Upgrade */
/** @enum {Upgrade} */
const UPGRADE = Object.freeze({
    Zero: 0,
    One: 1,
    Two: 2,
    Three: 3,
    Four: 4,
    Five: 5,
    Six: 6,
});

/** @typedef {number} Difficulty */
/** @enum {Difficulty} */
const DIFFICULTY = Object.freeze({
    Easy: 0,
    Medium: 1,
    Hard: 2,
});

/** @typedef {number} Character */
/** @enum {Character} */
const CHARACTER = Object.freeze({
    DoWah: 0,
    TwoT: 1,
    BBop: 2,
});

/**
 * @typedef {object} CharacterStats
 * @property {number} hp The character's HP, from 0 to 30.
 * @property {Upgrade} defenseStars The defense stars that the character has collected.
 * @property {Upgrade} attackStars The attack stars that the character has collected.
 * @property {Upgrade} defense The defense upgrades that the character has collected.
 * @property {Upgrade} attack The attack upgrades that the character has collected.
 */

/**
 * @typedef {object} Gems
 * @property {boolean} red True if the red gem has been collected, false if not.
 * @property {boolean} cyan True if the cyan gem has been collected, false if not.
 * @property {boolean} green True if the green gem has been collected, false if not.
 * @property {boolean} pink True if the pink gem has been collected, false if not.
 * @property {boolean} orange True if the orange gem has been collected, false if not.
 */

/**
 * @typedef {object} GameState
 * @property {World} world The 1-based index of the world you are in.
 * @property {Level} level The 1-based index of the level you are in, relative to the world.
 * @property {Gems} gems Tracks the gems that you've collected.
 * @property {CharacterStats} red Do-Wah's stats.
 * @property {CharacterStats} blue 2-T's stats.
 * @property {CharacterStats} yellow B.Bop's stats.
 * @property {number} repairKits The number of repair kits you've collected. 0-7.
 * @property {Difficulty} difficulty The difficulty of the game.
 * @property {Character} selectedCharacter The character that was last selected.
 */

/** @type {HTMLDivElement} */
const GameStateForm = document.getElementById("gameStateForm");

/** @type {HTMLDivElement} */
const MessageBox = document.getElementById("messageBox");

/** @type {HTMLButtonElement} */
const GeneratorButton = document.getElementById("generatorButton");

/** @type {HTMLButtonElement} */
const ValidatorButton = document.getElementById("validatorButton");

/** @type {HTMLHeadingElement} */
const HelpTitle = document.getElementById("helpTitle");

/** @type {HTMLDivElement} */
const HelpText = document.getElementById("helpText");

/** @type {HTMLDivElement} */
const WorldButtonsContainer = document.getElementById("worldButtons");

/** @type {HTMLButtonElement[]} */
const WorldButtons = [];
for (let i = 0; i < WorldButtonsContainer.children.length; ++i) {
    WorldButtons.push(WorldButtonsContainer.children.item(i));
}

/** @type {HTMLDivElement} */
const LevelButtonsContainer = document.getElementById("levelButtons");

/** @type {HTMLButtonElement[]} */
const LevelButtons = [];
for (let i = 0; i < LevelButtonsContainer.children.length; ++i) {
    LevelButtons.push(LevelButtonsContainer.children.item(i));
}

/** @type {HTMLImageElement[]} */
const LevelButtonImages = [
    document.getElementById("level1Button"),
    document.getElementById("level2Button"),
    document.getElementById("level3Button"),
    document.getElementById("level4Button"),
];

/** @type {HTMLDivElement} */
const GemButtonsContainer = document.getElementById("gemButtons");

/** @type {HTMLButtonElement[]} */
const GemButtons = [];
for (let i = 0; i < GemButtonsContainer.children.length; ++i) {
    GemButtons.push(GemButtonsContainer.children.item(i));
}

const HpCountLabels = Object.seal({
    /** @type {HTMLDivElement} */
    red: document.getElementById("doWahHpCount"),
    /** @type {HTMLDivElement} */
    blue: document.getElementById("twoTHpCount"),
    /** @type {HTMLDivElement} */
    yellow: document.getElementById("bBopHpCount"),
});

const HpCountInputs = Object.seal({
    /** @type {HTMLInputElement} */
    red: document.getElementById("doWahHpSlider"),
    /** @type {HTMLInputElement} */
    blue: document.getElementById("twoTHpSlider"),
    /** @type {HTMLInputElement} */
    yellow: document.getElementById("bBopHpSlider"),
});

const UpgradeLabels = Object.seal({
    red: Object.seal({
        /** @type {HTMLDivElement} */
        defenseStars: document.getElementById("doWahDefenseStarsCount"),
        /** @type {HTMLDivElement} */
        attackStars: document.getElementById("doWahAttackStarsCount"),
        /** @type {HTMLDivElement} */
        defense: document.getElementById("doWahDefenseCount"),
        /** @type {HTMLDivElement} */
        attack: document.getElementById("doWahAttackCount"),
    }),
    blue: Object.seal({
        /** @type {HTMLDivElement} */
        defenseStars: document.getElementById("twoTDefenseStarsCount"),
        /** @type {HTMLDivElement} */
        attackStars: document.getElementById("twoTAttackStarsCount"),
        /** @type {HTMLDivElement} */
        defense: document.getElementById("twoTDefenseCount"),
        /** @type {HTMLDivElement} */
        attack: document.getElementById("twoTAttackCount"),
    }),
    yellow: Object.seal({
        /** @type {HTMLDivElement} */
        defenseStars: document.getElementById("bBopDefenseStarsCount"),
        /** @type {HTMLDivElement} */
        attackStars: document.getElementById("bBopAttackStarsCount"),
        /** @type {HTMLDivElement} */
        defense: document.getElementById("bBopDefenseCount"),
        /** @type {HTMLDivElement} */
        attack: document.getElementById("bBopAttackCount"),
    }),
});

const UpgradeInputs = Object.seal({
    red: Object.seal({
        /** @type {HTMLInputElement} */
        defenseStars: document.getElementById("doWahDefenseStarsSlider"),
        /** @type {HTMLInputElement} */
        attackStars: document.getElementById("doWahAttackStarsSlider"),
        /** @type {HTMLInputElement} */
        defense: document.getElementById("doWahDefenseSlider"),
        /** @type {HTMLInputElement} */
        attack: document.getElementById("doWahAttackSlider"),
    }),
    blue: Object.seal({
        /** @type {HTMLInputElement} */
        defenseStars: document.getElementById("twoTDefenseStarsSlider"),
        /** @type {HTMLInputElement} */
        attackStars: document.getElementById("twoTAttackStarsSlider"),
        /** @type {HTMLInputElement} */
        defense: document.getElementById("twoTDefenseSlider"),
        /** @type {HTMLInputElement} */
        attack: document.getElementById("twoTAttackSlider"),
    }),
    yellow: Object.seal({
        /** @type {HTMLInputElement} */
        defenseStars: document.getElementById("bBopDefenseStarsSlider"),
        /** @type {HTMLInputElement} */
        attackStars: document.getElementById("bBopAttackStarsSlider"),
        /** @type {HTMLInputElement} */
        defense: document.getElementById("bBopDefenseSlider"),
        /** @type {HTMLInputElement} */
        attack: document.getElementById("bBopAttackSlider"),
    }),
});

/** @type {HTMLDivElement} */
const RepairKitsCountLabel = document.getElementById("repairKitsCount");

/** @type {HTMLInputElement} */
const RepairKitsInput = document.getElementById("repairKitsSlider");

/** @type {HTMLDivElement} */
const DifficultyButtonsContainer = document.getElementById("difficultyButtons");

/** @type {HTMLButtonElement[]} */
const DifficultyButtons = [];
for (let i = 0; i < DifficultyButtonsContainer.children.length; ++i) {
    DifficultyButtons.push(DifficultyButtonsContainer.children.item(i));
}

/** @type {HTMLDivElement} */
const CharacterButtonsContainer = document.getElementById("characterButtons");

/** @type {HTMLButtonElement[]} */
const CharacterButtons = [];
for (let i = 0; i < CharacterButtonsContainer.children.length; ++i) {
    CharacterButtons.push(CharacterButtonsContainer.children.item(i));
}

/** @type {HTMLInputElement} */
const GeneratedPassword = document.getElementById("generatedPassword");

/** @type {HTMLElement[]} */
const GeneratorInputs = WorldButtons.concat(LevelButtons)
    .concat(Object.values(HpCountInputs))
    .concat(Object.values(UpgradeInputs).flatMap((upgradeInputs) => Object.values(upgradeInputs)))
    .concat(Array.from(document.querySelectorAll(".upgradeOffsetButton")))
    .concat(Array.from(document.querySelectorAll(".upgradeOffsetAllButton")))
    .concat([RepairKitsInput])
    .concat(DifficultyButtons)
    .concat(CharacterButtons)
    .concat(GemButtons);

/** @type {HTMLElement[]} */
const ValidatorInputs = [GeneratedPassword];

/** @type {GameState} */
let DesiredGameState = {
    world: WORLD.AsteroidBase,
    level: LEVEL.One,
    gems: {
        red: false,
        cyan: false,
        green: false,
        pink: false,
        orange: false,
    },
    red: {
        hp: 30,
        defenseStars: UPGRADE.Zero,
        attackStars: UPGRADE.Zero,
        defense: UPGRADE.Zero,
        attack: UPGRADE.Zero,
    },
    blue: {
        hp: 30,
        defenseStars: UPGRADE.Zero,
        attackStars: UPGRADE.Zero,
        defense: UPGRADE.Zero,
        attack: UPGRADE.Zero,
    },
    yellow: {
        hp: 30,
        defenseStars: UPGRADE.Zero,
        attackStars: UPGRADE.Zero,
        defense: UPGRADE.Zero,
        attack: UPGRADE.Zero,
    },
    repairKits: 1,
    difficulty: DIFFICULTY.Medium,
    selectedCharacter: CHARACTER.DoWah,
};

/**
 * The password that was last generated.
 * @type {string}
 */
let Password = "";

/** @type {boolean} */
let ValidationMode = false;

/**
 * A list of hard-coded passwords contained within the ROM, and a short description of what they achieved when submitted
 * in game.
 * @type {Record<string,string>}
 */
const HARD_CODED_PASSWORDS = {
    IWTSOWN2: "spawns the player in Mechtropolis",
    TMTWN3PD: "spawns the player in Aquatica",
    IALTSMO4: "spawns the player in Arborea",
    IOTJOWN5: "spawns the player in Silicon City",
    FILGSOW6: "spawns the player in Magma",
    IWTSOWN7: "spawns the player in Koo Foo Ship",
    "2ELFMPLS":
        "gives the player two extra repair kits (according to <a href='https://gamefaqs.gamespot.com/gba/578723-butt-ugly-martians-bkm-battles/cheats' target='_blank'>this source</a>, but I couldn't get it to work, not sure what it does)",
    IAGAW4EL:
        "gives the player four extra repair kits (according to <a href='https://gamefaqs.gamespot.com/gba/578723-butt-ugly-martians-bkm-battles/cheats' target='_blank'>this source</a>, but I couldn't get it to work, not sure what it does)",
    GMACOEWU: "gives each character two extra attack upgrades",
    IAGAW4WU: "gives each character four extra attack upgrades",
    JT2DU4MP: "gives each character two extra defense upgrades",
    DUATOU4M: "gives each character four extra defense upgrades",
    ALWMAA15: "gives each character all attack and defense upgrades, as well as six repair kits",
    KMIORMAO:
        "gives the player unlimited repair kits (it will look like you've only received five, but that number won't go down if you use one)",
    LMBOTFLP: "spawns the player in the first level of the world",
    IIFHABLH: "spawns the player in the second level of the world",
    WPTBITWN: "spawns the player in the third level of the world",
    AALAALAL: "spawns the player in the fourth level of the world",
};

/**
 * Enables the generator panel, then disables the validator panel.
 * Also updates the password input based on the contents of the generator panel/form.
 */
function showGeneratorPanel() {
    GeneratorButton.classList.add("selected");
    ValidatorButton.classList.remove("selected");

    for (const element of GeneratorInputs) {
        element.disabled = false;
    }
    for (const element of ValidatorInputs) {
        element.disabled = true;
    }

    generateAndDisplayPassword();
    showGameStateForm();

    ValidationMode = false;
}

/**
 * Updates the game state form with the contents of DesiredGameState.
 */
function updateGameStateForm() {
    selectDesiredWorld(DesiredGameState.world);
    selectDesiredLevel(DesiredGameState.level);
    for (const character in HpCountInputs) {
        HpCountInputs[character].value = DesiredGameState[character].hp;
        HpCountLabels[character].innerText = DesiredGameState[character].hp;
    }
    for (const character in UpgradeInputs) {
        for (const upgrade in UpgradeInputs[character]) {
            UpgradeInputs[character][upgrade].value = DesiredGameState[character][upgrade];
            UpgradeLabels[character][upgrade].innerText = DesiredGameState[character][upgrade];
        }
    }
    RepairKitsInput.value = DesiredGameState.repairKits;
    RepairKitsCountLabel.innerText = DesiredGameState.repairKits;
    selectDesiredDifficulty(DesiredGameState.difficulty);
    selectDesiredCharacter(DesiredGameState.selectedCharacter);
    updateGemButtons();
}

/**
 * Show the game state form and hide the message box.
 * @param {GameState | undefined} bkm If given, it replaces DesiredGameState and updates the form accordingly.
 */
function showGameStateForm(bkm) {
    GameStateForm.style.setProperty("display", "flex");
    MessageBox.style.setProperty("display", "none");

    if (bkm) {
        DesiredGameState = bkm;
        updateGameStateForm();
    }
}

/**
 * Show the message box and hide the game state form.
 * @param {string} message The HTML to render inside the message box.
 */
function showMessageBox(message) {
    MessageBox.innerHTML = message;
    MessageBox.style.setProperty("display", "flex");
    GameStateForm.style.setProperty("display", "none");
}

/**
 * Enables the validator panel, then disables the generator panel.
 */
function showValidatorPanel() {
    ValidatorButton.classList.add("selected");
    GeneratorButton.classList.remove("selected");

    for (const element of ValidatorInputs) {
        element.disabled = false;
    }
    for (const element of GeneratorInputs) {
        element.disabled = true;
    }

    ValidationMode = true;
}

/**
 * Shows or hides the help text for the Generator panel.
 */
function toggleHelpText() {
    if (HelpText.style.getPropertyValue("display") === "flex") {
        HelpTitle.innerText = "How to Use ▼";
        HelpText.style.setProperty("display", "none");
    } else {
        HelpTitle.innerText = "How to Use ▲";
        HelpText.style.setProperty("display", "flex");
    }
}

/**
 * Select the world to encode into the password.
 * @param {World} world The desired world.
 */
function selectDesiredWorld(world) {
    world = Number(world);
    DesiredGameState.world = world;
    for (const [i, button] of Object.entries(WorldButtons)) {
        button.classList.toggle("selected", world === Number(i) + 1);
    }
    for (const [levelIndex, levelImage] of Object.entries(LevelButtonImages)) {
        levelImage.src = `/images/levels/${world}-${Number(levelIndex) + 1}.png`;
    }
}

/**
 * Select the world to encode into the password, and update the password.
 * @param {World} world The desired world.
 */
function selectDesiredWorldAndGeneratePassword(world) {
    selectDesiredWorld(world);
    generateAndDisplayPassword();
}

/**
 * Select the level to encode into the password.
 * @param {Level} level The desired level.
 */
function selectDesiredLevel(level) {
    level = Number(level);
    DesiredGameState.level = level;
    for (const [i, button] of Object.entries(LevelButtons)) {
        button.classList.toggle("selected", level === Number(i) + 1);
    }
}

/**
 * Select the level to encode into the password, and update the password.
 * @param {Level} level The desired level.
 */
function selectDesiredLevelAndGeneratePassword(level) {
    selectDesiredLevel(level);
    generateAndDisplayPassword();
}

/**
 * Update the selected styling of the gem buttons to reflect the values stored in DesiredGameState.
 */
function updateGemButtons() {
    for (const button of GemButtons) {
        button.classList.toggle("selected", DesiredGameState.gems[button.value]);
    }
}

/**
 * Toggle a single gem on or off.
 * @param {string} gemName The name of the gem to toggle on or off.
 */
function toggleGem(gemName) {
    DesiredGameState.gems[gemName] = !DesiredGameState.gems[gemName];
    updateGemButtons();
}

/**
 * Toggle a single gem on or off, and update the password.
 * @param {string} gemName The name of the gem to toggle on or off.
 */
function toggleGemAndGeneratePassword(gemName) {
    toggleGem(gemName);
    generateAndDisplayPassword();
}

/**
 * Updates a character's HP and regenerates the password.
 * @param {("red"|"blue"|"yellow")} character The color code of the character to update.
 * @param {number} hp The HP to assign to the character.
 */
function setCharacterHpAndGeneratePassword(character, hp) {
    DesiredGameState[character].hp = hp;
    HpCountLabels[character].innerText = hp;
    generateAndDisplayPassword();
}

/**
 * Updates a character's particular upgrade level.
 * @param {("red","blue","yellow")} character The color code of the character to update.
 * @param {("defenseStars"|"attackStars"|"defense"|"attack")} upgrade The type of upgrade to set.
 * @param {Upgrade} level The level to apply to the upgrade.
 */
function setCharacterUpgrade(character, upgrade, level) {
    level = Number(level);
    DesiredGameState[character][upgrade] = level;
    UpgradeLabels[character][upgrade].innerText = level;
}

/**
 * Updates a character's particular upgrade level, then regenerates the password.
 * @param {("red","blue","yellow")} character The color code of the character to update.
 * @param {("defenseStars"|"attackStars"|"defense"|"attack")} upgrade The type of upgrade to set.
 * @param {Upgrade} level The level to apply to the upgrade.
 */
function setCharacterUpgradeAndGeneratePassword(character, upgrade, level) {
    setCharacterUpgrade(character, upgrade, level);
    generateAndDisplayPassword();
}

/**
 * Offsets a single character's upgrades by a given value, then regenerates the password.
 * @param {string} character The character whose upgrades are being offset.
 * @param {number} offset The amount to offset upgrades by.
 */
function offsetCharacterUpgradesAndGeneratePassword(character, offset) {
    for (const upgrade of ["defenseStars", "attackStars", "defense", "attack"]) {
        let newLevel = DesiredGameState[character][upgrade] + offset;
        if (newLevel < UPGRADE.Zero) {
            newLevel = UPGRADE.Zero;
        } else if (newLevel > UPGRADE.Six) {
            newLevel = UPGRADE.Six;
        }
        setCharacterUpgrade(character, upgrade, newLevel);
        UpgradeInputs[character][upgrade].value = newLevel;
    }
    generateAndDisplayPassword();
}

/**
 * Set the given level to all upgrades across all characters, then regenerate the password.
 */
function setAllCharacterUpgradesAndGeneratePassword(level) {
    for (const character of ["red", "blue", "yellow"]) {
        for (const upgrade of ["defenseStars", "attackStars", "defense", "attack"]) {
            setCharacterUpgrade(character, upgrade, level);
            UpgradeInputs[character][upgrade].value = level;
        }
    }
    generateAndDisplayPassword();
}

/**
 * Select the number of collected repair kits, and update the password.
 * @param {number} count The number of repair kits to start the game with.
 */
function setRepairKitCountAndGeneratePassword(count) {
    DesiredGameState.repairKits = count;
    RepairKitsCountLabel.innerText = count;
    generateAndDisplayPassword();
}

/**
 * Select the desired difficulty.
 * @param {Difficulty} difficulty The desired difficulty.
 */
function selectDesiredDifficulty(difficulty) {
    DesiredGameState.difficulty = difficulty;
    for (const [i, button] of Object.entries(DifficultyButtons)) {
        button.classList.toggle("selected", difficulty == i);
    }
}

/**
 * Select the desired difficulty, and regenerate the password.
 * @param {Difficulty} difficulty The desired difficulty.
 */
function selectDesiredDifficultyAndGeneratePassword(difficulty) {
    selectDesiredDifficulty(difficulty);
    generateAndDisplayPassword();
}

/**
 * Select the character to start as.
 * @param {Character} character The character to start as.
 */
function selectDesiredCharacter(character) {
    character = Number(character);
    DesiredGameState.selectedCharacter = character;
    for (const [i, button] of Object.entries(CharacterButtons)) {
        button.classList.toggle("selected", character === Number(i));
    }
}

/**
 * Select the character to start as, and regenerate the password.
 * @param {Character} character The character to start as.
 */
function selectDesiredCharacterAndGeneratePassword(character) {
    selectDesiredCharacter(character);
    generateAndDisplayPassword();
}

/**
 * @returns {string} The current password in a user-friendly format.
 */
function userFriendlyPassword() {
    return Password.replaceAll(/(.{5})/g, "$1 ").trimEnd();
}

/**
 * Generates the equivalent password of DesiredGameState, and displays it to the user.
 */
function generateAndDisplayPassword() {
    Password = generatePassword(DesiredGameState);
    GeneratedPassword.value = userFriendlyPassword();
}

/**
 * Validates a given password, and either updates the game state form with the information encoded within the password,
 * or displays a message showing why the password could not be decoded.
 * @param {string} password The password to validate.
 */
function attemptToValidatePassword(password) {
    password = password.replaceAll(/\s/g, "");

    if (password in HARD_CODED_PASSWORDS) {
        showMessageBox(`
            <p>This is a <b>hard-coded</b> password that ${HARD_CODED_PASSWORDS[password]}.</p>
        `);
        return;
    }

    const bkm = validatePassword(password);
    if (bkm) {
        showGameStateForm(bkm);
    } else {
        showMessageBox("<p>This is an <b>invalid</b> password!</p>");
    }
}

/**
 * Copies the current password as seen on screen.
 */
function copyPasswordAsText() {
    if (ValidationMode) {
        navigator.clipboard.writeText(GeneratedPassword.value);
    } else {
        navigator.clipboard.writeText(userFriendlyPassword());
    }
}

/**
 * Copies the current password as a list of hexadecimal bytes.
 */
function copyPasswordAsHex() {
    const password = ValidationMode ? GeneratedPassword.value.replaceAll(/\s/g, "") : Password;
    const bytes = [...password].map((char) => char.charCodeAt(0).toString(16)).join("");
    navigator.clipboard.writeText(bytes);
}

// On document load, generate the password that stores the default game state.
updateGameStateForm();
showGeneratorPanel();
