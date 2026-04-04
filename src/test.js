/**
 * @file test.js
 * Documents known password <-> game state mappings that we can test the algorithms against.
 * A lot more should be written in the future.
 */

const KNOWN_PASSWORD_MAPPINGS = Object.freeze({
    // MARK: Valid
    MBJLBLLWHBPZQWH: {
        world: 1,
        level: 2,
        gems: {
            red: false,
            cyan: false,
            green: false,
            pink: false,
            orange: false,
        },
        red: {
            hp: 30,
            defenseStars: 0,
            attackStars: 0,
            defense: 0,
            attack: 6,
        },
        blue: {
            hp: 30,
            defenseStars: 0,
            attackStars: 0,
            defense: 6,
            attack: 0,
        },
        yellow: {
            hp: 30,
            defenseStars: 0,
            attackStars: 0,
            defense: 0,
            attack: 0,
        },
        repairKits: 0,
        difficulty: 2,
        selectedCharacter: 1,
    },
    MBJSJSLWHBPZBP0: {
        world: 1,
        level: 2,
        gems: {
            red: false,
            cyan: false,
            green: false,
            pink: false,
            orange: false,
        },
        red: {
            hp: 29,
            defenseStars: 0,
            attackStars: 0,
            defense: 0,
            attack: 6,
        },
        blue: {
            hp: 29,
            defenseStars: 0,
            attackStars: 0,
            defense: 0,
            attack: 0,
        },
        yellow: {
            hp: 29,
            defenseStars: 0,
            attackStars: 0,
            defense: 0,
            attack: 0,
        },
        repairKits: 0,
        difficulty: 2,
        selectedCharacter: 1,
    },
    "***************": {
        world: 5,
        level: 3,
        gems: {
            red: false,
            cyan: true,
            green: false,
            pink: false,
            orange: true,
        },
        red: {
            hp: 10,
            defenseStars: 0,
            attackStars: 5,
            defense: 2,
            attack: 3,
        },
        blue: {
            hp: 14,
            defenseStars: 4,
            attackStars: 4,
            defense: 0,
            attack: 0,
        },
        yellow: {
            hp: 10,
            defenseStars: 1,
            attackStars: 5,
            defense: 2,
            attack: 4,
        },
        repairKits: 1,
        difficulty: 0,
        selectedCharacter: 0,
    },
    // MARK: Invalid
    "*VKK3I*YPPIA1BB": undefined,
});

function testAlgorithms() {
    for (const [password, bkm] of Object.entries(KNOWN_PASSWORD_MAPPINGS)) {
        const validation = validatePassword(password);
        console.assert(
            JSON.stringify(validation) === JSON.stringify(bkm),
            `${password} does not pass validation, expected A but got B`,
            bkm,
            validation,
        );

        if (bkm) {
            const generation = generatePassword(bkm);
            console.assert(
                generation === password,
                `Game state generated password ${generation}, expected ${password}`,
                bkm,
            );
        }
    }
}
