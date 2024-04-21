document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        const margin = { top: 30, right: 30, bottom: 30, left: 50 },
            width = container.clientWidth - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            const metrics = ['Emissions', 'Innovation', 'Cost', 'Risk'];

            metrics.forEach((metric, index) => {
                const metricData = data.map(d => parseFloat(d[metric]));

                // Calculate mean and standard deviation
                const mean = d3.mean(metricData);
                const stdDev = d3.deviation(metricData);

                // Create a new container for each metric
                const metricContainer = container.appendChild(document.createElement('div'));
                metricContainer.classList.add('metric-container');

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
                    .style("fill", "#69b3a2");

                // Add bell curve
                const curveData = d3.range(d3.min(metricData), d3.max(metricData), (d3.max(metricData) - d3.min(metricData)) / 100);
                const curve = d3.curveBasis(curveData);
                const curveLine = d3.line()
                    .x(d => x(d))
                    .y(d => y(d3.normal(mean, stdDev)(d)))
                    .curve(curve);

                svg.append("path")
                    .datum(curveData)
                    .attr("fill", "none")
                    .attr("stroke", "#ccc") // Grey color
                    .attr("stroke-width", 2)
                    .attr("d", curveLine);

                // Add the x Axis
                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x));

                // Add the y Axis
                svg.append("g")
                    .call(d3.axisLeft(y));

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
                    .attr("y", -40)
                    .text("Frequency");

                // Add range slider
                const slider = d3.sliderHorizontal()
                    .min(d3.min(metricData))
                    .max(d3.max(metricData))
                    .width(width)
                    .on('onchange', val => {
                        console.log("Slider value:", val);
                        svg.selectAll("rect")
                            .attr("opacity", d => {
                                console.log("Bin range:", d.x0, "-", d.x1);
                                if (val !== undefined && val.length === 2) {
                                    console.log("Slider range:", val[0], "-", val[1]);
                                    const binMin = d.x0;
                                    const binMax = d.x1;
                                    return (binMax >= val[0] && binMin <= val[1]) ? 1 : 0;
                                } else {
                                    return 1; // Keep all bars visible if slider values are undefined or not iterable
                                }
                            });
                    });


                // Append slider to container
                const sliderContainer = d3.select(metricContainer)
                    .append('div')
                    .attr('class', 'slider-container')
                    .style('width', width + 'px')
                    .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', 40)
                    .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + 10 + ')')
                    .call(slider);

                // Style slider
                sliderContainer.selectAll('.tick line').remove();
                sliderContainer.selectAll('.domain').remove();
                sliderContainer.selectAll('.handle')
                    .attr('fill', '#007bff')
                    .attr('stroke', '#007bff')
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

