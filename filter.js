document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        console.log("Container found:", container);

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

        console.log("SVG created:", svg);

        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            console.log("Data loaded:", data);

            // Extract innovation values
            const innovationData = data.map(d => parseFloat(d.Innovation));

            console.log("Innovation data:", innovationData);

            // Set up the x scale
            const x = d3.scaleLinear()
                .domain(d3.extent(innovationData))
                .range([0, width]);

            console.log("x scale:", x);

            // Create a histogram function
            const histogram = d3.histogram()
                .value(function(d) { return d; })
                .domain(x.domain())
                .thresholds(x.ticks(40)); // Adjust the number of bins as needed

            // Generate the histogram bins
            const bins = histogram(innovationData);

            console.log("Histogram bins:", bins);

            // Set up the y scale based on the maximum bin count
            const y = d3.scaleLinear()
                .domain([0, d3.max(bins, function(d) { return d.length; })])
                .range([height, 0]);

            // Append rectangles for the histogram bars
            svg.selectAll("rect")
                .data(bins)
                .enter()
                .append("rect")
                .attr("x", function(d) { return x(d.x0); })
                .attr("y", function(d) { return y(d.length); })
                .attr("width", function(d) { return x(d.x1) - x(d.x0) - 1; })
                .attr("height", function(d) { return height - y(d.length); })
                .style("fill", "#69b3a2");

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
