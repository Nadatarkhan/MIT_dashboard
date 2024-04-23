document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        const margin = { top: 10, right: 50, bottom: 30, left: 50 },
            iconWidth = 50, // Width for the icon
            spaceBetweenIconAndPlot = 10, // Space between the icon and the plot
            width = container.clientWidth - margin.left - margin.right - iconWidth - spaceBetweenIconAndPlot,
            plotHeight = 100, // Height allocated for the plot
            sliderHeight = 50, // Height for the slider
            totalHeight = plotHeight + sliderHeight; // Total height to accommodate both plot and slider

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
                metricContainer.style.height = `${totalHeight}px`; // Ensure the container is large enough for both components

                // Insert icon for each metric
                const iconImg = document.createElement('img');
                iconImg.src = `metrics/${metric.toLowerCase()}.png`;
                iconImg.style.width = `${iconWidth}px`;
                iconImg.style.height = 'auto';
                iconImg.style.marginRight = `${spaceBetweenIconAndPlot}px`;
                metricContainer.appendChild(iconImg);

                // Append SVG canvas for the plot
                const svg = d3.select(metricContainer)
                    .append("svg")
                    .attr("width", width)
                    .attr("height", plotHeight)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                // Set up the x and y scales
                const x = d3.scaleLinear()
                    .domain(d3.extent(metricData))
                    .range([0, width]);
                const y = d3.scaleLinear()
                    .range([plotHeight, 0])
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
                    .attr("width", d => x(d.x1) - x(d.x0) - 1)
                    .attr("height", d => plotHeight - y(d.length))
                    .style("fill", "#424242");

                // Append slider container directly below the plot
                const sliderContainer = d3.select(metricContainer)
                    .append('div')
                    .attr('class', 'slider-container')
                    .style('width', `${width}px`)
                    .style('height', `${sliderHeight}px`)
                    .append('svg')
                    .attr('width', width)
                    .attr('height', sliderHeight)
                    .append('g')
                    .attr('transform', 'translate(0, 0)');

                // Initialize the slider
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

                sliderContainer.call(slider);
            });
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});

