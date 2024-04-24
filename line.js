document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth)
            .attr("height", containerHeight);
        const context = canvas.node().getContext("2d");

        const margin = { top: 40, right: 20, bottom: 50, left: 60 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

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

            drawAxis();

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

        function drawAxis() {
            // X-axis
            context.beginPath();
            context.moveTo(0, height);
            context.lineTo(width, height);
            context.stroke();

            // Y-axis
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, height);
            context.stroke();
        }
    } else {
        console.error("Container not found");
    }
});
