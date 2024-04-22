// line.js

let globalEmissionsData; // Global variable to store the initial data for reuse

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

        // Load and process the data
        d3.csv("data/example_data.csv").then(function(data) {
            globalEmissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario
            }));

            // Check if there are any invalid values in globalEmissionsData
            const invalidValues = globalEmissionsData.filter(d => isNaN(d[selectedVariable]));
            console.log('Invalid values:', invalidValues);

            // Set the domain for the scales
            x.domain(d3.extent(globalEmissionsData, d => d.year));
            const maxY = d3.max(globalEmissionsData, d => d[selectedVariable]);
            console.log('Max Y value:', maxY);
            y.domain([0, maxY]);

            console.log('X domain:', x.domain());
            console.log('Y domain:', y.domain());

            // Add the X Axis
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .append("text") // X-axis label
                .attr("class", "x-axis-label")
                .attr("x", width / 2)
                .attr("y", 40) // Adjusted for padding
                .style("text-anchor", "middle")
                .text("Years");

            // Add the Y Axis
            svg.append("g")
                .call(d3.axisLeft(y))
                .append("text") // Y-axis label
                .attr("class", "y-axis-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2) // Adjusted for padding
                .attr("y", -60) // Adjusted for padding
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text(selectedVariable);

            // Initial plot
            updatePlot(selectedVariable, globalEmissionsData);

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });

        // Function to update plot based on selected variable
        function updatePlot(variable, newData) {
            selectedVariable = variable;
            let emissionsData = newData || globalEmissionsData;

            // Update domain for y-scale
            let maxY = d3.max(emissionsData, d => d[selectedVariable]);
            y.domain([0, maxY]);

            // Update Y axis label
            svg.selectAll(".y-axis-label").text(selectedVariable);

            // Remove existing lines
            svg.selectAll(".line").remove();

            // Group data by scenario
            const scenarioGroups = {};
            emissionsData.forEach(d => {
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
                        .y(d => y(d[selectedVariable]))
                    );
            });

            // Redraw the X and Y axis
            svg.select(".x-axis-label").call(d3.axisBottom(x));
            svg.select(".y-axis-label").call(d3.axisLeft(y));
        }

        // Expose updatePlot to global scope
        window.updatePlot = updatePlot;
    } else {
        console.error("Container not found");
    }
});
