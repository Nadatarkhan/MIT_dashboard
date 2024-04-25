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

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
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

        function drawAxis() {
            context.save();
            context.translate(margin.left, height + margin.top);
            context.font = "12px Arial";
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), 20);
            });
            context.fillText("Year", width / 2, 40);
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(width, 0);
            context.stroke();
            context.restore();

            context.save();
            context.translate(margin.left, margin.top);
            context.font = "12px Arial";
            y.ticks().forEach(d => {
                context.fillText(d, -70, y(d));
            });
            context.fillText("Emissions- MTCO2", -120, height / 2);
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, -height);
            context.stroke();
            context.restore();
        }
    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});


