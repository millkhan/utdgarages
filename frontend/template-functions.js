const PERMIT_CONFIG = {
    green: {
        class: "parking-green",
        text: "Green<br>Permit"
    },
    gold: {
        class: "parking-gold",
        text: "Gold<br>Permit"
    },
    orange: {
        class: "parking-orange",
        text: "Orange<br>Permit"
    },
    purple: {
        class: "parking-purple",
        text: "Purple<br>Permit"
    },
    pay: {
        class: "parking-pay",
        text: "Pay-<br>By-<br>Space"
    }
}

const GARAGES_LAYOUT_CONFIG = {
    "PS1": [{level: "5", config: PERMIT_CONFIG.green}, 
            {level: "4", config: PERMIT_CONFIG.gold}, 
            {level: "3", config: PERMIT_CONFIG.gold}, 
            {level: "3", config: PERMIT_CONFIG.orange}, 
            {level: "2", config: PERMIT_CONFIG.orange}, 
            {level: "2", config: PERMIT_CONFIG.purple}, 
            {level: "1", config: PERMIT_CONFIG.pay}],

    "PS3": [{level: "5", config: PERMIT_CONFIG.green}, 
            {level: "4", config: PERMIT_CONFIG.gold}, 
            {level: "3", config: PERMIT_CONFIG.gold}, 
            {level: "3", config: PERMIT_CONFIG.orange}, 
            {level: "2", config: PERMIT_CONFIG.orange}, 
            {level: "1", config: PERMIT_CONFIG.purple}, 
            {level: "1", config: PERMIT_CONFIG.pay}],

    "PS4": [{level: "5", config: PERMIT_CONFIG.green}, 
            {level: "4", config: PERMIT_CONFIG.gold}, 
            {level: "3", config: PERMIT_CONFIG.gold}, 
            {level: "2", config: PERMIT_CONFIG.orange}, 
            {level: "2", config: PERMIT_CONFIG.purple}, 
            {level: "2", config: PERMIT_CONFIG.purple}, 
            {level: "1", config: PERMIT_CONFIG.pay}],
}

/**
 * Returns the matching level text string for a given garage floor row.
 * @param {number} rowIdx - table row to grab level text for.
 * @param {string} garageName - name of the garage to grab level text for.
 * @returns {string} garage table level.
*/
let setLevelText = function(rowIdx, garageName) {
    return GARAGES_LAYOUT_CONFIG[garageName][rowIdx].level;
};

/**
 * Returns the matching level parking class string for a given garage floor row.
 * @param {number} rowIdx - table row to grab parking class for.
 * @param {string} garageName - name of the garage to grab parking class for.
 * @returns {string} garage parking class.
*/
let setParkingClass = function(rowIdx, garageName) {
    return GARAGES_LAYOUT_CONFIG[garageName][rowIdx].config.class;
};

/**
 * Returns the matching permit text string for a given garage floor row.
 * @param {number} rowIdx - table row to grab permit text for.
 * @param {string} garageName - name of the garage to grab permit text for.
 * @returns {string} garage permit text.
*/
let setPermitText = function(rowIdx, garageName) {
    return GARAGES_LAYOUT_CONFIG[garageName][rowIdx].config.text;
};

module.exports = {
    setLevelText,
    setParkingClass,
    setPermitText,
};