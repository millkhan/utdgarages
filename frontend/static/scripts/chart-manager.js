const CHART_MANAGER = (function() {
    Chart.defaults.font.family = "Roboto Mono";

    const chartData = {
        garageChartObjects: {},
        garageChartDatasets: [],
    };

    const longestLabel = {
        "PS1": 0,
        "PS3": 0,
        "PS4": 0,
    };

    const indexSelected = {
        "PS1": -1,
        "PS3": -1,
        "PS4": -1,
    };

    const resetTimers = {
        "PS1": null,
        "PS3": null,
        "PS4": null,
    };

    const CHART_LABELS = ["12:00 am", "1:00 am", "2:00 am", "3:00 am", "4:00 am", "5:00 am", "6:00 am", "7:00 am", 
                         "8:00 am", "9:00 am", "10:00 am", "11:00 am", "12:00 pm", "1:00 pm","2:00 pm", "3:00 pm", 
                         "4:00 pm", "5:00 pm", "6:00 pm", "7:00 pm", "8:00 pm", "9:00 pm", "10:00 pm", "11:00 pm"];

    const CHART_DATA_CONFIG = {
        chartDataTemplate: {
            "PS1": ["L5 Green ", 
                    "L4 Gold  ", 
                    "L3 Gold  ", 
                    "L3 Orange", 
                    "L2 Orange", 
                    "L2 Purple", 
                    "L1 Pay   "], 
            "PS3": ["L5 Green ", 
                    "L4 Gold  ", 
                    "L3 Gold  ", 
                    "L3 Orange", 
                    "L2 Orange", 
                    "L1 Purple", 
                    "L1 Pay   "], 
            "PS4": ["L5 Green ", 
                    "L4 Gold  ", 
                    "L3 Gold  ", 
                    "L2 Orange", 
                    "L2 Purple", 
                    "L1 Purple", 
                    "L1 Pay   "]
        },
        chartColors: {
                Green:  "#005710",
                Gold:   "#ffdd00",
                Orange: "#e59900",
                Purple: "#773dbc",
                Pay:    "#63636e",
        }
    }

    const chartOptions = {
        animation: false,
        maintainAspectRatio: false,
        clip: false,
        datasets: {
            normalized: true,
            parsing: false,
            line: {
                pointHitRadius: 10,
            }
        },
        scales: {
            x: {
                labels: CHART_LABELS,
                title: {
                    display: true,
                    text: "Time",
                }
            },
            y: {
                min: 0,
                title: {
                    display: true,
                    text: "Available Spaces",
                },
                ticks: {
                    precision: 0,
                }
            }
        },
        interaction: {
            mode: "nearestGroup",
        },
        plugins: {
            legend: {
                display: false,
                position: "bottom",
            },
        }
    };

    /**
     * Creates and displays interactive charts for the current day while configuring all weekday buttons.
     * @param {Object} chartDatasets - chart spaces data containing datasets for each day in the week.
    */
    function setupCharts(chartDatasets) {
        chartData.garageChartDatasets = chartDatasets;

        for (const [garageName, garageDataset] of Object.entries(chartData.garageChartDatasets[chartData.garageChartDatasets.length - 1])) {
            const ctx = document.getElementById(`${garageName}-chart`);
            const formattedChart = formatChart(garageDataset, garageName)

            chartData.garageChartObjects[garageName] = new Chart(ctx, formattedChart);
            setTimeout(() => {
                chartData.garageChartObjects[garageName].options.plugins.legend.display = true;
                chartData.garageChartObjects[garageName].update();
            }, 250);
        }

        setupChartOutOfBoundListeners();
        setupChartButtons();
    }

    /**
     * Returns a formatted chart object that's ready to be used with chart.js.
     * @param {array} datasets - datasets to be used for the chart.
     * @param {string} garageName - name of the garage for format template.
     * @returns {Chart} formatted chart object.
    */
     function formatChart(datasets, garageName) {
        let garageDatasets = [];

        for (let idx = 0; idx < datasets.length; ++idx) {
            const rowLabel = CHART_DATA_CONFIG.chartDataTemplate[garageName][idx];
            const permitType = rowLabel.split(" ")[1];
            const permitColor = CHART_DATA_CONFIG.chartColors[permitType];
            const borderColor = `${permitColor}c0`;
            const backgroundColor = `${permitColor}70`;


            garageDatasets.push({label:           rowLabel,
                                 data:            datasets[idx].slice(),
                                 borderColor:     borderColor,
                                 backgroundColor: backgroundColor});
        }

        const optionsClone = structuredClone(chartOptions);

        optionsClone.plugins.title = {
            text: garageName,
            display: false
        };
        optionsClone.plugins.tooltip = {
            callbacks: {
                label: customTooltipLabelGenerator
            }
        };
        optionsClone.plugins.legend.onClick = customLegendClickHandler;

        return ({
            type: "line",
            data: {datasets: garageDatasets}, 
            options: optionsClone
        });
    }

    /**
     * Selects nearest group (from mouse input) of datapoints that originate from the same index. 
     * Additonally, handles resetting the table back to displaying live data.
     * @function Interaction.modes.nearestGroup
     * @param {Chart} chart - the chart we are returning items from.
     * @param {Event} e - the event type fired from user input.
     * @param {InteractionOptions} options - options to use.
     * @param {boolean} useFinalPosition - use final element position (animation target).
     * @return {InteractionItem[]} items that are found.
     */
     Chart.Interaction.modes.nearestGroup = function(chart, e, options, useFinalPosition) {
        const position = Chart.helpers.getRelativePosition(e, chart);
        const garageName = chart.config.options.plugins.title.text;

        const items = [];
        let desiredIndex;
        let longestLabelLength = 0;
        let isPointSelected = false;
        Chart.Interaction.evaluateInteractionItems(chart, "x", position, (element, datasetIndex, index) => {
            if (element.inXRange(position.x, useFinalPosition) && element.inYRange(position.y, useFinalPosition)) {
                isPointSelected = true;
                if (items.length === 0) {
                    desiredIndex = index;
                }

                if (index === desiredIndex) {
                    items.push({element, datasetIndex, index});
                }

                const labelLength = chart.data.datasets[datasetIndex].label.trim().length;
                if (longestLabelLength < labelLength) {
                    longestLabelLength = labelLength;
                }
            }
        });

        if (isPointSelected) {
            longestLabel[garageName] = longestLabelLength;
            LIVE_SELECTED[garageName] = false;

            // If a reset timer for returning back to showing live data exists, stop it.
            if (resetTimers[garageName] != null) {
                clearTimeout(resetTimers[garageName]);
                resetTimers[garageName] = null;
            }

            if (indexSelected[garageName] != desiredIndex) {
                indexSelected[garageName] = desiredIndex;

                const historyUpdateData = formatHistoryUpdateData(chart.data.datasets, desiredIndex);
                TABLE_MANAGER.animateHistoryTableUpdate(historyUpdateData, CHART_LABELS[desiredIndex], garageName)
            }
        }
        else {
            if (isTodaySelected(garageName) && !LIVE_SELECTED[garageName]) {
                // Set reset timer for going back to showing live data when points are no longer being hovered over.
                if (e.type === "mousemove") {
                    if (resetTimers[garageName] === null) {
                        resetTimers[garageName] = setTimeout(resetToLive, 1000, garageName);
                    }
                }
                // Immediately reset back to showing live data.
                else {
                    resetToLive(garageName);
                }
            }
        }

        return items;
    };

    /**
     * Returns formatted spaces data ready to be animated in the table.
     * @param {array} chartDatasets - contains all spaces data for a given garage.
     * @param {number} desiredIndex - data index (time) to grab information from the dataset.
     * @returns {array} formatted array containing spaces data with a string representing its change from the previous timestamp.
    */
    function formatHistoryUpdateData(chartDatasets, desiredIndex) {
        const dataTest = [];
        for (let idx = 0; idx < 7; ++idx) {
            const spaces = chartDatasets[idx].data[desiredIndex];

            if (desiredIndex === 0) {
                dataTest.push([spaces, "n/a"]);
            }
            else {
                const previousSpaces = chartDatasets[idx].data[desiredIndex - 1];
                let change;

                if (previousSpaces === null) {
                    change = "n/a"
                }
                else if (spaces > previousSpaces) {
                    change = "increase";
                }
                else if (spaces < previousSpaces) {
                    change = "decrease";
                }
                else {
                    change = "same";
                }
                dataTest.push([spaces, change]);
            }
        }

        return dataTest;
    }

    /**
     * Right-aligns data labels in chart tooltips.
     * @param {Object} context - contains all relevant chart data surrounding the tooltip event fire.
    */
    function customTooltipLabelGenerator(context) {
        const garageName = context.chart.config.options.plugins.title.text;

        let label = context.dataset.label;
        if (label.length != longestLabel[garageName]) {
            label = label.slice(0, longestLabel[garageName] - label.length);
        }

        return `${label}: ${context.parsed.y}`;
    }

    /**
     * Hides the dataset row clicked in the legend in both the chart and table.
     * @param {Event} e - the event type fired from user input.
     * @param {Object} legendItem - contains the datasetIndex the event was fired from.
     * @param {Object} legend - contains the chart the event was fired from.
    */
    const customLegendClickHandler = function(e, legendItem, legend) {
        const garageName = legend.chart.config.options.plugins.title.text;
        const index = legendItem.datasetIndex;
        const chart = legend.chart;

        if (chart.isDatasetVisible(index)) {
            chart.hide(index);
            legendItem.hidden = true;
            TABLE_MANAGER.hideTableRow(index, true, garageName);
        }
        else {
            chart.show(index);
            legendItem.hidden = false;
            TABLE_MANAGER.hideTableRow(index, false, garageName);
        }
    };

    /**
     * Adds event listeners to each garage to remove any active chart elements when mouse activity is detected to be outside
     * of a chart canvas.
     * If the day selected is the current day, live data is displayed.
    */
    function setupChartOutOfBoundListeners() {
        ["PS1", "PS3", "PS4"].forEach((garageName) => {
            const garageChartElem = document.getElementById(`${garageName}-chart`);
            const eventHandler = function(e) {
                const garageChartObject = chartData.garageChartObjects[garageName];

                const {
                    bottom, 
                    top,
                    right,
                    left
                } = garageChartObject.chartArea;
                const rect = garageChartElem.getBoundingClientRect();
                const x = e.x - rect.left;
                const y = e.y - rect.top;
    
                if (x < left - 10 || x > right + 10 || y > bottom + 10 || y < top - 10) {
                    garageChartObject.setActiveElements([]);
                    garageChartObject.tooltip.setActiveElements([], {});
                    garageChartObject.update();

                    if (isTodaySelected(garageName) && !LIVE_SELECTED[garageName]) {
                        resetToLive(garageName);
                    }
                }
            };

            const garageContainerElem = document.getElementById(`garage-${garageName}`);
            garageContainerElem.addEventListener('click', eventHandler);
            garageContainerElem.addEventListener('mousemove', eventHandler);
            garageContainerElem.addEventListener('mouseleave', eventHandler);
        });
    }

    /**
     * Automatically selects the current day while also configuring weekday buttons that have available information to be clickable.
    */
     function setupChartButtons() {
        for (let idx = 0; idx < chartData.garageChartDatasets.length; ++idx) {
            [...document.querySelectorAll(`[index="${idx}"]`)].forEach((button) => {
                if (chartData.garageChartDatasets[idx] === null) {
                    return;
                }

                if (idx === chartData.garageChartDatasets.length - 1) {
                    button.style.color = "white";
                    button.style.background = "black";
                    button.style.cursor = "pointer";
                }
                else {
                    button.style.color = "black";
                    button.style.background = "#e1e1e1";
                    button.style.cursor = "pointer";
                }
            });
        }
    }

    /**
     * Resets and configures a garage back to showing live data.
     * @param {string} garageName - garage to reset back to live.
    */
     function resetToLive(garageName) {
        LIVE_SELECTED[garageName] = true;
        indexSelected[garageName] = -1;

        if (resetTimers[garageName] != null) {
            clearTimeout(resetTimers[garageName])
            resetTimers[garageName] = null;
        }

        TABLE_MANAGER.switchTable(garageName);
    }

    /**
     * Returns true if the current day is the selected weekday for a given garage, false if not.
     * @param {string} garageName - name of the garage to check.
     * @returns {boolean} true if today is the selected weekday, false if not.
    */
    function isTodaySelected(garageName) {
        const weekdayButtons = [...document.querySelectorAll(`[garage="${garageName}"]`)];
        for (let idx = 0; idx < weekdayButtons.length; ++idx) {
            if (weekdayButtons[idx].style.background === "black") {
                if (Number(weekdayButtons[idx].getAttribute("index")) === (chartData.garageChartDatasets.length - 1))
                {
                    return true;
                }
                break;
            }
        }

        return false;
    }

    /**
     * @name setupWeekdayButtonListeners
     * Set event listeners for each weekday button.
    */
     (function() {
        [...document.getElementsByClassName('weekday-button')].forEach((button) => {
            button.onclick = () => {
                if (button.style.color === "white") {
                    return;
                }
    
                weekdayClick(button)
            }
        });
    })();

    /**
     * Swaps the dataset in a given chart corresponding to the weekday button clicked if 
     * that given weekday dataset is not already selected and not empty.
     * @param {Object} weekdayButton - the weekday button clicked.
    */
    function weekdayClick(weekdayButton) {
        const indexClicked = weekdayButton.getAttribute("index");
        const garageName = weekdayButton.getAttribute("garage");

        if (chartData.garageChartDatasets[indexClicked] === null || indexClicked > chartData.garageChartDatasets.length - 1) {
            return;
        }

        weekdayButton.style.color = "white";
        weekdayButton.style.background = "black";

        swapCharts(chartData.garageChartDatasets[indexClicked][garageName], chartData.garageChartObjects[garageName])
        indexSelected[garageName] = -1;

        if (indexClicked === chartData.garageChartDatasets.length - 1) {
            resetToLive(garageName);
        }
        else {
            LIVE_SELECTED[garageName] = false;
            TABLE_MANAGER.switchTable(garageName);
        }

        const weekdayButtons = [...document.querySelectorAll(`[garage=${garageName}]`)];
        for (let idx = 0; idx < weekdayButtons.length; ++idx) {
            const weekdayBtn = weekdayButtons[idx];

            if (idx != indexClicked && weekdayBtn.style.background === "black") {
                weekdayBtn.style.color = "black";
                weekdayBtn.style.background = "#e1e1e1"
                break;
            }
        }
    }

    /**
     * Swaps the dataset in a given chart for a given weekday dataset.
     * @param {Object} garageDataset - dataset to swap in.
     * @param {Chart} garageChartObject - chart object to swap dataset into.
    */
     function swapCharts(garageDataset, garageChartObject) {
        for (let idx = 0; idx < garageChartObject.data.datasets.length; ++idx) {
            garageChartObject.data.datasets[idx].data = garageDataset[idx].slice();
        }
        garageChartObject.update();
    }

    /**
     * Updates today's dataset and animates it on any chart that has today selected.
     * @param {Object} newData - the most recent spaces data for each garage.
    */
     function updateDayChart(newData) {
        for (const [garageName, garageChartObject] of Object.entries(chartData.garageChartObjects)) {
            for (let idx = 0; idx < garageChartObject.data.datasets.length; ++idx) {
                if (isTodaySelected(garageName)) {
                    garageChartObject.data.datasets[idx].data = newData[garageName][idx].slice()
                }
                chartData.garageChartDatasets[chartData.garageChartDatasets.length - 1][garageName] = newData[garageName].slice()
            }
            garageChartObject.update();
        }
    }

    /**
     * Adds a new day that can be selected.
     * @param {Object} newDayDataset - dataset containing the new day's data.
    */
     function addDayChart(newDayDataset) {
        chartData.garageChartDatasets.push(newDayDataset);
        [...document.querySelectorAll(`[index="${(chartData.garageChartDatasets.length) - 1}"]`)].forEach((button) => {
            button.style.color = "black";
            button.style.backgroundColor = "#e1e1e1";
            button.style.cursor = "pointer";
        });
    }

    /**
     * Resets all buttons and corresponding charts to the first day of the week (Monday).
     * @param {Object} newWeekDataset - dataset containing the dataset of the first day of the week.
    */
     function resetWeek(newWeekDataset) {
        chartData.garageChartDatasets = newWeekDataset;

        ["PS1", "PS3", "PS4"].forEach((garageName) => {
            swapCharts(chartData.garageChartDatasets[0][garageName], chartData.garageChartObjects[garageName]);
        });

        for (let idx = 0; idx < 7; ++idx) {
            [...document.querySelectorAll(`[index="${idx}"]`)].forEach((button) => {
                if (idx === 0) {
                    button.style.color = "white";
                    button.style.backgroundColor = "black";
                }
                else {
                    button.style.color = "grey";
                    button.style.backgroundColor = "white";
                    button.style.cursor = "default";
                }
            });
        }
    }

    return {
        setupCharts: setupCharts,
        updateDayChart: updateDayChart,
        addDayChart: addDayChart,
        resetWeek: resetWeek,
    }
})();