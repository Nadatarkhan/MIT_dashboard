document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const container = document.querySelector('.icon-and-graph');

    if (!container) {
        console.error("Container not found");
        return;
    }
    console.log("Container found");

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

    d3.csv("data/example_data.csv").then(function(data) {
        console.log("Data loaded successfully");
        const emissionsData = data.map(d => ({
            year: new Date(d.epw_year),
            emission: +d.Emissions / 1000,
            ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {})
        }));

        fields.forEach(field => {
            const iconContainer = document.querySelector(`.icon-container${field === 'grid' ? '-2' : ''}[data-field="${field}"]`);
            if (iconContainer) {
                const form = document.createElement('form');
                form.style.display = 'flex';
                form.style.flexDirection = 'column';

                const options = field === 'grid' ? ['bau', 'cheap_ng', 'decarbonization'] : ['baseline', 'partial', 'full'];
                options.forEach(value => {
                    const checkboxContainer = document.createElement('div');
                    checkboxContainer.style.display = 'flex';
                    checkboxContainer.style.alignItems = 'center';

                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.id = `${field}-${value}`;
                    input.name = `${field}Filter`;
                    input.value = value;
                    input.style.transform = 'scale(0.75)';
                    input.style.marginRight = '5px';

                    const label = document.createElement('label');
                    label.htmlFor = `${field}-${value}`;
                    label.textContent = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
                    label.style.fontSize = '12px';

                    checkboxContainer.appendChild(input);
                    checkboxContainer.appendChild(label);
                    form.appendChild(checkboxContainer);

                    input.addEventListener('change', function() {
                        updateFilters(field, value, this.checked);
                    });
                });
                iconContainer.appendChild(form);
            }
        });

        const baselineButton = document.getElementById('baselineButton');
        baselineButton.addEventListener('click', function() {
            const isActive = this.textContent === "Baseline";
            this.classList.toggle('active', isActive);
            this.textContent = isActive ? "Remove Baseline" : "Baseline";
            document.querySelectorAll('input[name$="Filter"][value="baseline"]').forEach(checkbox => {
                checkbox.checked = isActive;
                const field = checkbox.getAttribute('data-field');
                updateFilters(field, 'baseline', isActive);
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
            const filteredData = emissionsData.filter(d => fields.every(field => !filters[field] || filters[field].includes(d[field])));
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

            context.beginPath();
            context.moveTo(0, height);
            context.lineTo(width, height);
            context.strokeStyle = 'black';
            context.stroke();

            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, height);
            context.stroke();

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
