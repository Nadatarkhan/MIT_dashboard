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
    const containerHeight = container.clientHeight - 220;
    const canvas = d3.select(container)
        .append("canvas")
        .attr("width", containerWidth * dpi)
        .attr("height", containerHeight * dpi)
        .style("width", containerWidth + "px")
        .style("height", containerHeight + "px");
    const context = canvas.node().getContext("2d");
    context.scale(dpi, dpi);

    const margin = {top: 40, right: 40, bottom: 60, left: 170},
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
            ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {})
        }));

        updatePlot(); // Call to initial plot update
        drawMedianLine(emissionsData); // Additional call to draw the median line

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
                        drawMedianLine(emissionsData); // Redraw median line after updating plot
                    });
                });
                iconContainer.appendChild(form);
            } else {
                console.log(`${field} icon container not found`);
            }
        });
    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });

    function drawMedianLine(data) {
        const groupedData = d3.group(data, d => d.year.getFullYear());
        const medianData = Array.from(groupedData, ([year, values]) => ({
            year: new Date(year, 0, 1),
            emission: d3.median(values, v => v.emission)
        }));

        x.domain(d3.extent(medianData, d => d.year));
        y.domain([0, d3.max(medianData, d => d.emission)]);

        context.save();
        context.translate(margin.left, margin.top);
        context.beginPath();
        const medianLine = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.emission))
            .context(context);
        context.setLineDash([5, 5]); // Set dashed line style
        context.strokeStyle = 'red'; // Set line color to red for visibility
        context.lineWidth = 1.5; // Thicker line for the median
        medianLine(medianData);
        context.stroke();
        context.restore();
    }
});
