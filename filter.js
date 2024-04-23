document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        const margin = { top: 10, right: 50, bottom: 30, left: 60 },
            totalWidth = container.clientWidth - margin.left - margin.right,
            totalHeight = container.clientHeight - margin.top - margin.bottom, // Use the full container height
            plotHeight = totalHeight * 0.7, // 70% of the container height for the plot
            sliderHeight = totalHeight * 0.3, // 30% for the slider
            iconWidth = 50; // Width for the icon

        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            const metrics = ['Emissions', 'Innovation', 'Cost', 'Risk'];

            metrics.forEach((metric, index) => {
                const metricData = data.map(d => parseFloat(d[metric]));

                // Create a new container for each metric
                const metricContainer = container.appendChild(document.createElement('div'));
                metricContainer.classList.add('metric-container');
                metricContainer.style.display = 'flex';
                metricContainer.style.marginBottom = '10px'; // Margin between each metric container

                // Insert icon for each metric
                const iconImg = document.createElement('img');
                iconImg.src = `metrics/${metric.toLowerCase()}.png`;
                iconImg.style.width = `${iconWidth}px`;
                iconImg.style.marginRight = '10px'; // Space between the icon and the plot
                metricContainer.appendChild(iconImg);

                // Append SVG canvas for the plot
                const svg = d3.select(metricContainer)
                    .append("svg")
                    .attr("width", totalWidth - iconWidth) // Adjust width to account for icon
                    .attr("height", plotHeight)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                // Set up the x and y scales
                const x = d3.scaleLinear()
                    .domain(d3.extent(metricData))
                    .range([0, totalWidth - iconWidth - margin.left - margin.right]);
                const y = d3.scaleLinear()
                    .range([plotHeight, 0])
                    .domain([0, d3.max(metricData)]);

                // Create histogram bins
                const histogram = d3.histogram()
                    .value(d => d)
                    .domain(x.domain())
                    .thresholds(x.ticks(20));

                const bins = histogram(metricData);

                // Append bars for histogram
                svg.selectAll("rect")
                    .data(bins)
                    .enter().append("rect")
                    .attr("x", 1)
                    .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
                    .attr("width", d => x(d.x1) - x(d.x0) - 1)
                    .attr("height", d => plotHeight - y(d.length))
                    .style("fill", "#424242");

                // Append slider container directly below the plot within the same metric container
                const sliderContainer = d3.select(metricContainer)
                    .append('div')
                    .style('width', `${totalWidth - iconWidth}px`)
                    .style('height', `${sliderHeight}px`);

                // Initialize the slider
                const slider = d3.sliderHorizontal()
                    .min(d3.min(metricData))
                    .max(d3.max(metricData))
                    .width(totalWidth - iconWidth - margin.left - margin.right)
                    .fill('#6b6b6b')
                    .on('onchange', val => {
                        svg.selectAll("rect")
                            .attr("opacity", d => {
                                const [minValue, maxValue] = val;
                                return (d.x0 >= minValue && d.x1 <= maxValue) ? 1 : 0;
                            });
                    });

                sliderContainer.call(slider);
            });
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});


