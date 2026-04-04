/**
 * @file algorithms.js
 * Stores the reverse-engineered password algorithms found in the game's assembly code.
 * My philosophy with this code is "don't touch it if it's not broken." As a result, it's not well optimized at all. I
 * don't really care. In fairness, the assembly code isn't efficient either.
 */

/**
 * Stores every valid password character in the order that the same array is stored in memory in the GBA game.
 * @type {string[]}
 */
const ValidPasswordCharacters = [
    "*",
    "B",
    "C",
    "D",
    "F",
    "G",
    "H",
    "J",
    "K",
    "L",
    "M",
    "N",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
];

/**
 * Array of bytes hard-coded in the game's ROM.
 * Specifically, this array can be found at 0x083A7C31.
 * Some of its values are used during password calculations.
 * Not all of these values may be used; we could optimize this slightly by removing unnecessary values.
 * @type {number[]}
 */
const WORLD_BYTE_MAP = [
    0x00, 0x01, 0x02, 0xff, 0x03, 0xff, 0xff, 0xff, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
    0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x00, 0x01, 0x02, 0x00, 0x00, 0x01, 0x02, 0x03,
    0x00, 0x01, 0x02, 0x03, 0x00, 0x01, 0x02, 0x03, 0x00, 0x01, 0x02, 0x03, 0x00, 0x01, 0x02, 0x03, 0x00, 0x01, 0x02, 0x03,
    0x00, 0x00, 0x00, 0x01, 0x02, 0x02, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04, 0x04, 0x04, 0x04, 0x05, 0x05, 0x05, 0x05,
    0x06, 0x06, 0x06, 0x06, 0x07, 0x07, 0x07, 0x07, 0x00, 0x00, 0x00,
];

/**
 * Bytes used during password calculations.
 * This array can be found at 0x083A7C8C.
 * It is used to transform certain bytes within the password.
 * The array spells out "SNIPPY02" in ASCII.
 * @type {number[]}
 */
const SNIPPY02 = [0x53, 0x4e, 0x49, 0x50, 0x50, 0x59, 0x30, 0x32];

/**
 * Grab the index of the given character from the valid password characters table.
 * @param {string} char The character to find in the valid password characters table.
 * @returns {number} The 0-based index of the character in the table, or the length of the table if the character
 *          couldn't be found.
 */
function index(char) {
    const i = ValidPasswordCharacters.indexOf(char);
    if (i < 0) {
        return ValidPasswordCharacters.length;
    } else {
        return i;
    }
}

/**
 * @param {number} i The integer to bit shift left.
 * @param {number} l The bits to shift left by.
 * @returns {number} i << l, cast to an unsigned 32-bit integer.
 */
function left(i, l) {
    // https://stackoverflow.com/a/1908655.
    return (i << l) >>> 0;
}

/**
 * @param {number} i The integer to bit shift right.
 * @param {number} r The bits to arithmetic shift right by.
 * @returns {number} i >>> r.
 */
function right(i, r) {
    return i >>> r;
}

/**
 * Shift an integer left then right.
 * @param {number} i The integer to bit shift.
 * @param {number} l Firstly, shift left by this value.
 * @param {number} r Secondly, shift right by this value.
 * @returns {number} The shifted value.
 */
function shift(i, l, r) {
    return right(left(i, l), r);
}

/**
 * Shift an integer right then left.
 * @param {number} i The integer to bit shift.
 * @param {number} r Firstly, shift right by this value.
 * @param {number} l Secondly, shift left by this value.
 * @returns {number} The shifted value.
 */
function reverseShift(i, r, l) {
    return left(right(i, r), l);
}

/**
 * Used to read e.g. two bytes as a half word, or four bytes as a word, from a byte array.
 * @param {number[]} byteArray Array of numbers, each ranging in value from 0x00 to 0xff.
 * @param {number} at The 0-based index of the array to start reading bytes from.
 * @param {number} len The number of bytes to read.
 * @returns {number} The bytes combined into a single number.
 */
