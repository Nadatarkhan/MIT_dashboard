document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth - 10; // Reduce container size slightly to fit better
        const containerHeight = container.clientHeight - 10;

        // Create a canvas instead of SVG
        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth)
            .attr("height", containerHeight);
        const context = canvas.node().getContext("2d");

        const margin = { top: 40, right: 40, bottom: 40, left: 60 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

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

            // Clear the canvas
            context.clearRect(0, 0, containerWidth, containerHeight);
            context.save();
            context.translate(margin.left, margin.top);

            // Draw axes
            drawAxes(context, filteredData, x, y, height);

            // Draw lines
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            filteredData.forEach((d, i) => {
                context.beginPath();
                context.moveTo(x(d.year), y(d[variable]));
                context.lineTo(x(d.year), y(d[variable]));
                context.strokeStyle = color(i);
                context.stroke();
            });

            context.restore();
        }

        function drawAxes(context, data, xScale, yScale, chartHeight) {
            context.beginPath();
            context.strokeStyle = 'black';
            // Draw X-axis
            context.moveTo(0, chartHeight);
            context.lineTo(width, chartHeight);
            context.stroke();

            // Draw Y-axis
            context.moveTo(0, 0);
            context.lineTo(0, chartHeight);
            context.stroke();
        }
    } else {
        console.error("Container not found");
    }
});
