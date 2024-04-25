document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const container = document.querySelector('.visual1');

    if (!container) {
        console.error("Container not found");
        return;
    }
    console.log("Container found");

    const dpi = window.devicePixelRatio;
    const containerWidth = container.clientWidth - 100;
    const containerHeight = container.clientHeight - 230;
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
            emission: +d.Emissions,
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

        function updatePlot() {
            const activeFilters = Object.keys(filters).filter(field => filters[field].length > 0);
            if (activeFilters.length === 0) {
                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                return;
            }

            console.log("Updating plot with current filters:", filters);
            const filteredData = emissionsData.filter(d => {
                return activeFilters.every(field =>
                    filters[field].includes(d[field])
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

            filteredData.forEach(data => {
                context.beginPath();
                line([data]);
                context.lineWidth = 0.6;
                context.strokeStyle = getColor(data);
                context.stroke();
            });

            context.restore();

            drawAxis();
        }

        function getColor(data) {
            if (data['district'] && ['baseline', 'partial', 'full'].includes(data['district'])) return 'purple';
            if (data['nuclear'] && ['baseline', 'full'].includes(data['nuclear'])) return 'red';
            if (data['deepgeo'] && ['baseline', 'partial', 'full'].includes(data['deepgeo'])) return 'green';
            return 'steelblue';
        }

        function drawAxis() {
            context.save();
            context.translate(margin.left, height + margin.top);
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), 10);
            });
            context.fillText("Year", width / 2, 40);
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(width, 0);
            context.stroke();
            context.restore();

            context.save();
            context.translate(margin.left, margin.top);
            y.ticks().forEach(d => {
                context.fillText(d, -50, y(d));
            });
            context.fillText("Emissions", -100, height / 2);
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







