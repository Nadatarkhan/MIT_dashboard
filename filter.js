document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('innovation_plot'); // Get the container for innovation plot
    if (container) {
        const margin = { top: 10, right: 50, bottom: 30, left: 50 },
            width = container.clientWidth - margin.left - margin.right - 60, // Reduced width for plots
            height = 60 - margin.top - margin.bottom;

        // Load the data
        d3.csv("data/example_data.csv").then(function(data) {
            const metrics = ['Emissions', 'Innovation', 'Cost', 'Risk'];

            // Create an icon container
            const iconContainer = container.appendChild(document.createElement('div'));
            iconContainer.style.width = '50px'; // Width for icons
            iconContainer.style.height = '100%';
            iconContainer.style.float = 'left'; // Align icons to the left

            metrics.forEach((metric, index) => {
                const metricData = data.map(d => parseFloat(d[metric]));

                // Append an icon for each metric
                const icon = document.createElement('img');
                icon.src = `metrics/${metric.toLowerCase()}.png`;
                icon.style.width = '50px'; // Set icon size
                icon.style.height = 'auto';
                iconContainer.appendChild(icon);

                // Create a new container for each metric plot
                const metricContainer = container.appendChild(document.createElement('div'));
                metricContainer.classList.add('metric-container');
                metricContainer.style.width = `${width}px`; // Adjusted width for plots
                metricContainer.style.display = 'inline-block'; // Inline display

                // Append SVG canvas to the metric container
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
                    .attr("width", d => x(d.x1) - x(d.x0) - 1)
                    .attr("height", d => height - y(d.length))
                    .style("fill", "#424242");

                // Append axes
                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x));

                svg.append("g")
                    .call(d3.axisLeft(y).tickFormat(""));
            });
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});


