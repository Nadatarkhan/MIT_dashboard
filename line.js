document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const container = document.querySelector('.visual1');
    if (container) {
        console.log("Container found");
        const dpi = window.devicePixelRatio;
        const containerWidth = container.clientWidth - 100;
        const containerHeight = container.clientHeight - 230;
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
        let scenarioFilters = new Set(); // Store selected scenarios to filter
        let implementationLevel = "baseline"; // Default implementation level

        d3.csv("data/example_data.csv").then(function(data) {
            console.log("Data loaded successfully");
            const emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid,
                implementation: d.Implementation
            }));

            updatePlot(selectedVariable);

            document.querySelectorAll('.button-container button').forEach(button => {
                button.addEventListener('click', function() {
                    selectedVariable = this.textContent.trim().toLowerCase() === "emissions" ? "emission" : "cost";
                    console.log("Variable changed to:", selectedVariable);
                    updatePlot(selectedVariable);
                });
            });

            document.querySelectorAll('input[name="gridFilter"]').forEach(input => {
                input.addEventListener('change', function() {
                    gridFilter = this.value;
                    console.log("Grid filter changed to:", gridFilter);
                    updatePlot(selectedVariable);
                });
            });

            document.querySelectorAll('.icon-container').forEach(container => {
                container.addEventListener('click', function() {
                    const scenario = this.getAttribute('data-field');
                    console.log("Icon clicked, scenario filter toggled for:", scenario);
                    if (scenarioFilters.has(scenario)) {
                        scenarioFilters.delete(scenario); // Deselect scenario
                    } else {
                        scenarioFilters.add(scenario); // Select scenario
                    }
                    updatePlot(selectedVariable);
                });
            });

            function updatePlot(variable) {
                console.log("Updating plot for variable:", variable);
                const filteredData = emissionsData.filter(d => {
                    const isSelectedScenario = scenarioFilters.size === 0 || scenarioFilters.has(d.scenario);
                    return (gridFilter === "all" || (gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "bau")) && isSelectedScenario && d.implementation === implementationLevel;
                });

                x.domain(d3.extent(filteredData, d => d.year));
                y.domain([0, d3.max(filteredData, d => d[variable])]);

                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                context.save();
                context.translate(margin.left, margin.top);

                const color = d3.scaleOrdinal(d3.schemeCategory10);
                const line = d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d[variable]))
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
                drawAxis(variable);
            }

            function drawAxis(variable) {
                console.log("Drawing axes for:", variable);
                context.save();
                context.translate(margin.left, height + margin.top);
                x.ticks().forEach(d => {
                    context.fillText(d3.timeFormat("%Y")(d), x(d), 10);
                });
                context.fillText("Year", width / 2, 40); // X-axis Label
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(width, 0);
                context.strokeStyle = 'black';
                context.stroke();
                context.restore();

                // Y-axis
                context.save();
                context.translate(margin.left, margin.top);
                y.ticks(10).forEach(d => {
                    context.fillText(d, -70, -y(d) + 3); // Shift label left for more space
                });
                context.fillText(variable.charAt(0).toUpperCase() + variable.slice(1), -120, -height / 2 + 20); // Shift Y-axis label further left
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(0, -height);
                context.strokeStyle = 'black';
                context.stroke();
                context.restore();
            }
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }

    const controlsContainer = document.querySelector('.controls-container');
    if (controlsContainer) {
        const graphContainer = document.querySelector('.graph-container');
        graphContainer.parentNode.insertBefore(controlsContainer, graphContainer.nextSibling);
        console.log("Controls moved under the plot");
    } else {
        console.error("Controls container not found");
    }
});








