document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        const margin = { top: 30, right: 30, bottom: 30, left: 50 },
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // Append the SVG canvas to the container
        const svg = d3.select(container)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            // Extract innovation values
            const innovationData = data.map(d => parseFloat(d.Innovation));

            // Set up the x and y scales
            const x = d3.scaleLinear()
                .domain(d3.extent(innovationData))
                .range([0, width]);
            const y = d3.scaleLinear()
                .range([height, 0])
                .domain([0, 0.01]); // Adjust the domain as needed

            // Compute kernel density estimation
            const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
            const density = kde(innovationData);

            // Plot the area
            svg.append("path")
                .datum(density)
                .attr("fill", "#69b3a2")
                .attr("opacity", ".8")
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .attr("stroke-linejoin", "round")
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return x(d[0]); })
                    .y(function(d) { return y(d[1]); })
                );

            // Add the x Axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // Add the y Axis
            svg.append("g")
                .call(d3.axisLeft(y));
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});

// Function to compute density
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(function(x) {
            return [x, d3.mean(V, function(v) { return kernel(x - v); })];
        });
    };
}

function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}
