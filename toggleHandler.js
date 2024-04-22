document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('toggle');

    // This function now expects the new data to be an array of data points
    // It will call the global updatePlot function with the new data
    function updatePlotWithToggle(newData) {
        if (window.updatePlot) {
            window.updatePlot('Emissions', newData); // Pass 'Emissions' or another variable if needed
        } else {
            console.error('updatePlot function is not defined.');
        }
    }

    // Listen for changes on the toggle
    toggle.addEventListener('change', function() {
        const isDecarbonized = toggle.checked;

        // Since we are loading the CSV again, we need to transform the data as done in line.js
        d3.csv("data/example_data.csv").then(function(data) {
            const filteredData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario
            })).filter(d => isDecarbonized ? d.grid === 'decarbonization' : true);

            updatePlotWithToggle(filteredData);

        }).catch(function(error) {
            console.error("Error filtering data:", error);
        });
    });
});