function readBytes(byteArray, at, len) {
    let total = 0;
    for (let i = 0; i < len; ++i) {
        total += byteArray.at(at + i) << (8 * i);
    }
    return total;
}

/**
 * Used to write e.g. a half word or a word into a byte array.
 * @param {number[]} byteArray Array of numbers, each ranging in value from 0x00 to 0xff.
 * @param {number} at The 0-based index of the array to start writing bytes to.
 * @param {number} len The numbers of bytes to write.
 * @param {number} value The number to write, a byte at a time.
 */
function writeBytes(byteArray, at, len, value) {
    for (let i = 0; i < len; ++i) {
        byteArray[at + i] = value & 0xff;
        value = right(value, 8);
    }
}

/**
 * Generator function used to iterate through the bytes of three words.
 * Would ideally like to get rid of this function but it serves its purpose I guess.
 * @param {number[]} words Array of three words storing an intermediate password computation result.
 */
function* forEachByteInWords(words) {
    for (const [wordIndex, word] of Object.entries(words)) {
        for (let i = 0; i < 4; ++i) {
            yield [wordIndex * 4 + i, right(word, 8 * i)];
        }
    }
}

/**
 * Implementation of the function at 0x08025838.
 * @param {number[]} words Array of three words storing an intermediate password computation result.
 * @returns {number} The result of the "totaling" calculation.
 */
function passwordTotalFunc(words) {
    let total = 0;
    let tenthByte;
    for (const [byteIndex, byte] of forEachByteInWords(words)) {
        if (byteIndex >= 9) {
            tenthByte = byte & 0xff;
            break;
        }
        total += byte & 0xff;
    }
    return shift((tenthByte & 0xe0) + total, 10, 10) & 0x7f;
}

/**
 * Validates a 15 character password.
 * Hard-coded/cheat passwords will be reported as not valid by this function.
 * @param {string} password The password to validate, without whitespace.
 * @returns {GameState | undefined} A GameState object if the password was valid, which describes the state that the
 *          game would be in should the password be submitted. Undefined otherwise.
 */
