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

            // Set initial plot
            updatePlot(selectedVariable, gridFilter);

            // Event listener for grid toggle, assuming it's managed in HTML
            document.getElementById("gridToggle").addEventListener("change", function() {
                gridFilter = this.checked ? "no decarbonization" : "decarbonization";
                updatePlot(selectedVariable, gridFilter);
            });

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

            // Set domains
            x.domain(d3.extent(filteredData, d => d.year));
            const maxY = d3.max(filteredData, d => d[selectedVariable]);
            y.domain([0, maxY]);

            // Update axes
            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();
            svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
            svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

            svg.selectAll(".line").remove(); // Remove existing lines

            // Group data by scenario and redraw lines
            const scenarioGroups = {};
            filteredData.forEach(d => {
                scenarioGroups[d.scenario] = scenarioGroups[d.scenario] || [];
                scenarioGroups[d.scenario].push(d);
            });

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
    } else {
        console.error("Container not found");
    }
});
