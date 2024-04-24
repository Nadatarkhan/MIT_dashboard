document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const dpi = window.devicePixelRatio;
        const containerWidth = container.clientWidth - 300;
        const containerHeight = container.clientHeight - 280;

        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth * dpi)
            .attr("height", containerHeight * dpi)
            .style("width", containerWidth + "px")
            .style("height", containerHeight + "px");
        const context = canvas.node().getContext("2d");
        context.scale(dpi, dpi);

        const margin = { top: 40, right: 40, bottom: 60, left: 200 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission"; // Default to 'emission'
        let gridFilter = "all";

        d3.csv("data/example_data.csv").then(function(data) {
            const emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid
            }));

            updatePlot(selectedVariable, emissionsData); // Initially load the plot with default data

            // Your event listeners for buttons and toggles remain unchanged
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }

    // Move buttons and toggles under the plot
    const controlsContainer = document.querySelector('.controls-container');
    if (controlsContainer) {
        const graphContainer = document.querySelector('.graph-container');
        graphContainer.parentNode.insertBefore(controlsContainer, graphContainer.nextSibling);
    } else {
        console.error("Controls container not found");
    }

    // Function to update the plot
    window.updatePlot = function(field, data) {
        console.log("Updating plot with:", field, data);

        const filteredData = data.filter(d => gridFilter === "all" ||
            (gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "bau"));

        x.domain(d3.extent(filteredData, d => d.year));
        y.domain([0, d3.max(filteredData, d => d[field])]);

        context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
        context.save();
        context.translate(margin.left, margin.top);

        const color = d3.scaleOrdinal(d3.schemeCategory10);
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d[field]))
            .context(context);

        const scenarioGroups = d3.groups(filteredData, d => d.scenario);
        scenarioGroups.forEach((group, index) => {
            context.beginPath();
            line(group[1]);
            context.lineWidth = 0.1;
            context.strokeStyle = color(index);
            context.stroke();
        });

        context.restore();
        drawAxis();
    };
});
