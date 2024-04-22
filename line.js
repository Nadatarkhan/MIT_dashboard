document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define margins and dimensions for the SVG
        const margin = { top: 20, right: 30, bottom: 30, left: 50 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Append SVG to the container
        const svg = d3.select(container)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission"; // Default variable
        let gridFilter = "all"; // Default to show all
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

            document.querySelectorAll('input[name="gridFilter"]').forEach((input) => {
                input.addEventListener('change', function() {
                    gridFilter = this.value;
                    updatePlot(selectedVariable);
                });
            });
        });

        function updatePlot(variable) {
            selectedVariable = variable;

            const filteredData = emissionsData.filter(d => {
                if (gridFilter === "all") return true; // Show all data
                return d.grid === gridFilter; // Filter by 'decarbonized' or 'notDecarbonized'
            });

            // Update the scales
            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d[selectedVariable])]);

            // Update axes
            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();
            svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
            svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

            svg.selectAll(".line").remove(); // Clear previous lines

            const scenarioGroups = d3.group(filteredData, d => d.scenario);
            const color = d3.scaleOrdinal(d3.schemeCategory10);

            scenarioGroups.forEach((values, key) => {
                svg.append("path")
                    .datum(values)
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", color(key))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => x(d.year))
                        .y(d => y(d[selectedVariable]))
                    );
            });
        }
    } else {
        console.error("Container not found");
    }
});
