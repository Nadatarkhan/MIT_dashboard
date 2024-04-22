document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 30, left: 50 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Append the SVG canvas to the container
        const svg = d3.select(container)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Define the scales and the line
        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "Emissions";
        let gridFilter = "decarbonization"; // Default grid filter
        let emissionsData;

        // Load and process the data
        d3.csv("data/example_data.csv").then(function(data) {
            emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid
            }));

            // Initialize the plot with the default selected variable and filter
            updatePlot(selectedVariable, gridFilter);

            // Toggle for grid filter
            const toggleLabel = d3.select(container)
                .append("label")
                .attr("class", "toggle-wrapper");

            toggleLabel.append("input")
                .attr("class", "toggleCheckbox")
                .attr("type", "checkbox")
                .attr("id", "gridToggle")
                .on("change", function() {
                    gridFilter = this.checked ? "no decarbonization" : "decarbonization";
                    updatePlot(selectedVariable, gridFilter);
                });

            toggleLabel.append("div")
                .attr("class", "toggleContainer")
                .text("Toggle Grid Filter");

            // Buttons for changing variables
            const buttonContainer = d3.select(container)
                .append("div")
                .attr("class", "button-container");

            const buttonData = ["Emissions", "Cost", "Emissions-Cost"];
            buttonContainer.selectAll("button")
                .data(buttonData)
                .enter()
                .append("button")
                .attr("class", "pheasant-demure-button solid light hover blink")
                .text(d => d)
                .on("click", function() {
                    updatePlot(d3.select(this).text(), gridFilter);
                });

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });

        function updatePlot(variable, gridFilter) {
            selectedVariable = variable;

            // Filter data based on the grid filter
            const filteredData = emissionsData.filter(d => d.grid === gridFilter);

            // Set the domain for the scales
            x.domain(d3.extent(filteredData, d => d.year));
            const maxY = d3.max(filteredData, d => d[variable]);
            y.domain([0, maxY]);

            // Update the axes
            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y));

            svg.selectAll(".y-axis-label").text(variable);
            svg.selectAll(".line").remove();

            // Group data by scenario
            const scenarioGroups = {};
            filteredData.forEach(d => {
                scenarioGroups[d.scenario] = scenarioGroups[d.scenario] || [];
                scenarioGroups[d.scenario].push(d);
            });

            // Draw lines for each scenario
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            Object.values(scenarioGroups).forEach(scenario => {
                svg.append("path")
                    .datum(scenario)
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", color(scenario[0].scenario))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => x(d.year))
                        .y(d => +d[variable])
                    );
            });
        }
    } else {
        console.error("Container not found");
    }
});
