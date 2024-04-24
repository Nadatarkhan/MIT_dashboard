document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Create a canvas instead of SVG
        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth)
            .attr("height", containerHeight);
        const context = canvas.node().getContext("2d");

        const margin = { top: 20, right: 30, bottom: 50, left: 60 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission"; // Default to 'emission'
        let gridFilter = "all"; // Default grid filter

        d3.csv("data/example_data.csv").then(function(data) {
            let emissionsData = data.map(d => ({
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

            // Draw lines
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            const scenarioGroups = d3.groups(filteredData, d => d.scenario);
            scenarioGroups.forEach((group, index) => {
                const values = group[1];
                context.beginPath();
                values.forEach((d, i) => {
                    if (i === 0) {
                        context.moveTo(x(d.year), y(d[variable]));
                    } else {
                        context.lineTo(x(d.year), y(d[variable]));
                    }
                });
                context.strokeStyle = color(index);
                context.stroke();
            });
        }

        function drawAxis() {
            // Add custom code to draw axes using the canvas API
            // This is a placeholder for actual axis drawing code
        }
    } else {
        console.error("Container not found");
    }
});

