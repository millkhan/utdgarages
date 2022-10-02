(function() {
    const socket = io();
    let chartSetupFlag = false;

    socket.on('createCharts', (msg) => {
        if (!chartSetupFlag) {
            chartSetupFlag = true;
            CHART_MANAGER.setupCharts(msg);
        }
    });

    socket.on('updateTables', (msg) => {
        const parsedMsg = JSON.parse(msg);

        if (typeof TABLE_MANAGER !== "undefined") {
            TABLE_MANAGER.updateTableData(parsedMsg["live_table"], parsedMsg["table_time"]);
        }
    });

    socket.on('updateDayChart', (msg) => {
        const parsedMsg = JSON.parse(msg);
        CHART_MANAGER.updateDayChart(parsedMsg);
    });

    socket.on('addDayChart', (msg) => {
        const parsedMsg = JSON.parse(msg);
        CHART_MANAGER.addDayChart(parsedMsg);
    });

    socket.on('resetWeek', (msg) => {
        const parsedMsg = JSON.parse(msg);

        CHART_MANAGER.resetWeek(parsedMsg);
    });
})();