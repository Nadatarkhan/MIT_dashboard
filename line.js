document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.icon-and-graph');
    if (!container) {
        console.error("Container not found");
        return;
    }

    const dpi = window.devicePixelRatio;
    const containerWidth = container.clientWidth - 50;
    const containerHeight = container.clientHeight - 170;
    const canvas = d3.select(container)
        .append("canvas")
        .attr("width", containerWidth * dpi)
        .attr("height", containerHeight * dpi)
        .style("width", containerWidth + "px")
        .style("height", containerHeight + "px");
    const context = canvas.node().getContext("2d");
    context.scale(dpi, dpi);

    const margin = {top: 30, right: 30, bottom: 40, left: 100},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    let filters = {}; // Object to hold the active filters for each technology

    const fields = ['retrofit', 'schedules', 'lab', 'district', 'nuclear', 'deepgeo', 'ccs', 'pv', 'grid'];

    d3.csv("data/example_data.csv", function(data) {
        const emissionsData = data.map(d => ({
            year: new Date(d.epw_year),
            emission: +d.Emissions / 1000,
            ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {})
        }));

        fields.forEach(field => {
            const iconContainer = document.querySelector(`.icon-container[data-field="${field}"]`);
            if (iconContainer) {
                const checkboxes = iconContainer.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', () => {
                        updateFilters(field, checkbox.value, checkbox.checked);
                    });
                });
            }
        });

        const baselineButton = document.getElementById('baselineButton');
        baselineButton.addEventListener('click', function() {
            const active = this.classList.toggle('active');
            document.querySelectorAll('input[type="checkbox"][value="baseline"]').forEach(checkbox => {
                checkbox.checked = active;
                updateFilters(checkbox.getAttribute('data-field'), 'baseline', active);
            });
        });

        function updateFilters(field, value, active) {
            if (!filters[field]) {
                filters[field] = [];
            }
            const index = filters[field].indexOf(value);
            if (active && index === -1) {
                filters[field].push(value);
            } else if (!active && index !== -1) {
                filters[field].splice(index, 1);
            }
            updatePlot();
        }

        function updatePlot() {
            const filteredData = emissionsData.filter(d => {
                return fields.every(field => filters[field].length === 0 || filters[field].includes(d[field]));
            });

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.emission))
                .context(context);

            line(filteredData);

            context.lineWidth = 0.2;
            context.strokeStyle = 'steelblue';
            context.stroke();
            context.restore();
            drawAxis();
        }

        function drawAxis() {
            context.save();
            context.translate(margin.left, margin.top);

            // Draw the X-axis
            context.beginPath();
            context.moveTo(0, height);
            context.lineTo(width, height);
            context.strokeStyle = 'black';
            context.stroke();

            // Draw the Y-axis
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, height);
            context.stroke();

            // Axis labels and ticks
            context.font = "12px Arial";
            context.textAlign = 'right';
            context.textBaseline = 'middle';
            y.ticks().forEach(d => {
                context.fillText(d, -10, y(d));
                context.beginPath();
                context.moveTo(-10, y(d));
                context.lineTo(0, y(d));
                context.stroke();
            });

            context.textAlign = 'center';
            context.textBaseline = 'top';
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), height + 5);
            });

            context.fillText("Year", width / 2, height + 20);

            context.restore();

            // Y-axis label
            context.save();
            context.translate(margin.left - 60, margin.top + height / 2);
            context.rotate(-Math.PI / 2);
            context.textAlign = "center";
            context.fillText("Emissions- MT-CO2", 0, 0);
            context.restore();
        }

    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});