function validatePassword(password) {
    const applyPasswordIndicesToWord = (w, start, end) => {
        for (let i = start; i < end; ++i) {
            w = left(w, 5) | shift(index(password.at(i)), 10, 10);
        }
        return w;
    };

    // Function @ 0x08025730.
    const indexOfFirst = shift(index(password.at(0)), 16, 11);
    const indexOfSecond = shift(index(password.at(1)), 10, 10);
    let firstWord = indexOfFirst | indexOfSecond;
    firstWord = applyPasswordIndicesToWord(firstWord, 2, 6);
    const indexOfSeventh = shift(index(password.at(6)), 10, 10);
    firstWord = left(firstWord, 2) | right(indexOfSeventh, 3);

    let secondWord = applyPasswordIndicesToWord(indexOfSeventh, 7, 12);
    const indexOfThirteenth = shift(index(password.at(12)), 10, 10);
    secondWord = left(secondWord, 4) | right(indexOfThirteenth, 1);

    const thirdWord = left(applyPasswordIndicesToWord(indexOfThirteenth, 13, 15), 21);

    // Function @ 0x08025838.
    let hashResult = passwordTotalFunc([firstWord, secondWord, thirdWord]);

    // Function @ 0x080255fc.
    const newBytes = [];
    for (const [byteIndex, byte] of forEachByteInWords([firstWord, secondWord, thirdWord])) {
        if (byteIndex < SNIPPY02.length) {
            newBytes.push((byte & 0xff) ^ SNIPPY02.at(byteIndex));
        } else {
            newBytes.push(byte & 0xff);
        }
    }

    // Continuing from 0x0802542a.
    hashResult = shift(hashResult, 24, 24);
    if (right(newBytes.at(-1), 1) != hashResult) {
        return;
    }

    // Continuing from 0x0802543a.
    /** @type {GameState} */
    const bkm = {};

    const shiftedThirdByte = shift(newBytes.at(2), 0x19, 0x1b);
    bkm.world = WORLD_BYTE_MAP.at(shiftedThirdByte + 28 + 32);
    bkm.level = WORLD_BYTE_MAP.at(shiftedThirdByte + 32);
    const byteForWorldLevelValidation = WORLD_BYTE_MAP.at(bkm.level + shift(bkm.world, 16, 14));
    if (shiftedThirdByte !== byteForWorldLevelValidation) {
        return;
    }

    firstWord = readBytes(newBytes, 0, 4);
    secondWord = readBytes(newBytes, 4, 4);
    fifthSixth = readBytes(newBytes, 4, 2);
    thirdFourth = readBytes(newBytes, 2, 2);
    eleventhTwelfth = readBytes(newBytes, 10, 2);

    const gemFlags = shift(newBytes.at(7), 27, 27) & 0xff;
    bkm.gems = {
        red: Boolean(gemFlags & GEM.Red),
        cyan: Boolean(gemFlags & GEM.Cyan),
        green: Boolean(gemFlags & GEM.Green),
        pink: Boolean(gemFlags & GEM.Pink),
        orange: Boolean(gemFlags & GEM.Orange),
    };

    bkm.red = {};
    bkm.blue = {};
    bkm.yellow = {};

    bkm.red.hp = reverseShift(newBytes.at(0), 3, 3) & 0xff;

    bkm.blue.hp = left(newBytes.at(1), 3) & 0xff;

    bkm.yellow.hp = left(shift(firstWord, 14, 27), 3) & 0xff;

    bkm.red.defenseStars = shift(secondWord, 14, 29) & 0xff;

    bkm.blue.defenseStars = shift(newBytes.at(6), 27, 29) & 0xff;

    bkm.yellow.defenseStars = shift(newBytes.at(6), 24, 29) & 0xff;

    bkm.red.attackStars = shift(fifthSixth, 23, 29) & 0xff;

    bkm.blue.attackStars = shift(newBytes.at(5), 28, 29) & 0xff;

    bkm.yellow.attackStars = shift(newBytes.at(5), 25, 29) & 0xff;

    if (
        bkm.red.defenseStars > 6 ||
        bkm.blue.defenseStars > 6 ||
        bkm.yellow.defenseStars > 6 ||
        bkm.red.attackStars > 6 ||
        bkm.blue.attackStars > 6 ||
        bkm.yellow.attackStars > 6
    ) {
        return;
    }

    bkm.repairKits = shift(newBytes.at(7), 24, 29) & 0xff;

    if (left(bkm.repairKits, 24) > left(224, 19)) {
        return;
    }

    bkm.red.defense = right(newBytes.at(3), 5) & 0xff;

    bkm.blue.defense = shift(newBytes.at(4), 29, 29) & 0xff;

    bkm.yellow.defense = shift(newBytes.at(4), 26, 29) & 0xff;

    bkm.red.attack = shift(newBytes.at(0), 29, 29) & 0xff;

    bkm.blue.attack = shift(thirdFourth, 22, 29) & 0xff;

    bkm.yellow.attack = shift(newBytes.at(3), 27, 29) & 0xff;

    if (
        bkm.red.defense > 6 ||
        bkm.blue.defense > 6 ||
        bkm.yellow.defense > 6 ||
        bkm.red.attack > 6 ||
        bkm.blue.attack > 6 ||
        bkm.yellow.attack > 6
    ) {
        return;
    }

    bkm.difficulty = shift(newBytes.at(10), 25, 30);

    if (bkm.difficulty > 2) {
        return;
    }

    bkm.selectedCharacter = shift(eleventhTwelfth, 23, 30);

    if (bkm.selectedCharacter > 2) {
        return;
    }

    // Adjust the world and level values to be 1-based.
    if (bkm.world === 1) {
        // Special case for 1-4 where the world ID is already set to 1.
        // Level is set to 0 though, so we'll need to overwrite it.
        // Interestingly, it is also the only case of the world ID being 1,
        // as world 2 uses an ID of 2, world 3 uses 3, and so on.
        bkm.level = 4;
    } else {
        if (bkm.world === 0) {
            // Levels 1-1, 1-2 and 1-3 have a world ID of 0, increment it to be
            // 1-based. Due to the 1-4 quirk, though, we can treat all other
            // world IDs as being 1-based already.
            bkm.world += 1;
        }
        // Besides 1-4, we can treat level IDs as being 0-based.
        bkm.level += 1;
    }

    // Divide the HP values by 8. Passwords do not store HP to the same degree of accuracy that the game itself does.
    // E.g. if the HP is 239 instead of the full 240, the game will round up when the generated password is fed into the
    // game. And if the HP is 230, the game will round up to 232 when the password is loaded.
    bkm.red.hp = Math.ceil(bkm.red.hp / 8);
    bkm.blue.hp = Math.ceil(bkm.blue.hp / 8);
    bkm.yellow.hp = Math.ceil(bkm.yellow.hp / 8);

    return bkm;
}

