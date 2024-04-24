document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 50, left: 60 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Append the SVG canvas to the container
        const svg = d3.select(container)
            .append("svg")
            .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission"; // Default to 'emission'
        let gridFilter = "all"; // Default grid filter
        let emissionsData;

        d3.csv("data/example_data.csv").then(function(data) {
            emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid
            }));

            updatePlot(selectedVariable);

            document.querySelectorAll('.button-container button').forEach(button => {
                button.addEventListener('click', function() {
                    updatePlot(this.textContent.trim().toLowerCase() === "emissions" ? "emission" : "cost");
                });
            });

            document.querySelectorAll('input[name="gridFilter"]').forEach((input) => {
                input.addEventListener('change', function() {
                    gridFilter = this.value;
                    updatePlot(selectedVariable);
                });
            });

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });

        d3.csv("data/example_data.csv").then(function(data) {
            console.log(data);  // Check the parsed data
            emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid
            }));
            updatePlot(selectedVariable);
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });

        function updatePlot(variable) {
            selectedVariable = variable;

            const filteredData = emissionsData.filter(d => {
                if (gridFilter === "all") return true;
                return gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "no decarbonization";
            });

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d[selectedVariable])]);

            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickPadding(15).tickSizeInner(-height))
                .selectAll("text")
                .style("font-size", "18px"); // Increased font size for axis numbers

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y).ticks(6).tickPadding(15).tickSizeInner(-width))
                .selectAll("text")
                .style("font-size", "18px"); // Increased font size for axis numbers

            // Make inner lines light grey
            svg.selectAll(".x-axis line, .y-axis line")
                .style("stroke", "#ddd"); // Very light grey for grid lines

            svg.selectAll(".line").remove();
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d[selectedVariable]));

            const scenarioGroups = d3.groups(filteredData, d => d.scenario);
            scenarioGroups.forEach(([key, values]) => {
                svg.append("path")
                    .datum(values)
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", color(key))
                    .attr("stroke-width", 4) // Increased line weight even more
                    .attr("d", line);
            });
        }
    } else {
        console.error("Container not found");
    }
});