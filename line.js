document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const dpi = window.devicePixelRatio;
        const containerWidth = container.clientWidth - 200; // Further reduce width
        const containerHeight = container.clientHeight - 280; // Further reduce height

        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth * dpi) // Adjust for DPI
            .attr("height", containerHeight * dpi) // Adjust for DPI
            .style("width", containerWidth + "px")
            .style("height", containerHeight + "px");
        const context = canvas.node().getContext("2d");
        context.scale(dpi, dpi); // Adjust all drawing to DPI

        const margin = { top: 40, right: 40, bottom: 60, left: 80 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([0, height]);
        let selectedVariable = "emission";
        let gridFilter = "all";
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
                    selectedVariable = this.textContent.trim().toLowerCase() === "emissions" ? "emission" : "cost";
                    updatePlot(selectedVariable);
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

        function updatePlot(variable) {
            const filteredData = emissionsData.filter(d => {
                return (gridFilter === "all" ||
                    (gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "no decarbonization"));
            });

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d[variable])]);

            context.clearRect(0, 0, containerWidth, containerHeight);
            context.save();
            context.translate(margin.left, margin.top);

            // Draw grid lines
            drawGridLines(context, x, y, width, height);

            // Draw lines with Gaussian blur effect
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d[variable]))
                .context(context);

            context.globalAlpha = 0.6; // Set global alpha for line opacity
            context.filter = 'blur(1px)'; // Apply a slight blur to simulate Gaussian smoothing

            const scenarioGroups = d3.groups(filteredData, d => d.scenario);
            scenarioGroups.forEach((group, index) => {
                context.beginPath();
                line(group[1]);
                context.lineWidth = 2;
                context.strokeStyle = color(index);
                context.stroke();
            });

            context.restore();
        }

        function drawGridLines(context, x, y, width, height) {
            context.strokeStyle = '#ddd'; // Light grey grid lines
            context.beginPath();

            // Horizontal grid lines
            y.ticks(10).forEach(d => {
                context.moveTo(0, y(d));
                context.lineTo(width, y(d));
            });

            // Vertical grid lines
            x.ticks().forEach(d => {
                context.moveTo(x(d), 0);
                context.lineTo(x(d), height);
            });

            context.stroke();
        }
    } else {
        console.error("Container not found");
    }
});
