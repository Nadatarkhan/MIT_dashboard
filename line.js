document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        // Set explicit dimensions if needed
        const containerWidth = container.clientWidth - 200; // Further reduce width
        const containerHeight = container.clientHeight - 280; // Further reduce height

        // Create a canvas instead of SVG
        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth)
            .attr("height", containerHeight);
        const context = canvas.node().getContext("2d");

        const margin = { top: 40, right: 40, bottom: 60, left: 80 }, // Increased margins
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission"; // Default to 'emission'
        let gridFilter = "all"; // Default grid filter
        let emissionsData; // Define emissionsData variable here

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

            // Draw lines
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d[variable]))
                .context(context);

            const scenarioGroups = d3.groups(filteredData, d => d.scenario);
            scenarioGroups.forEach((group, index) => {
                context.beginPath();
                line(group[1]);
                context.lineWidth = 1;
                context.strokeStyle = color(index);
                context.stroke();
            });

            context.restore();
            drawAxis();
        }

        function drawAxis() {
            // Draw X-axis
            context.save();
            context.translate(margin.left, height + margin.top);
            context.scale(1, -1);
            x.axisBottom().scale(x)(context);
            context.restore();

            // Draw Y-axis
            context.save();
            context.translate(margin.left, margin.top);
            y.axisLeft().scale(y)(context);
            context.restore();
        }
    } else {
        console.error("Container not found");
    }
});

