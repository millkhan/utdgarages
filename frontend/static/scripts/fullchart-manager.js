const CHART_MANAGER = (function() {
    Chart.defaults.font.family = "Roboto Mono";

    const chartData = {
        garageChartObject: {},
        garageChartDatasets: [],
    };

    let longestLabel = 0;
    
    let indexSelected = 0;

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
                display: false
            }
        },
    };

    /**
     * Creates and displays an interactive chart for the current day while configuring all weekday buttons.
     * @param {Object} chartDatasets - chart spaces data containing datasets for each day in the week.
    */
    function setupCharts(chartDatasets) {
        for (let day = 0; day < chartDatasets.length; ++day) {
            if (chartDatasets[day] === null) {
                chartData.garageChartDatasets.push(null);
            }
            else {
                chartData.garageChartDatasets.push([...chartDatasets[day]["PS1"], ...chartDatasets[day]["PS3"], ...chartDatasets[day]["PS4"]]);
            }
        }

        const fullChart = formatChart(chartDatasets)
        const ctx = document.getElementById("full-chart");
        chartData.garageChartObject = new Chart(ctx, fullChart);

        setupChartOutOfBoundListeners();
        setupChartButtons();
    }

    /**
     * Returns a formatted chart object that's ready to be used with chart.js.
     * @param {array} datasets - datasets to be used for the chart.
     * @param {string} garageName - name of the garage for format template.
     * @returns {Chart} formatted chart object.
    */
     function formatChart(datasets) {
        const garageDatasets = [];

        for (const [garageName, garageDataset] of Object.entries(datasets[datasets.length - 1])) {
            for (let idx = 0; idx < garageDataset.length; ++idx) {
                const rowLabel = CHART_DATA_CONFIG.chartDataTemplate[garageName][idx];
                const permitType = rowLabel.split(" ")[1];
                const permitColor = CHART_DATA_CONFIG.chartColors[permitType];
                const borderColor = `${permitColor}c0`;
                const backgroundColor = `${permitColor}70`;

                garageDatasets.push({label:          rowLabel,
                                    garage:          garageName,
                                    data:            garageDataset[idx].slice(),
                                    borderColor:     borderColor,
                                    backgroundColor: backgroundColor});
            }
        }

        const optionsClone = structuredClone(chartOptions);

        optionsClone.plugins.tooltip = {
            callbacks: {
                label: customTooltipLabelGenerator
            }
        };

        return ({
            type: "line",
            data: {datasets: garageDatasets}, 
            options: optionsClone
        });
    }

    /**
     * Selects nearest group (from mouse input) of datapoints that originate from the same index. 
     * @function Interaction.modes.nearestGroup
     * @param {Chart} chart - the chart we are returning items from.
     * @param {Event} e - the event type fired from user input.
     * @param {InteractionOptions} options - options to use.
     * @param {boolean} useFinalPosition - use final element position (animation target).
     * @return {InteractionItem[]} items that are found.
     */
     Chart.Interaction.modes.nearestGroup = function(chart, e, options, useFinalPosition) {
        const position = Chart.helpers.getRelativePosition(e, chart);

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
            longestLabel = longestLabelLength;

            if (indexSelected != desiredIndex) {
                indexSelected = desiredIndex;
            }
        }

        return items;
    };

    /**
     * Right-aligns data labels in chart tooltips.
     * @param {Object} context - contains all relevant chart data surrounding the tooltip event fire.
    */
    function customTooltipLabelGenerator(context) {
        const garageName = context.dataset.garage;

        let label = context.dataset.label;
        if (label.length != longestLabel) {
            label = label.slice(0, longestLabel - label.length);
        }

        return `${garageName} ${label}: ${context.parsed.y}`;
    }

    /**
     * Adds an event listener to full chart to remove any active chart elements when mouse activity is detected to be outside
     * of the chart canvas.
    */
    function setupChartOutOfBoundListeners() {
        const garageChartElem = document.getElementById("full-chart");
        const eventHandler = function(e) {
            const garageChartObject = chartData.garageChartObject;

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
            }
        };

        const garageContainerElem = document.getElementById("full-chart-container")
        garageContainerElem.addEventListener('click', eventHandler);
        garageContainerElem.addEventListener('mousemove', eventHandler);
        garageContainerElem.addEventListener('mouseleave', eventHandler);
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
     * Returns true if the current day is the selected weekday, false if not.
     * @returns {boolean} true if today is the selected weekday, false if not.
    */
    function isTodaySelected() {
        const weekdayButtons = [...document.getElementsByClassName("weekday-button")]
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
     * Swaps the dataset in full chart with a given chart corresponding to the weekday button clicked if 
     * that given weekday dataset is not already selected and not empty.
     * @param {Object} weekdayButton - the weekday button clicked.
    */
    function weekdayClick(weekdayButton) {
        const indexClicked = weekdayButton.getAttribute("index");

        if (chartData.garageChartDatasets[indexClicked] === null || indexClicked > chartData.garageChartDatasets.length - 1) {
            return;
        }

        weekdayButton.style.color = "white";
        weekdayButton.style.background = "black";

        swapCharts(chartData.garageChartDatasets[indexClicked], chartData.garageChartObject)
        indexSelected = -1;

        const weekdayButtons = [...document.getElementsByClassName("weekday-button")];
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
     * Swaps the dataset in full chart for a given weekday dataset.
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
     * Updates today's dataset and animates on full chart if today is selected.
     * @param {Object} newData - the most recent spaces data for each garage.
    */
     function updateDayChart(newData) {
        const updatedChart = [...newData["PS1"], ...newData["PS3"], ...newData["PS4"]];
        
        for (let idx = 0; idx < updatedChart.length; ++idx) {
            if (isTodaySelected()) {
                chartData.garageChartObject.data.datasets[idx].data = updatedChart[idx].slice()
            }
        }
        chartData.garageChartObject.update();
        chartData.garageChartDatasets[chartData.garageChartDatasets.length - 1] = updatedChart.slice()
    }

    /**
     * Adds a new day that can be selected.
     * @param {Object} newDayDataset - dataset containing the new day's data.
    */
     function addDayChart(newDayDataset) {
        const updatedChart = [...newDayDataset["PS1"], ...newDayDataset["PS3"], ...newDayDataset["PS4"]];

        chartData.garageChartDatasets.push(updatedChart);
        [...document.querySelectorAll(`[index="${(chartData.garageChartDatasets.length) - 1}"]`)].forEach((button) => {
            button.style.color = "black";
            button.style.backgroundColor = "#e1e1e1";
            button.style.cursor = "pointer";
        });
    }

    /**
     * Resets all buttons and full chart to the first day of the week (Monday).
     * @param {Object} newWeekDataset - dataset containing the dataset of the first day of the week.
    */
     function resetWeek(newWeekDataset) {
        chartData.garageChartDatasets = [[...newWeekDataset[0]["PS1"], ...newWeekDataset[0]["PS3"], ...newWeekDataset[0]["PS4"]]];

        swapCharts(chartData.garageChartDatasets[0], chartData.garageChartObject);

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