// ====== initData.js ======
async function initData() {
  // 1. Load World map
  const world = await d3.json("./data/world.geojson");

  // 2. Load emission data
  const emissionsRaw = await d3.csv("./data/annual-co-emissions-from-aviation/aviation_emission_wide.csv", d => ({
    country: d.Country,
    iso3: d.Code || null,
    emissions2024: d['C2024'] ? +d['C2024'] : null
  }));

  // 3. Build lookup by ISO3
  const emissionsByISO = new Map();
  emissionsRaw.forEach(d => {
    if (d.iso3) emissionsByISO.set(d.iso3, d.emissions2024);
  });

  // 4. Merge into geojson
  world.features.forEach(f => {
    const iso = f.properties.iso_a3;
    const em = emissionsByISO.get(iso);
    f.properties.em2024 = em != null ? em : null;
  });

  return { world };
}


class World {
  constructor(id, data) {
    this.id   = id;
    this.data = data.world;
    this._initSVG();
    this._initProjection();
  }

  _initSVG() {
    const div = d3.select(`#${this.id}`);
    this.width  = div.node().getBoundingClientRect().width;
    this.height = div.node().getBoundingClientRect().height;
    this.margin = { top: 60, right: 20, bottom: 40, left: 20 };
    this.innerW = this.width  - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top  - this.margin.bottom;

    this.svg = div.append("svg")
      .attr("width",  this.width)
      .attr("height", this.height);

    // map group
    this.g = this.svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  _initProjection() {
    this.projection = d3.geoNaturalEarth1()
      .fitSize([this.innerW, this.innerH], this.data);
    this.path = d3.geoPath().projection(this.projection);
  }
}



// ====== WorldMap.js ======
class WorldMap {
  constructor(id, data) {
    this.id = id;
    this.data = data.world;

    this.initSVG();
    this.initScales();
    this.drawMap();
    this.addLegend();
  }

  initSVG() {
    const div = d3.select(`#${this.id}`);
    this.width  = div.node().getBoundingClientRect().width;
    this.height = div.node().getBoundingClientRect().height;
    this.margin = { top: 60, right: 20, bottom: 40, left: 20 };

    this.innerWidth  = this.width  - this.margin.left - this.margin.right;
    this.innerHeight = this.height - this.margin.top  - this.margin.bottom;

    this.svg = div.append("svg")
      .attr("width",  this.width)
      .attr("height", this.height);

    // defs: gradient + hatch for "No data"
    const defs = this.svg.append("defs");
    defs.append("pattern")
      .attr("id", "no-data-hatch")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 6).attr("height", 6)
      .attr("patternTransform", "rotate(45)")
      .append("line")
        .attr("x1",0).attr("y1",0).attr("x2",0).attr("y2",6)
        .attr("stroke","#ccc").attr("stroke-width",2);

    // group for map
    this.g = this.svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    // projection & path
    this.projection = d3.geoNaturalEarth1()
      .fitSize([this.innerWidth, this.innerHeight], this.data);
    this.path = d3.geoPath().projection(this.projection);
  }

  initScales() {
    // 离散色阶
    this.thresholds = [0, 1e5, 1e6, 1e7, 1e8];
    this.colors = [
      "#f7f7f0",  // 0–100k
      "#fde0ae",  // 100k–1M
      "#fbb185",  // 1M–10M
      "#fb6a4a",  // 10M–100M
      "#cb181d"   // >100M
    ];
    this.colorScale = d3.scaleThreshold()
      .domain(this.thresholds.slice(1))  // [100k,1M,10M,100M]
      .range(this.colors);
  }


  drawMap() {
    this.g.selectAll("path")
      .data(this.data.features)
      .join("path")
      .attr("d", this.path)
      .attr("fill", d => {
        const v = d.properties.em2024;
        return v == null
          ? "url(#no-data-hatch)"
          : this.colorScale(v);
      })
      .attr("stroke","#999")
      .attr("stroke-width",0.4);
  }

  addLegend() {
    const legendW = 1000;
    const legendH = 12;
    const arrowW  = 20;
    const x0 = (this.width - legendW) / 2;
    const y0 = this.margin.top - 30;

    const legendG = this.svg.append("g")
      .attr("transform", `translate(${x0},${y0})`);

    // 1) “No data” 栏
    legendG.append("rect")
      .attr("width", 20)
      .attr("height", legendH)
      .attr("fill", "url(#no-data-hatch)")
      .attr("stroke", "#999");
    legendG.append("text")
      .attr("x", 24)
      .attr("y", legendH / 2)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .text("No data");

    // 离散区间定义
    const ticks = [
      { v: 0,       label: "0 t" },
      { v: 1e5,     label: "100,000 t" },
      { v: 1e6,     label: "1 million t" },
      { v: 1e7,     label: "10 million t" },
      { v: 1e8,     label: "100 million t" }
    ];

    // 2) 色块区间（不含“无数据”），宽度平分
    //    100px 留给 “No data” 和间隔，arrowW 为箭头宽
    const blockW = (legendW - 100 - arrowW) / this.colors.length;

    this.colors.forEach((col, i) => {
      const x = 100 + i * blockW;

      // 色块
      legendG.append("rect")
        .attr("x", x)
        .attr("y", 0)
        .attr("width", blockW)
        .attr("height", legendH)
        .attr("fill", col)
        .attr("stroke", "#999");

      // 标签：放在每个块正下方，居中对齐
      legendG.append("text")
        .attr("x", x + blockW / 2)
        .attr("y", legendH + 14)   // 比色块低 14px
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(ticks[i].label);
    });

    // 3) 最后一个区间后面的箭头（代表 “及以上”）
    legendG.append("path")
      .attr("d", `
        M ${legendW - arrowW}, 0
        L ${legendW}, ${legendH / 2}
        L ${legendW - arrowW}, ${legendH}
        Z
      `)
      .attr("fill", this.colors[this.colors.length - 1])
      .attr("stroke", "#999");

    // 箭头下的 “100 million t+” 标签
    legendG.append("text")
      .attr("x", legendW - arrowW / 2)
      .attr("y", legendH + 14)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(ticks[ticks.length - 1].label + "+");
  }

}

async function main() {
  const data = await initData();
  new WorldMap("map", data);
}

main();