document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        const margin = { top: 10, right: 50, bottom: 30, left: 50 },
            width = container.clientWidth - margin.left - margin.right,
            height = 80 - margin.top - margin.bottom;

        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            const metrics = ['Emissions', 'Innovation', 'Cost', 'Risk'];

            metrics.forEach((metric, index) => {
                const metricData = data.map(d => parseFloat(d[metric]));

                // Create a new container for each metric
                const metricContainer = container.appendChild(document.createElement('div'));
                metricContainer.classList.add('metric-container');
                metricContainer.style.marginBottom = '20px'; // Set smaller margins here

                // Append SVG canvas to the container
                const svg = d3.select(metricContainer)
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
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
                    /*.on("mouseover", function(event, d) {
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
                    })*/;

                // Add the x Axis
                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x));

                // Add the y Axis
                svg.append("g")
                    .call(d3.axisLeft(y).tickFormat(""));  // No tick labels on the y-axis

                // Add axis titles
                svg.append("text")
                    .attr("class", "x-axis-label")
                    .attr("text-anchor", "middle")
                    .attr("x", width / 2)
                    .attr("y", height + 30)
                    .text(metric);

                svg.append("text")
                    .attr("class", "y-axis-label")
                    .attr("text-anchor", "middle")
                    .attr("transform", "rotate(-90)")
                    .attr("x", -height / 2)
                    .attr("y", -20)
                    .style("font-size", "10px")
                    .text("Frequency");

                // Add the y Axis and style tick labels
                svg.append("g")
                    .call(d3.axisLeft(y))
                    .selectAll(".tick text")  // Select all text elements for the ticks
                    .style("font-size", "0px");  // Set the font size


                // Add range slider
                const slider = d3.sliderHorizontal()
                    .min(d3.min(metricData))
                    .max(d3.max(metricData))
                    .width(width)
                    .default([d3.min(metricData), d3.max(metricData)]) // Set default range
                    .fill('#6b6b6b') // Color of the slider track
                    .on('onchange', val => {
                        svg.selectAll("rect")
                            .attr("opacity", d => {
                                const [minValue, maxValue] = val;
                                return (d.x0 >= minValue && d.x1 <= maxValue) ? 1 : 0;
                            });
                    });

                // Append slider to container
                const sliderContainer = d3.select(metricContainer)
                    .append('div')
                    .attr('class', 'slider-container')
                    .style('width', width + 'px')
                    .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', 50)
                    .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + 7 + ')')
                    .call(slider);

                // Style slider
                sliderContainer.selectAll('.tick line').remove();
                sliderContainer.selectAll('.domain').remove();
                sliderContainer.selectAll('.handle')
                    .attr('fill', 'rgba(248,39,227,0.85)')
                    .attr('stroke', 'rgba(248,39,227,0.85)')
                    .attr('rx', 5)
                    .attr('ry', 5);
            });
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});