/**
 * Hashes a GameState object into a password.
 * @param {GameState} bkm The game state to hash into a password.
 * @returns {string} The 15 character password, without any whitespace.
 */
function generatePassword(bkm) {
    // Before doing anything else, convert the world and level IDs into values
    // that the password system expects.
    let { world, level } = bkm;
    if (world === 1 && level === 4) {
        level = 1;
    } else if (bkm.world === 1) {
        world = 0;
    }
    level -= 1;

    // Do the same for gems.
    let gems = 0;
    if (bkm.gems.red) {
        gems |= GEM.Red;
    }
    if (bkm.gems.cyan) {
        gems |= GEM.Cyan;
    }
    if (bkm.gems.green) {
        gems |= GEM.Green;
    }
    if (bkm.gems.pink) {
        gems |= GEM.Pink;
    }
    if (bkm.gems.orange) {
        gems |= GEM.Orange;
    }

    // ...and HP.
    let redHp = bkm.red.hp * 8;
    let blueHp = bkm.blue.hp * 8;
    let yellowHp = bkm.yellow.hp * 8;

    // 0x03003098.
    const hash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    world = left(shift(world, 16, 16), 2);
    level = shift(level, 16, 16) + world;
    let worldByte = left(WORLD_BYTE_MAP[level] & 0x1f, 2);
    worldByte |= 0xffffff83 & hash[2];
    hash[2] = worldByte & 0xff;

    // Why does the assembly do this twice?
    gems = gems & 0x1f & 0x1f;
    const hash7 = hash[7];
    gems |= 0xffffffe0 & hash7;
    hash[7] = gems & 0xff;

    redHp = reverseShift(redHp + 7, 3, 3);
    redHp |= 7 & hash[7];
    hash[0] = redHp & 0xff;

    blueHp = right(blueHp + 7, 3) & 0x1f;
    blueHp |= 0xffffffe0 & hash[1];
    hash[1] = blueHp & 0xff;

    yellowHp = left(right(yellowHp + 7, 3) & 0x1f, 13);
    yellowHp |= 0xfffc1fff & readBytes(hash, 0, 4);
    writeBytes(hash, 0, 4, yellowHp);

    let redDefenseStars = left(bkm.red.defenseStars & 7, 15);
    redDefenseStars |= 0xfffc7fff & readBytes(hash, 4, 4);
    writeBytes(hash, 4, 4, redDefenseStars);

    let blueDefenseStars = left(bkm.blue.defenseStars & 7, 2);
    blueDefenseStars |= 0xffffffe3 & hash[6];
    blueDefenseStars &= 0x1f;

    let yellowDefenseStars = left(bkm.yellow.defenseStars, 5);
    blueDefenseStars |= yellowDefenseStars;
    hash[6] = blueDefenseStars & 0xff;

    let redAttackStars = left(bkm.red.attackStars & 7, 6);
    redAttackStars |= 0xfffffe3f & readBytes(hash, 4, 2);
    writeBytes(hash, 4, 2, redAttackStars);

    let blueAttackStars = left(bkm.blue.attackStars & 7, 1);
    blueAttackStars |= 0xfffffff1 & hash[5];
    blueAttackStars &= 0xffffff8f;

    let yellowAttackStars = left(bkm.yellow.attackStars & 7, 4);
    blueAttackStars |= yellowAttackStars;
    hash[5] = blueAttackStars & 0xff;

    let repairKits = shift(bkm.repairKits, 24, 19);
    repairKits |= 0x1f & hash[7];
    hash[7] = repairKits & 0xff;

    let redDefenseUpgrades = left(bkm.red.defense, 5);
    redDefenseUpgrades |= 0x1f & hash[3];
    hash[3] = redDefenseUpgrades & 0xff;

    let blueDefenseUpgrades = bkm.blue.defense & 7;
    blueDefenseUpgrades |= 0xfffffff8 & hash[4];
    blueDefenseUpgrades &= 0xffffffc7;

    let yellowDefenseUpgrades = left(bkm.yellow.defense & 7, 3);
    blueDefenseUpgrades |= yellowDefenseUpgrades;
    hash[4] = blueDefenseUpgrades & 0xff;

    let redAttackUpgrades = bkm.red.attack & 7;
    redAttackUpgrades |= 0xfffffff8 & hash[0];
    hash[0] = redAttackUpgrades & 0xff;

    let blueAttackUpgrades = left(bkm.blue.attack & 7, 7);
    blueAttackUpgrades |= 0xfffffc7f & readBytes(hash, 2, 2);
    writeBytes(hash, 2, 2, blueAttackUpgrades);

    let yellowAttackUpgrades = left(bkm.yellow.attack & 7, 2);
    yellowAttackUpgrades |= 0xffffffe3 & hash[3];
    hash[3] = yellowAttackUpgrades & 0xff;

    let selectedCharacter = left(bkm.selectedCharacter & 3, 7);
    selectedCharacter |= 0xfffffe7f & readBytes(hash, 10, 2);
    writeBytes(hash, 10, 2, selectedCharacter);

    let difficulty = left(bkm.difficulty & 3, 5);
    difficulty |= 0xffffff9f & hash[10];
    hash[10] = difficulty & 0xff;

    for (let s = 0; s < SNIPPY02.length; ++s) {
        hash[s] ^= SNIPPY02[s];
    }

    let total = passwordTotalFunc([readBytes(hash, 0, 4), readBytes(hash, 4, 4), readBytes(hash, 8, 4)]);
    total = shift(total, 24, 23);
    total |= 1 & hash[11];
    hash[11] = total & 0xff;

    let password = "";

    let firstWord = readBytes(hash, 0, 4);
    for (let a = 0; a < 6; ++a) {
        password += ValidPasswordCharacters.at(right(firstWord, 27));
        firstWord = left(firstWord, 5);
    }

    let secondWord = readBytes(hash, 4, 4);
    firstWord = right(firstWord, 27) | right(secondWord, 29);
    password += ValidPasswordCharacters.at(firstWord);
    secondWord = left(secondWord, 3);

    for (let a = 0; a < 5; ++a) {
        password += ValidPasswordCharacters.at(right(secondWord, 27));
        secondWord = left(secondWord, 5);
    }

    let thirdWord = right(readBytes(hash, 8, 4), 4);
    secondWord |= thirdWord;

    for (let a = 0; a < 2; ++a) {
        password += ValidPasswordCharacters.at(right(secondWord, 27));
        secondWord = left(secondWord, 5);
    }

    password += ValidPasswordCharacters.at(right(secondWord, 27));

    return password;
}
