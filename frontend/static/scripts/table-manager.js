const LIVE_SELECTED = {
    "PS1": true,
    "PS3": true,
    "PS4": true,
}

const TABLE_MANAGER = (function() {
    const tableData = {
        liveGarageTableData: {
            "PS1": [],
            "PS3": [],
            "PS4": []
        },
        liveTableTime: "",
    };

    /**
     * @name tableDataSetup
     * Grab current live data and table time and store it in tableData.
    */
    (function() {
        tableData.liveTableTime = document.getElementById("PS1-time-text").textContent;
        ["PS1", "PS3", "PS4"].forEach((garageName) => {

            const parentElems = [...document.getElementsByClassName(`${garageName}-space`)];
            parentElems.forEach((parentElem) => {
                tableData.liveGarageTableData[garageName].push(parentElem.childNodes[0].textContent);
            });
        });
    })();

    /**
     * Updates tableData with the new current spaces values.
     * Animates the live changes on their respective charts if they're currently displaying live data.
     * @param {Object} newData - the newest spaces dataset for each garage.
     * @param {string} updateTime - the update time for the new spaces dataset.
    */
    function updateTableData(newData, updateTime) {
        tableData.liveTableTime = updateTime;

        ["PS1", "PS3", "PS4"].forEach((garageName) => {
            tableData.liveGarageTableData[garageName] = newData[garageName];

            if (LIVE_SELECTED[garageName]) {
                animateLiveTableUpdate(newData[garageName], garageName);
                updateTableTime(tableData.liveTableTime, true, garageName);
            }
        });
    }

    /**
     * Displays the current spaces values in the table while also displaying a green up arrow or red down arrow for
     * an increase or decrease (respectively) in available spaces from the last live update.
     * @param {array} dataset - the spaces dataset containing the information to be displayed.
     * @param {string} garageName - the name of the garage to animate the table change for.
    */
    function animateLiveTableUpdate(dataset, garageName) {
        const parentElems = [...document.getElementsByClassName(`${garageName}-space`)];

        for (let idx = 0; idx < parentElems.length; ++idx) {
            const currentSpacesElem = parentElems[idx].childNodes[0];
            const currentSpacesData = Number(currentSpacesElem.textContent)
            const newSpacesData = dataset[idx];
            const arrowElem = parentElems[idx].childNodes[1];

            if (newSpacesData > currentSpacesData) {
                toggleArrowAnimation(true, arrowElem);
            }
            else if (newSpacesData < currentSpacesData) {
                toggleArrowAnimation(false, arrowElem);
            }
            currentSpacesElem.textContent = newSpacesData;
        }
    }

    /**
     * Animates a fade-in-fade-out transition of an up arrow or down arrow for a given arrow element.
     * @param {boolean} isIncrease - true for an up arrow animation, false for a down arrow animation.
     * @param {string} arrowElem - the arrow element to animate.
    */
    function toggleArrowAnimation(isIncrease, arrowElem) {
        arrowElem.style.animation = "";
        arrowElem.offsetHeight;

        if (isIncrease) {
            arrowElem.classList.remove("fa-angles-down");
            arrowElem.classList.add("fa-angles-up");
            arrowElem.style.color = "green";
        } 
        else {
            arrowElem.classList.remove("fa-angles-up");
            arrowElem.classList.add("fa-angles-down");
            arrowElem.style.color = "red";
        }

        arrowElem.style.animation = "arrow-animation 5s";
    }

    /**
     * Displays the spaces values in a table for a given garage while also displaying a green up arrow or red down arrow for
     * an increase or decrease (respectively) in available spaces from the previously recorded timestamp.
     * @param {array} dataset - contains the dataset of available spaces for a given past time with each datapoint
     * containing the number of available spaces and whether it increased, decreased, or stayed the same from the previously
     * recorded timestamp.
     * @param {string} datasetTime - the time the dataset was recorded.
     * @param {string} garageName - the name of the garage to animate the table change for.
    */
    function animateHistoryTableUpdate(dataset, datasetTime, garageName) {
        const parentElems = [...document.getElementsByClassName(`${garageName}-space`)];
        const formattedDatasetTime = datasetTime.split(" ").join(":00 ");
        updateTableTime(formattedDatasetTime, false, garageName);

        for (let idx = 0; idx < dataset.length; ++idx) {
            const currentSpacesElem = parentElems[idx].childNodes[0]
            const arrowElem = parentElems[idx].childNodes[1];
            const newSpacesData = dataset[idx][0];
            const change = dataset[idx][1]

            currentSpacesElem.textContent = newSpacesData;
            arrowElem.style = "";
            if (change === "increase") {
                arrowElem.classList.remove("fa-angles-down", "fa-grip-lines");
                arrowElem.offsetHeight;
                arrowElem.classList = ["fa-solid fa-angles-up icon-arrow-increase-history"];
            }
            else if (change === "decrease") {
                arrowElem.classList.remove("fa-angles-up", "fa-grip-lines");
                arrowElem.offsetHeight;
                arrowElem.classList = ["fa-solid fa-angles-down icon-arrow-decrease-history"];
            } 
            else if (change === "same") {
                arrowElem.classList.remove("fa-angles-up", "fa-angles-down");
                arrowElem.offsetHeight;
                arrowElem.classList = ["fa-solid fa-grip-lines icon-no-change icon-arrow"];
            }
            else {
                arrowElem.classList = ["fa-solid fa-angles-up icon-arrow"];
            }
        }
    }

    /**
     * Updates the table time string and table time icon.
     * @param {string} updateTimeString - the string used for replacing the update time.
     * @param {boolean} playAnimation - animates the update with a fade-in transition if true,
     * if false, no animation plays on update.
     * @param {string} garageName - the name of the garage to change the update time for.
    */
    function updateTableTime(updateTimeString, playAnimation, garageName) {
        const tableTimeText  = document.getElementById(`${garageName}-time-text`);
        const tableTimeIcon  = document.getElementById(`${garageName}-time-icon`);

        const tableTimeIconClassList = [...tableTimeIcon.classList];
        if (LIVE_SELECTED[garageName]) {
            if (!tableTimeIconClassList.includes("table-time-live-icon")) {
                tableTimeIcon.classList = ["fa-solid table-time-live-icon fa-rotate fa-spin"];
            }
        }
        else {
            if (!tableTimeIconClassList.includes("table-time-history-icon")) {
                tableTimeIcon.classList = ["fa-solid fa-clock-rotate-left table-time-history-icon"];
            }
        }

        if (!playAnimation) {
            tableTimeText.textContent = updateTimeString;
        }
        else {
            tableTimeText.style.animation = "";
            tableTimeText.offsetHeight;
            tableTimeText.textContent = updateTimeString;
            tableTimeText.style.animation = "text-fadein 1s";
        }
    }

    /**
     * Updates a table with its live spaces values and toggles the live spin wheel if the live data is currently being viewed for that chart.
     * Updates a table with "-" characters as space values and toggles the past time icon if a day that is not the current day is selected.
     * @param {string} garageName - the name of the garage to switch the table for.
    */
    function switchTable(garageName) {
        const parentElems = [...document.getElementsByClassName(`${garageName}-space`)];

        if (LIVE_SELECTED[garageName]) {
            updateTableTime(tableData.liveTableTime, false, garageName);
        }
        else {
            updateTableTime("(Pick a Time)", false, garageName);
        }

        for (let idx = 0; idx < parentElems.length; ++idx) {
            const spaceDataElem = parentElems[idx].childNodes[0]
            const arrowElem = parentElems[idx].childNodes[1];

            if (LIVE_SELECTED[garageName]) {
                spaceDataElem.textContent = tableData.liveGarageTableData[garageName][idx];
                arrowElem.classList = ["fa-solid fa-angles-up icon-arrow"];
            }
            else {
                spaceDataElem.textContent = "-";
                arrowElem.classList = ["fa-solid fa-angles-up icon-arrow"];
                arrowElem.style.animation = "";
            }
        }
    }

    /**
     * Hides or unhides the spaces data for a given dataset row.
     * @param {number} datasetIndex - the index of the table row data to hide.
     * @param {boolean} makeHidden - true to hide the row, false to unhide it.
     * @param {string} garageName - the name of the garage to hide the table row data for.
    */
    function hideTableRow(datasetIndex, makeHidden, garageName) {
        const parentElem = document.getElementsByClassName(`${garageName}-space`)[datasetIndex];

        if (makeHidden) {
            parentElem.classList.add("hide-element");
        }
        else {
            parentElem.classList.remove("hide-element");
        }
    }

    return {
        updateTableData: updateTableData,
        animateHistoryTableUpdate: animateHistoryTableUpdate,
        switchTable: switchTable,
        hideTableRow: hideTableRow
    }
})();