document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const container = document.querySelector('.visual1');

    if (!container) {
        console.error("Container not found");
        return;
    }
    console.log("Container found");

    const dpi = window.devicePixelRatio;
    const containerWidth = container.clientWidth - 100;
    const containerHeight = container.clientHeight - 230;
    const canvas = d3.select(container)
        .append("canvas")
        .attr("width", containerWidth * dpi)
        .attr("height", containerHeight * dpi)
        .style("width", containerWidth + "px")
        .style("height", containerHeight + "px");
    const context = canvas.node().getContext("2d");
    context.scale(dpi, dpi);

    const margin = {top: 40, right: 40, bottom: 60, left: 200},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    let pvFilter = "baseline"; // Default to 'baseline'

    d3.csv("data/example_data.csv").then(function(data) {
        console.log("Data loaded successfully");
        const emissionsData = data.map(d => ({
            year: new Date(d.epw_year),
            emission: +d.Emissions,
            pv: d.pv // Assuming pv has 'baseline', 'partial', or 'full'
        }));

        // Attach event listeners to radio buttons for the 'pv' field
        document.querySelectorAll('input[name="pvFilter"]').forEach(input => {
            input.addEventListener('change', function() {
                pvFilter = this.value;
                console.log("PV filter changed to:", pvFilter);
                updatePlot();
            });
        });

        // Initial update plot call
        updatePlot();

        function updatePlot() {
            console.log("Updating plot for PV filter:", pvFilter);
            const filteredData = emissionsData.filter(d => d.pv === pvFilter);

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.emission))
                .context(context);

            // Draw the line
            context.beginPath();
            line(filteredData);
            context.lineWidth = 2;
            context.strokeStyle = 'steelblue';
            context.stroke();

            context.restore();

            drawAxis();
        }

        function drawAxis() {
            // X Axis
            context.save();
            context.translate(margin.left, height + margin.top);
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), 10);
            });
            context.fillText("Year", width / 2, 40);
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(width, 0);
            context.stroke();
            context.restore();

            // Y Axis
            context.save();
            context.translate(margin.left, margin.top);
            y.ticks().forEach(d => {
                context.fillText(d, -50, y(d));
            });
            context.fillText("Emissions", -100, height / 2);
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, -height);
            context.stroke();
            context.restore();
        }
    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});








