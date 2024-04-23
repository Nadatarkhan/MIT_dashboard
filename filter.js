document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        const margin = { top: 10, right: 50, bottom: 30, left: 50 },
            iconWidth = 50, // Width for the icon
            spaceBetweenIconAndPlot = 10, // Space between the icon and the plot
            width = container.clientWidth - margin.left - margin.right - iconWidth - spaceBetweenIconAndPlot,
            height = 60 - margin.top - margin.bottom;

        console.log("Container width: " + container.clientWidth + ", Plot width: " + width); // Log dimensions for debugging

        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            const metrics = ['Emissions', 'Innovation', 'Cost', 'Risk'];

            metrics.forEach((metric, index) => {
                const metricData = data.map(d => parseFloat(d[metric]));

                // Create a new container for each metric
                const metricContainer = container.appendChild(document.createElement('div'));
                metricContainer.classList.add('metric-container');
                metricContainer.style.display = 'flex';
                metricContainer.style.alignItems = 'center';

                // Insert icon for each metric
                const iconImg = document.createElement('img');
                iconImg.src = `metrics/${metric.toLowerCase()}.png`; // Dynamic path based on the metric
                iconImg.style.width = `${iconWidth}px`; // Set the width of the icon
                iconImg.style.height = 'auto'; // Maintain aspect ratio
                iconImg.style.marginRight = `${spaceBetweenIconAndPlot}px`; // Space between icon and plot
                metricContainer.appendChild(iconImg);

                // Append SVG canvas to the container
                const svg = d3.select(metricContainer)
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                // Set up the x and y scales
                const x = d3.scaleLinear()
                    .domain(d3.extent(metricData))
                    .range([0, width]);
                const y = d3.scaleLinear()
                    .range([height, 0])
                    .domain([0, 0.01]); // Adjust the domain as needed

                // Create histogram bins
                const histogram = d3.histogram()
                    .value(d => d)
                    .domain(x.domain())
                    .thresholds(x.ticks(40));

                const bins = histogram(metricData);

                // Compute y scale domain based on the maximum bin count
                y.domain([0, d3.max(bins, d => d.length)]);

                // Append bars for histogram
                svg.selectAll("rect")
                    .data(bins)
                    .enter().append("rect")
                    .attr("x", 1)
                    .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
                    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                    .attr("height", d => height - y(d.length))
                    .style("fill", "#424242")
                    .on("mouseover", function(event, d) {
                        const tooltip = d3.select("body").append("div")
                            .attr("class", "tooltip")
                            .style("opacity", 0);
                        tooltip.html(`<strong>Range:</strong> ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}<br><strong>Frequency:</strong> ${d.length}`)
                            .style("left", (event.pageX) + "px")
                            .style("top", (event.pageY - 28) + "px");
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", 0.8);
                    })
                    .on("mouseout", function() {
                        d3.select(".tooltip").remove();
                    });

                // Add the x Axis
                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x));

                // Add the y Axis
                svg.append("g")
                    .call(d3.axisLeft(y).tickFormat(""));  // No tick labels on the y-axis
            });
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});

