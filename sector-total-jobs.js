const sectorLineChart = d3.select("#sectorLineChart");
    const sectorWidth = sectorLineChart.attr("width");
    const sectorHight = sectorLineChart.attr("height");
    const sectorMargin = {top: 10, right: 10, bottom: 50, left: 50};
    const chartWidth = sectorWidth - sectorMargin.left - sectorMargin.right;
    const chartHeight = sectorHight - sectorMargin.top - sectorMargin.bottom;

    let annotations = sectorLineChart.append("g").attr("id","annotations");
    let chartArea = sectorLineChart.append("g").attr("id","points")
                    .attr("transform",`translate(${sectorMargin.left},${sectorMargin.top})`);






getData();

