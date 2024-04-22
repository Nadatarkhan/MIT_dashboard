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
        let emissionsData;
        let gridFilter = "decarbonization"; // Added global variable to track the grid filter

        // Function to update plot based on selected variable
        function updatePlot(variable) {
            selectedVariable = variable;

            // Filter the emissionsData based on the gridFilter
            const filteredData = emissionsData.filter(d => d.grid === gridFilter);

            // Set the domain for the scales
            x.domain(d3.extent(filteredData, d => d.year));
            const maxY = d3.max(filteredData, d => d[selectedVariable]);
            y.domain([0, maxY]);

            // Update the axes
            svg.select(".x-axis").remove();
            svg.select(".y-axis").remove();

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y));

            // Update the plot with the filtered data
            // Remove existing lines
            svg.selectAll(".line").remove();

            // Group data by scenario
            const scenarioGroups = {};
            filteredData.forEach(d => {
                if (!scenarioGroups[d.scenario]) {
                    scenarioGroups[d.scenario] = [];
                }
                scenarioGroups[d.scenario].push(d);
            });

            // Define color scale
            const color = d3.scaleOrdinal(d3.schemeCategory10);

            // Draw lines for each scenario
            Object.values(scenarioGroups).forEach(scenario => {
                svg.append("path")
                    .datum(scenario)
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", color(scenario[0].scenario))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => x(d.year))
                        .y(d => {
                            if (selectedVariable === "Emissions") {
                                return y(d.emission);
                            } else if (selectedVariable === "Cost") {
                                return y(d.cost);
                            } else if (selectedVariable === "Emissions-Cost") {
                                return y(Math.max(d.emission, d.cost));
                            }
                        })
                    );
            });
        }

        // Load and process the data
        d3.csv("data/example_data.csv").then(function(data) {
            emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid // This column must exist in your CSV
            }));
            console.log(emissionsData); // Check the output here

            // Initial plot
            updatePlot(selectedVariable);

            // Add buttons for Emissions, Cost, Emissions-Cost
            const buttonContainer = d3.select(container)
                .append("div")
                .attr("class", "button-container");

            const buttonData = ["Emissions", "Cost", "Emissions-Cost"];
            buttonContainer.selectAll("button")
                .data(buttonData)
                .enter()
                .append("button")
                .attr("class", "variable-button")
                .text(d => d)
                .on("click", function() {
                    updatePlot(d3.select(this).text());
                });

            // Add the toggle button
            const toggleLabel = d3.select(container)
                .append("label")
                .attr("class", "toggle-wrapper");

            toggleLabel.append("input")
                .attr("class", "toggleCheckbox")
                .attr("type", "checkbox")
                .attr("id", "gridToggle")
                .on("change", toggleGridFilter);

            const toggleContainer = toggleLabel.append("div")
                .attr("class", "toggleContainer");

            toggleContainer.append("div")
                .text("Decarbonized");

            toggleContainer.append("div")
                .text("Not Decarbonized");
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });

        // Toggle grid filter function
        function toggleGridFilter() {
            gridFilter = this.checked ? "no decarbonization" : "decarbonization";
            updatePlot(selectedVariable);
        }

    } else {
        console.error("Container not found");
    }
}); // End

