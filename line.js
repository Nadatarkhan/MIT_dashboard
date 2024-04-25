document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const container = document.querySelector('.visual1');

    if (!container) {
        console.error("Container not found");
        return;
    }
    console.log("Container found");

    const dpi = window.devicePixelRatio;
    const containerWidth = container.clientWidth - 50;
    const containerHeight = container.clientHeight - 240;
    const canvas = d3.select(container)
        .append("canvas")
        .attr("width", containerWidth * dpi)
        .attr("height", containerHeight * dpi)
        .style("width", containerWidth + "px")
        .style("height", containerHeight + "px");
    const context = canvas.node().getContext("2d");
    context.scale(dpi, dpi);

    const margin = {top: 40, right: 40, bottom: 60, left: 200},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    let filters = {}; // Object to hold the active filters for each technology

    const fields = ['retrofit', 'schedules', 'lab', 'district', 'nuclear', 'deepgeo', 'ess', 'ccs', 'pv', 'grid'];

    d3.csv("data/example_data.csv").then(function(data) {
        console.log("Data loaded successfully");
        const emissionsData = data.map(d => ({
            year: new Date(d.epw_year),
            emission: +d.Emissions / 1000,
            ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {}) // assuming each field exists in CSV
        }));

        // Calculate median emissions for each year
        const yearMap = new Map();
        emissionsData.forEach(d => {
            const year = d.year.getFullYear();
            if (!yearMap.has(year)) yearMap.set(year, []);
            yearMap.get(year).push(d.emission);
        });

        const medianData = Array.from(yearMap, ([year, values]) => ({
            year: new Date(year, 0, 1),
            emission: d3.median(values)
        }));

        fields.forEach(field => {
            const iconContainer = document.querySelector(`.icon-container[data-field="${field}"]`);
            if (iconContainer) {
                const form = document.createElement('form');
                let options = ['baseline', 'partial', 'full'];
                if (field === 'grid') {
                    options = ['bau', 'cheap_ng', 'decarbonization'];
                }
                options.forEach(value => {
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.id = `${field}-${value}`;
                    input.name = `${field}Filter`;
                    input.value = value;
                    input.style.transform = 'scale(0.75)';
                    input.style.marginRight = '5px';

                    const label = document.createElement('label');
                    label.htmlFor = `${field}-${value}`;
                    label.textContent = field === 'grid' ? value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ') : value.charAt(0).toUpperCase() + value.slice(1);
                    label.style.fontSize = '12px';

                    form.appendChild(input);
                    form.appendChild(label);
                    form.appendChild(document.createElement('br'));

                    input.addEventListener('change', function() {
                        if (!filters[field]) filters[field] = [];
                        const filterIndex = filters[field].indexOf(value);
                        if (this.checked && filterIndex === -1) {
                            filters[field].push(value);
                        } else if (!this.checked && filterIndex !== -1) {
                            filters[field].splice(filterIndex, 1);
                        }
                        updatePlot();
                    });
                });
                iconContainer.appendChild(form);
            } else {
                console.log(`${field} icon container not found`);
            }
        });

        function getColor(field, value) {
            if (field === 'district' && ['baseline', 'partial', 'full'].includes(value)) return 'purple';
            if (field === 'nuclear' && ['baseline', 'full'].includes(value)) return 'red';
            if (field === 'deepgeo' && ['baseline', 'partial', 'full'].includes(value)) return 'green';
            return 'steelblue';
        }

        function updatePlot() {
            console.log("Updating plot with current filters:", filters);
            const filteredData = emissionsData.filter(d => {
                return Object.keys(filters).every(field =>
                    filters[field].length === 0 || filters[field].includes(d[field])
                );
            });

            x.domain(d3.extent(emissionsData, d => d.year));
            y.domain([0, Math.max(d3.max(filteredData, d => d.emission), d3.max(medianData, d => d.emission))]);

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            filteredData.forEach(data => {
                context.beginPath();
                const line = d3.line()
                    .x(d => x(data.year))
                    .y(d => y(data.emission))
                    .context(context);
                line([data]);
                context.lineWidth = 0.2;
                context.strokeStyle = getColor(data.field, data.value);
                context.globalAlpha = 0.5; // Reduced opacity for individual lines
                context.stroke();
            });

            // Draw the median line
            context.beginPath();
            const medianLine = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.emission))
                .context(context);
            medianLine(medianData);
            context.lineWidth = 2;
            context.strokeStyle = 'black'; // Distinguish the median line
            context.globalAlpha = 1; // Full opacity for the median line
            context.stroke();

            context.restore();

            drawAxis();
        }

        function drawAxis() {
            context.save();
            context.translate(margin.left, margin.top + height);  // Ensure we're starting from the bottom left

            // Drawing the X-axis
            context.font = "12px Arial";
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), 20);  // X-axis tick labels
            });

            context.fillText("Year", width / 2, 35);  // X-axis title
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(width, 0);
            context.stroke();
            context.restore();

            // Drawing the Y-axis line, ticks, and labels
            context.save();
            context.translate(margin.left, margin.top);  // Start from the top left corner of the plot area
            context.font = "12px Arial";  // Font for Y-axis tick labels

            // Y-axis line
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, height);  // Draw line downward to match the height of the plot
            context.stroke();

            // Correct the Y-axis ticks and labels (not inverted, moved further left)
            y.ticks().forEach(d => {
                const yPosition = y(d);  // This directly uses the D3 scale to calculate the position, ensuring correct orientation.
                context.fillText(d, -50, yPosition);  // Increased offset to -50 to move labels further left
                // Draw tick marks
                context.beginPath();
                context.moveTo(-10, yPosition);  // Start of tick mark (further left)
                context.lineTo(0, yPosition);  // End of tick mark (on the axis line)
                context.stroke();
            });

            context.restore();

            // Rotate and position the Y-axis label
            context.save();
            context.font = "12px Arial";
            context.translate(margin.left, margin.top + height / 2);  // Center along the Y-axis
            context.rotate(-Math.PI / 2);  // Rotate 90 degrees to make the text vertical
            context.textAlign = "center";  // Center align text
            context.fillText("Emissions- MT-CO2", 0, -70);  // Increased the offset to -90 to move label further left
            context.restore();
        }

    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});
