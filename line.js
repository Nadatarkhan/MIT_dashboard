document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const container = document.querySelector('.visual1');
    if (!container) {
        console.error("Container not found");
        return;
    }
    console.log("Container found");

    // Create a narrow left panel within the visual1 container for the "grid" icon
    const leftPanel = document.createElement('div');
    leftPanel.className = 'left-panel';
    leftPanel.style.width = '100px';  // Set the width of the left panel
    leftPanel.style.height = '100%';  // Full height of the container
    leftPanel.style.position = 'absolute';
    leftPanel.style.left = '0';
    leftPanel.style.backgroundColor = '#f4f4f4';  // Background color for visibility
    container.appendChild(leftPanel);

    // Adjust canvas width to account for the new left panel
    const dpi = window.devicePixelRatio;
    const canvasWidth = container.clientWidth - 100;  // Reduce canvas width by the width of the left panel
    const containerHeight = container.clientHeight - 220;
    const canvas = d3.select(container)
        .append("canvas")
        .attr("width", canvasWidth * dpi)
        .attr("height", containerHeight * dpi)
        .style("width", canvasWidth + "px")
        .style("height", containerHeight + "px")
        .style("position", "absolute")
        .style("left", "100px");  // Shift the canvas to the right to make space for the panel

    const context = canvas.node().getContext("2d");
    context.scale(dpi, dpi);

    const margin = {top: 30, right: 40, bottom: 50, left: 170},
        width = canvasWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    let filters = {};
    const fields = ['retrofit', 'schedules', 'lab', 'district', 'nuclear', 'deepgeo', 'ccs', 'pv', 'grid'];

    d3.csv("data/example_data.csv").then(function(data) {
        console.log("Data loaded successfully");
        const emissionsData = data.map(d => ({
            year: new Date(d.epw_year),
            emission: +d.Emissions / 1000,
            ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {})
        }));

        fields.forEach(field => {
            const targetContainer = field === 'grid' ? leftPanel : container;
            const iconContainer = document.createElement('div');
            iconContainer.className = 'icon-container';
            iconContainer.setAttribute('data-field', field);
            targetContainer.appendChild(iconContainer);

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
                label.textContent = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
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
        });

        function updatePlot() {
            const filteredData = emissionsData.filter(d =>
                Object.keys(filters).every(field =>
                    filters[field].length === 0 || filters[field].includes(d[field])
                )
            );

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            context.clearRect(0, 0, canvasWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.emission))
                .context(context);

            context.beginPath();
            line(filteredData);
            context.lineWidth = 0.2;
            context.strokeStyle = filteredData.length > 0 ? getColor(filteredData[0].field, filteredData[0].value) : 'steelblue';
            context.stroke();

            context.restore();

            drawAxis();
        }

        function getColor(field, value) {
            if (field === 'district' && ['baseline', 'partial', 'full'].includes(value)) return 'purple';
            if (field === 'nuclear' && ['baseline', 'full'].includes(value)) return 'red';
            if (field === 'deepgeo' && ['baseline', 'partial', 'full'].includes(value)) return 'green';
            return 'steelblue';
        }

        function drawAxis() {
            context.save();
            context.translate(margin.left, margin.top + height);

            context.font = "12px Arial";
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), 20);
            });

            context.fillText("Year", width / 2, 35);
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(width, 0);
            context.stroke();
            context.restore();

            context.save();
            context.translate(margin.left, margin.top);

            context.font = "12px Arial";
            y.ticks().forEach(d => {
                context.fillText(d, -50, y(d) + 3);
                context.beginPath();
                context.moveTo(-10, y(d));
                context.lineTo(0, y(d));
                context.stroke();
            });

            context.restore();

            context.save();
            context.translate(margin.left, margin.top + height / 2);
            context.rotate(-Math.PI / 2);
            context.textAlign = "center";
            context.fillText("Emissions- MT-CO2", 0, -70);
            context.restore();
        }
    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});

