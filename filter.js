document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for the innovation plot
    if (container) {
        console.log("Container found:", container);

        const margin = { top: 50, right: 30, bottom: 70, left: 50 },
            width = 600 - margin.left - margin.right,
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
                .thresholds(x.ticks(20)); // Adjust the number of bins as needed

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
                .attr("x", function(d) { return x(d.x0) + 1; }) // Adjusted to make bars closer
                .attr("y", function(d) { return y(d.length); })
                .attr("width", function(d) { return x(d.x1) - x(d.x0) - 2; }) // Adjusted to make bars wider
                .attr("height", function(d) { return height - y(d.length); })
                .style("fill", "#69b3a2");

            // Add the distribution curve (grey in color)
            const line = d3.line()
                .x(function(d) { return x(d.x0) + (x(d.x1) - x(d.x0)) / 2; })
                .y(function(d) { return y(d.length); });

            svg.append("path")
                .datum(bins)
                .attr("fill", "none")
                .attr("stroke", "#ccc") // Grey color
                .attr("stroke-width", 2)
                .attr("d", line);

            // Add the x Axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .append("text")
                .attr("class", "x-axis-label")
                .attr("x", width / 2)
                .attr("y", 40)
                .style("text-anchor", "middle")
                .text("Innovation");

            // Add the y Axis
            svg.append("g")
                .call(d3.axisLeft(y))
                .append("text")
                .attr("class", "y-axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", -40)
                .attr("x", -height / 2)
                .attr("dy", "0.71em")
                .style("text-anchor", "middle")
                .text("Frequency");

            // Add a slider at the top of the plot to filter innovation value ranges
            const slider = d3.sliderHorizontal()
                .min(d3.min(innovationData))
                .max(d3.max(innovationData))
                .width(width)
                .tickFormat(d3.format(".2f"))
                .default([d3.min(innovationData), d3.max(innovationData)])
                .displayValue(false)
                .on('onchange', val => {
                    console.log("Slider value:", val);
                    // Filter data based on slider value
                    const filteredData = innovationData.filter(d => d >= val[0] && d <= val[1]);
                    console.log("Filtered data:", filteredData);
                    // Update histogram based on filtered data
                    const updatedBins = histogram(filteredData);
                    console.log("Updated bins:", updatedBins);
                    // Update histogram bars
                    svg.selectAll("rect")
                        .data(updatedBins)
                        .transition()
                        .duration(500)
                        .attr("x", function(d) { return x(d.x0) + 1; })
                        .attr("y", function(d) { return y(d.length); })
                        .attr("width", function(d) { return x(d.x1) - x(d.x0) - 2; })
                        .attr("height", function(d) { return height - y(d.length); });
                });

            svg.append("g")
                .attr("transform", "translate(0, 10)")
                .call(slider);

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});
