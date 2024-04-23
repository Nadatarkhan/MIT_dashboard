document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        const margin = { top: 10, right: 10, bottom: 30, left: 50 },
            baseWidth = container.clientWidth,
            iconWidth = 50, // Width allocated for the icon
            plotWidth = baseWidth - iconWidth - margin.left - margin.right, // Adjusted width for the plots
            height = 60 - margin.top - margin.bottom;

        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            const metrics = ['Emissions', 'Innovation', 'Cost', 'Risk'];

            metrics.forEach((metric, index) => {
                const metricData = data.map(d => parseFloat(d[metric]));

                // Create a new container for each metric
                const metricContainer = container.appendChild(document.createElement('div'));
                metricContainer.classList.add('metric-container');
                metricContainer.style.display = 'flex';
                metricContainer.style.flexDirection = 'row';
                metricContainer.style.alignItems = 'flex-start';

                // Append icon for each metric
                const icon = document.createElement('img');
                icon.src = `metrics/${metric.toLowerCase()}.png`;
                icon.style.width = `${iconWidth}px`;
                icon.style.height = 'auto';
                metricContainer.appendChild(icon);

                // Create a sub-container for the chart and slider
                const chartContainer = document.createElement('div');
                chartContainer.style.flexGrow = '1';
                chartContainer.style.display = 'flex';
                chartContainer.style.flexDirection = 'column';
                metricContainer.appendChild(chartContainer);

                // Append SVG canvas to the chart container for the plot
                const svg = d3.select(chartContainer)
                    .append("svg")
                    .attr("width", plotWidth)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                // Set up the x and y scales
                const x = d3.scaleLinear()
                    .domain(d3.extent(metricData))
                    .range([0, plotWidth - margin.left - margin.right]);
                const y = d3.scaleLinear()
                    .range([height, 0])
                    .domain([0, d3.max(metricData, d => d.length)]);

                // Create histogram bins
                const histogram = d3.histogram()
                    .value(d => d)
                    .domain(x.domain())
                    .thresholds(x.ticks(20)); // Adjust the number of ticks for clarity

                const bins = histogram(metricData);

                // Append bars for histogram
                svg.selectAll("rect")
                    .data(bins)
                    .enter().append("rect")
                    .attr("x", d => x(d.x0) + 1)
                    .attr("y", d => y(d.length))
                    .attr("width", d => x(d.x1) - x(d.x0) - 1)
                    .attr("height", d => height - y(d.length))
                    .attr("fill", "#424242");

                // Add the x Axis
                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x));

                // Add the y Axis
                svg.append("g")
                    .call(d3.axisLeft(y));

                // Append slider to the chart container
                const slider = d3.sliderHorizontal()
                    .min(d3.min(metricData))
                    .max(d3.max(metricData))
                    .width(plotWidth - margin.left - margin.right)
                    .default([d3.min(metricData), d3.max(metricData)])
                    .fill('#6b6b6b')
                    .on('onchange', val => {
                        svg.selectAll("rect")
                            .attr("opacity", d => (d.x0 >= val[0] && d.x1 <= val[1]) ? 1 : 0.2);
                    });

                const sliderSvg = d3.select(chartContainer)
                    .append('svg')
                    .attr('width', plotWidth)
                    .attr('height', 50)
                    .append('g')
                    .attr('transform', 'translate(10, 10)')
                    .call(slider);
            });
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});

