const sectorColors = {
  Transportation: "#FFA500", // 橘色
  Energy: "#1f77b4",         // 藍色
  Industry: "#2ca02c",       // 綠色
  Agriculture: "#d62728",    // 紅色
  Waste: "#9467bd",          // 紫色
  Other: "#8c564b"           // 咖啡色
};









function drawPieChart(data) {
  const container = d3.select("#pieChart");
  const w = parseInt(container.style("width"));
  const h = parseInt(container.style("height"));
  const r = Math.min(w, h) / 2;

  // 1. 创建 tooltip
  const tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([0, 0])
    .html(d => `
      <strong>${d.data.Sector}</strong><br/>
      Emission: ${d3.format(",")(d.data.Emission)}
    `);

  // 2. 画饼图
  const svg = container.append("svg")
      .attr("width", w)
      .attr("height", h)
    .append("g")
      .attr("transform", `translate(${w/2},${h/2})`);

  // 3. 调用 tip
  svg.call(tip);

  const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(data.map(d => d.Sector));

  const pie = d3.pie()
    .value(d => d.Emission)
    .sort(null);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(r - 10);

  const slices = svg.selectAll("path.slice")
    .data(pie(data))
    .enter().append("path")
      .attr("class", "slice")
      .attr("d", arc)
      .attr("fill", d => color(d.data.Sector))
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);

  // 4. Legend（保持不变）
  const legendG = container.append("svg")
      .attr("width", 120)
      .attr("height", data.length * 20 + 10)
      .style("position", "absolute")
      .style("top", "0px")
      .style("left", `${w + 10}px`)
    .append("g")
      .attr("transform", `translate(0,10)`);

  data.forEach((d, i) => {
    const g = legendG.append("g")
      .attr("transform", `translate(0,${i * 20})`);
    g.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(d.Sector));
    g.append("text")
      .attr("x", 16)
      .attr("y", 10)
      .text(d.Sector)
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
  });
}


function drawAreaChart(data) {
  // 1. 取得容器尺寸及设定 margins
  const container = d3.select("#areaChart");
  const width  = parseInt(container.style("width"));
  const height = parseInt(container.style("height"));
  const margin = { top: 40, right: 80, bottom: 60, left: 50 };
  const innerW = width  - margin.left - margin.right;
  const innerH = height - margin.top  - margin.bottom;

  // 2. 建立 SVG 与主分组
  const svg = container.append("svg")
      .attr("width",  width)
      .attr("height", height)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // 3. 从第一行动态拿出所有 sector 列名（排除 year）
  const rawKeys = Object.keys(data[0]).filter(k => k !== "year");

  // 4. 解析年份并把字符串转成数值
  const parseYear = d3.timeParse("%Y");
  data.forEach(d => {
    d.year = parseYear(d.year);
    rawKeys.forEach(k => {
      d[k] = +d[k];
    });
  });

  // 5. 构建 x（时间）与 y（总和）比例尺
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.year))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([
      0,
      d3.max(data, d => d3.sum(rawKeys, k => d[k]))
    ]).nice()
    .range([innerH, 0]);

  // 6. 颜色比例尺：每个 sector 分配一种颜色
  const color = d3.scaleOrdinal()
    .domain(rawKeys)
    .range(d3.schemeCategory10);

  // 7. 生成堆叠数据
  const stack = d3.stack().keys(rawKeys);
  const series = stack(data);

  // 8. area 生成器
  const area = d3.area()
    .x(d => x(d.data.year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  // 9. 绘制每一层
  svg.selectAll("path.layer")
    .data(series)
    .enter().append("path")
      .attr("class", "layer")
      .attr("d", area)
      .attr("fill", d => color(d.key))
      .attr("opacity", 0.8);

  // 10. 添加 x 轴
  svg.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.timeFormat("%Y")))
    .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

  // 11. 添加 y 轴
  svg.append("g")
      .call(d3.axisLeft(y));
}




Promise.all([
  d3.csv("./data/historical_emissions/ghg_sector_2022.csv"),
  d3.csv("./data/historical_emissions/ghg_time_series.csv")
]).then(([sectorData, timeSeriesRaw]) => {
  // 饼图数据映射
  const pieData = sectorData.map(d => ({
    Sector: d.sector,
    Emission: +d.value
  }));
  drawPieChart(pieData);

  // 堆叠面积图直接用原始 timeSeriesRaw
  drawAreaChart(timeSeriesRaw);
})
.catch(err => console.error("数据加载或绘图出错：", err));