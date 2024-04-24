document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth - 200; // Adjust as necessary
        const containerHeight = container.clientHeight - 280; // Adjust as necessary

        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth)
            .attr("height", containerHeight);
        const context = canvas.node().getContext("2d");

        const margin = { top: 40, right: 40, bottom: 60, left: 80 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission";
        let gridFilter = "all";
        let emissionsData; // Define emissionsData variable here to ensure scope availability

        // Load and process data
        d3.csv("data/example_data.csv").then(function(data) {
            emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid
            }));

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

            // Call updatePlot initially after ensuring data is fully processed
            updatePlot(selectedVariable);
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
            // X-axis
            context.save();
            context.translate(margin.left, height + margin.top);
            context.scale(1, -1);
            x.ticks().forEach(function(d) {
                context.moveTo(x(d), 0);
                context.lineTo(x(d), -5);
            });
            context.strokeStyle = "black";
            context.stroke();
            context.textAlign = "center";
            x.ticks().forEach(function(d) {
                context.fillText(d3.timeFormat("%Y")(d), x(d), 10);
            });
            context.restore();

            // Y-axis
            context.save();
            context.translate(margin.left, margin.top);
            context.beginPath();
            y.ticks(10).forEach(function(d) {
                context.moveTo(0, y(d));
                context.lineTo(-5, y(d));
            });
            context.stroke();
            context.textAlign = "right";
            context.textBaseline = "middle";
            y.ticks(10).forEach(function(d) {
                context.fillText(d, -10, y(d));
            });
            context.restore();
        }
    } else {
        console.error("Container not found");
    }
});
