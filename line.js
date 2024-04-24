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
        let scenarioFilters = []; // Array to hold selected scenarios to be excluded
        let implementationFilters = []; // Array to hold selected implementation levels to be excluded

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

            document.querySelectorAll('.icon-container').forEach(container => {
                container.addEventListener('click', function() {
                    const scenario = this.getAttribute('data-field');
                    console.log("Icon clicked, scenario filter set to:", scenario);
                    toggleScenarioFilter(scenario);
                    updatePlot(selectedVariable);
                });
            });

            function toggleScenarioFilter(scenario) {
                const index = scenarioFilters.indexOf(scenario);
                if (index === -1) {
                    // Scenario not found in filters, add it
                    scenarioFilters.push(scenario);
                } else {
                    // Scenario found in filters, remove it
                    scenarioFilters.splice(index, 1);
                }
            }

            function toggleImplementationFilter(implementation) {
                const index = implementationFilters.indexOf(implementation);
                if (index === -1) {
                    // Implementation not found in filters, add it
                    implementationFilters.push(implementation);
                } else {
                    // Implementation found in filters, remove it
                    implementationFilters.splice(index, 1);
                }
            }

            function updatePlot(variable) {
                console.log("Updating plot for variable:", variable);
                // Filter data based on grid and implementation level filters
                let filteredData = emissionsData.filter(d => (gridFilter === "all" || (gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "bau")) && (!implementationFilters.length || !implementationFilters.includes(d.implementation)));

                // Remove data points corresponding to selected scenarios
                scenarioFilters.forEach(scenario => {
                    filteredData = filteredData.filter(d => d.scenario !== scenario);
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
});







