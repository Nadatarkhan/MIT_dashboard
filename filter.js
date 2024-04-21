document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot');
    if (container) {
        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            // Define the metrics to plot
            const metrics = ['Emissions', 'Innovation', 'Cost', 'Risk'];

            // Iterate over each metric to create separate plots
            metrics.forEach(metric => {
                createHistogram(container, data, metric);
            });
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});

function createHistogram(container, data, metric) {
    const margin = { top: 30, right: 30, bottom: 30, left: 50 },
        width = 460 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract metric values
    const metricData = data.map(d => parseFloat(d[metric]));

    // Set up the x and y scales
    const x = d3.scaleLinear()
        .domain(d3.extent(metricData))
        .range([0, width]);
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(metricData)]);

    // Create histogram bins
    const bins = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(10))
        (metricData);

    // Define bell curve function
    const normal = d3.curveBasis(d3.curveNormal);

    // Plot the bars
    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.length))
        .attr("width", d => x(d.x1) - x(d.x0) - 1)
        .attr("height", d => height - y(d.length))
        .attr("fill", "#69b3a2")
        .attr("opacity", 0.7);

    // Plot bell curve
    svg.append("path")
        .datum(d3.range(-3, 3, 0.1))
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.7)
        .attr("d", d3.line()
            .x(d => x(d))
            .y(d => y(d3.randomNormal()(0, 1)(d)))
            .curve(normal)
        );

    // Add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text(metric);
}

