document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        const margin = { top: 10, right: 50, bottom: 30, left: 100 }, // Adjust left margin to create space for the icon
            width = container.clientWidth - margin.left - margin.right,
            height = 60 - margin.top - margin.bottom;

        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            const metrics = ['Emissions', 'Innovation', 'Cost', 'Risk'];

            metrics.forEach((metric, index) => {
                const metricData = data.map(d => parseFloat(d[metric]));
                const iconPath = `metrics/${metric.toLowerCase()}.png`; // Path to the icon image

                // Create a new container for each metric
                const metricContainer = container.appendChild(document.createElement('div'));
                metricContainer.classList.add('metric-container');
                metricContainer.style.display = 'flex';
                metricContainer.style.alignItems = 'center';

                // Create and append the icon for each metric
                const icon = document.createElement('img');
                icon.src = iconPath;
                icon.style.width = '40px'; // Set the icon size
                icon.style.height = 'auto';
                icon.style.marginRight = '10px'; // Space between the icon and the chart
                metricContainer.appendChild(icon);

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
                    .domain([0, 0.01]);

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
                    .style("fill", "#424242");

                // Add the x Axis
                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x));

                // Add the y Axis
                svg.append("g")
                    .call(d3.axisLeft(y).tickFormat(""));

                // Add range slider under the chart
                const slider = d3.sliderHorizontal()
                    .min(d3.min(metricData))
                    .max(d3.max(metricData))
                    .width(width)
                    .default([d3.min(metricData), d3.max(metricData)])
                    .fill('#6b6b6b')
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
                    .attr('transform', 'translate(' + margin.left + ',' + 10 + ')')
                    .call(slider);

                sliderContainer.selectAll('.tick line').remove();
                sliderContainer.selectAll('.domain').remove();
                sliderContainer.selectAll('.handle')
                    .attr('fill', 'rgba(94,134,117,0.85)')
                    .attr('stroke', 'rgba(94,134,117,0.85)')
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


