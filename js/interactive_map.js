class World {
  constructor(id, data, title) {
    this.title = title;
    this.id = id;

    this.data = data.world;
    this.initSvg();

    this._tips();
    this._initProjection_world();
  }

  initSvg() {
    let div = d3.select(`#${this.id}`);
    this._getWH(div);

    this.margin = { left: 90, right: 20, top: 30, bottom: 100 };
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;

    this.svg = div
      .selectAll(".mysvg")
      .data(["mysvg"])
      .join("svg")
      .attr("class", "mysvg")
      // 1. Define internal coordinate system as [0,0] → [width,height]
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      // 2. Maintain aspect ratio, center display
      .attr("preserveAspectRatio", "xMidYMid meet")
      // 3. Outer dimensions controlled by CSS / container
      .style("width", "100%")
      .style("height", "auto");

    this._initChartArea();
  }
  
  _initChartArea() {
    this.ChartArea = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.svg
      .append("text")
      .attr("x", 20)
      .attr("y", -60)
      .attr("class", "svgtitle")
      .text("");

    this.DrawArea = this.ChartArea.append("g");
  }

  _getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }

  _tips() {
    this.tool_tip = d3
      .tip()
      .attr("class", "d3-tip")
      .offset([0, 0])
      .html((e, d) => {
        // 1. Country name: prioritize GeoJSON admin field
        let countryName;
        if (d.properties && d.properties.admin) {
          countryName = d.properties.admin;
        } else if (d.country) {
          countryName = d.country;
        } else {
          // Fallback: convert slug to human-readable name
          countryName = d.slug
            .split("_")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }

        // 2. Year: use properties.year or d.year, fallback to 2024
        const year =
          (d.properties && d.properties.year) ||
          d.year ||
          2024;
        // If average point (has d.avg but no d.year), show "Average"
        const labelYear =
          (d.avg != null && d.year == null)
            ? "Average"
            : year;

        // 3. Value: use feature.properties.value, scatter d.val, or average point d.avg
        let rawVal;
        if (d.properties && d.properties.value != null) {
          rawVal = d.properties.value;
        } else if (d.val != null) {
          rawVal = d.val;
        } else if (d.avg != null) {
          rawVal = d.avg;
        } else {
          rawVal = 0;
        }
        const val = rawVal;

        // 4. Display text: show "No data" if val is 0
        const emissionText =
          val === 0
            ? "No data"
            : d3.format(".2f")(val) + " t";

        // 5. Return HTML
        return `
          <div>${countryName}</div>
          <div>${labelYear} Arial Emission: ${emissionText}</div>
        `;
      });

    this.svg.call(this.tool_tip);
  }

  _initProjection_world() {
    const projection_world = d3.geoNaturalEarth1()
      .fitSize([this.innerW, this.innerH], this.data);
    this.data_path = d3.geoPath().projection(projection_world);
  }
}

class Map extends World {
  constructor(id, data,title) {
    super(id, data,title);
    this.initScales();
  }

  initScales() {
    this.color = d3.scaleThreshold()
      .domain([0,1e5, 1e6, 1e7, 1e8])
      .range([
      "#f0f0f0",  // Light gray (no data)
      "#e5f2ff",  // Very light blue
      "#a6d0ff",  // Light blue
      "#4a99ff",  // Medium blue
      "#0066cc",  // Dark blue
      "#003366",  // Very dark blue
      ]);

    this.x = d3
      .scaleBand()
      .domain(["0 - 100,000 t","100,000 - 1 million t","1 -10 million t", "10 -100million t" ,"above 100 million t"])
      .range([0, this.innerW]);
  }

  drawWorld() {
    this._drawWorldMap();
  }
  

  _drawWorldMap() {
    this.ChartArea.selectAll(".worldPath")
      .data(this.data.features)
      .join("path")
      .raise()
      .attr("class", (d) => `worldPath  ${d.properties.admin_slug}`)
      .attr("opacity", 1)
      .attr("d", this.data_path)
      .attr("stroke-width", 0.3)
      .attr("stroke", "white")
      .attr("fill", (d) => {
        const v = d.properties.value;
        return v != null
          ? this.color(v)
          : "#ccc";                // null/undefined 时给个灰色备用
      })
      .on("mouseover", this.tool_tip.show)
      .on("mouseout", this.tool_tip.hide);    
  }                                                              
                                                                           
  _addLegend() {
    this.legendArea = this.svg
      .selectAll(".legend")
      .data(["legend"])
      .join("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.margin.left},${0})`);

    new Legend({
      color: this.color,
      xScale: this.x,
      legend_type: "threshold",
      chartArea: this.legendArea,
      x: 0, y: -60,
      width: this.innerW,
      height: 10,
      legend_color_count: 4,
    });
  }
}

// scatter
class Scatter extends World {
  constructor(id, data, title, map) {
    super(id, data, title);  // Call parent constructor
    this.map = map;
    this.scatter_data = data.scatter_data_world;
    this.slug2admin = {};
    data.world.features.forEach(f => {
      this.slug2admin[f.properties.admin_slug] = f.properties.admin;
    });

    // Ensure tooltip initialization before other content
    this._tips();  // Explicitly call parent's _tips method
    this._initScale();
    this.initAxis();

    this.AxisX.call(d3.axisBottom(this.x).ticks(6, "~s"))
      .style("opacity", 0);

    // Ensure svg and DrawArea can receive events
    this.svg.style("pointer-events", "all");
    this.DrawArea.style("pointer-events", "all");
  }

  _initScale() {
    // 1. Copy threshold breakpoints and colors from map
    const domain = this.map.color.domain();
    const range = this.map.color.range();

    this.color = d3.scaleThreshold()
      .domain(domain)
      .range(range);

    // 2. X-axis uses same sqrt (or log) positioning, but color doesn't affect position
    const maxVal = d3.max(
      this.scatter_data,
      d => d3.max(d[1], v => v[1])
    );
    this.x = d3.scaleSqrt()
      .domain([0, maxVal])
      .range([0, this.innerW]);

    // 3. Y-axis remains unchanged
    this.y = d3.scaleBand()
      .range([0, this.innerH])
      .domain(this.scatter_data.map(d => d[0]))
      .padding(0.3);
  }

  initAxis() {
    this.AxisY = this.ChartArea.append("g");
    this.AxisX = this.ChartArea.append("g").attr(
      "transform",
      `translate(0,${this.innerH})`
    );
  }

_addLabel() {
  // y 轴标签
  this.ChartArea.append("text")
    .attr("class", "scatter-label")
    .attr("transform", `translate(${this.innerW/2},${this.innerH+30})`)
    .text("Annual Emission Amount");
  // x 轴标签
  this.ChartArea.append("text")
    .attr("class", "scatter-label")
    .attr("transform", `translate(${-125},${this.innerH/2}) rotate(270)`)
    .text("");
  // 标题
  this.svg.append("text")
    .attr("class", "scatter-label")
    .attr("x", 80).attr("y", 40)
    .text("");
}

  addLine() {
    this.line = this.DrawArea.selectAll(".line")
      .data([0])
      .join("line")
      .transition()
      .duration(2000)
      .attr("x1", this.x(1))
      .attr("x2", this.x(1))
      .attr("y1", 0)
      .attr("y2", this.innerH)
      .attr("stroke", "gray")
      .attr("class", "line");
  }

  removeLine() {
    this.DrawArea.select(".line").remove();
  }
  
  removeAxis() {
    this.AxisX.style("opacity", 1)
      .transition()
      .duration(1000)
      .style("opacity", 0);
    // .call(d3.axisBottom(this.x));

    this.AxisY.style("opacity", 1)
      .transition()
      .duration(1000)
      .style("opacity", 0);
    // .call(d3.axisLeft(this.y).tickSize(-this.innerW));
  }

  addAxis() {
    this._addLabel();

    this.AxisX
      .transition().duration(1000).style("opacity", 0.8)
      .call(
        d3.axisBottom(this.x)
          .ticks(6)               // 给点 log 刻度，"~s" 用 SI 单位
          .tickFormat(d3.format("~s"))
      );

    const axisY = d3.axisLeft(this.y)
      .tickSize(-this.innerW)
      .tickFormat(slug => this.slug2admin[slug] || slug);

    this.AxisY
      .transition().duration(1000).style("opacity", 0.8)
      .call(axisY);

    // 调整一下文本位置（可选）
    this.AxisY.selectAll(".tick text")
      .attr("dy", "-0.5em");

    this.addLine();
    this._drawAllYearPoints();
    this._drawAveragePoints();
  }  
                                                              
  _addLegend() {
    this.legendArea = this.svg
      .selectAll(".legend")
      .data(["legend"])
      .join("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.margin.left},0)`);

    // 用 map 上一模一样的 xScale（band）和 color 刻度
    const xScale = d3.scaleBand()
      .domain([
        "0 - 100,000 t",
        "100,000 - 1 million t",
        "1 - 10 million t",
        "10 - 100 million t",
        "above 100 million t"
      ])
      .range([0, this.innerW]);

    new Legend({
      color: this.color,       // threshold 刻度
      xScale: xScale,          // 离散 band
      legend_type: "threshold",
      chartArea: this.legendArea,
      x: 0, y: -60,
      width: this.innerW,
      height: 10,
      legend_color_count: this.color.range().length
    });
  }

  








    // to normal
  applyLinearScale() {
    // 1. Get old this.x (log), yScale and validSlugs
    const oldX = this.x;
    const yScale = this.y;
    const validSlugs = new Set(yScale.domain());

    // 2. Rebuild this.x as sqrt scale
    const maxVal = d3.max(this.scatter_data, d => d3.max(d[1], v=>v[1]));
    const newX = d3.scaleSqrt()
      .domain([0, maxVal])
      .range([0, this.innerW]);
    this.x = newX;

    this.AxisX
      .attr("transform", `translate(0,${this.innerH})`)
      .style("opacity", 1);
    
    // 3. Update X axis
    this.AxisX
      .transition().duration(800)
      .call(d3.axisBottom(newX).ticks(6, "~s"));

    // 4. Smoothly transition year-point / avg-point cx
    this.DrawArea.selectAll(".year-point")
      .transition().duration(800)
      .attr("cx", d => newX(d.val));
    this.DrawArea.selectAll(".avg-point")
      .transition().duration(800)
      .attr("cx", d => newX(d.avg));

    // 5. Key: Apply another flubber transition to morphed "2024 circles"
    d3.selectAll(".worldPath")
      .filter(d => validSlugs.has(d.properties.admin_slug))
      .transition().duration(800)
      .attrTween("d", function(d) {
        const startD = d3.select(this).attr("d");
        const cx = newX(d.properties.value);
        const cy = yScale(d.properties.admin_slug) + yScale.bandwidth()/2;
        return flubber.toCircle(startD, cx, cy, 5);
      });
  }


  // to log
  applyLogScale() {
    this.AxisX
      .attr("transform", `translate(0,${this.innerH})`)
      .style("opacity", 1);
    
    // 1. Find minimum positive value and maximum value
    const allVals = this.scatter_data
      .flatMap(d => d[1].map(v => v[1]))
      .filter(v => v > 0);
    const minPos = d3.min(allVals);
    const maxVal = d3.max(allVals);

    // 2. Rebuild this.x as log scale
    this.x = d3.scaleLog()
      .base(10)
      .domain([minPos, maxVal])
      .range([0, this.innerW]);

    // 3. Update X axis (keep showing original emission values)
    this.AxisX
      .transition().duration(800)
      .call(
        d3.axisBottom(this.x)
          .ticks(6)
          .tickFormat(d3.format("~s"))
      );

    // 4. Update all "year-point" and "avg-point" cx positions
    this.DrawArea.selectAll(".year-point")
      .transition().duration(800)
      .attr("cx", d => this.x(d.val));
    this.DrawArea.selectAll(".avg-point")
      .transition().duration(800)
      .attr("cx", d => this.x(d.avg));

    // Important: flubber also needs to use new this.x
    const newX = this.x;
    const yScale = this.y;
    const valid = new Set(yScale.domain());

    d3.selectAll(".worldPath")
      .filter(d => valid.has(d.properties.admin_slug))
      .transition().duration(800)
      .attrTween("d", function(d) {
        const startD = d3.select(this).attr("d");
        const cx = newX(d.properties.value);
        const cy = yScale(d.properties.admin_slug) + yScale.bandwidth()/2;
        return flubber.toCircle(startD, cx, cy, 5);
      });
  }





  _drawAllYearPoints() {
    const self = this;
    const flat = this.scatter_data.flatMap(([slug, series]) =>
      series.map(([year, val]) => ({ slug, year, val }))
    );

    // 先移除现有的点
    this.DrawArea.selectAll(".year-point").remove();

    // 创建新的点，并立即设置为可交互
    const points = this.DrawArea
      .selectAll(".year-point")
      .data(flat)
      .join("circle")
      .attr("class", "year-point")
      .attr("cx", d => this.x(d.val))
      .attr("cy", d => this.y(d.slug) + this.y.bandwidth() / 2)
      .attr("r", 5)
      .attr("fill", d => this.color(d.val))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .style("pointer-events", "all")
      .style("z-index", "20")
      .each(function(d) {
        const point = d3.select(this);
        point
          .on("mouseover", function(event) {
            event.stopPropagation();
            point
              .transition()
              .duration(200)
              .attr("r", 8)
              .attr("stroke-width", 2);
            self.tool_tip.show(event, d);
          })
          .on("mouseout", function(event) {
            event.stopPropagation();
            point
              .transition()
              .duration(200)
              .attr("r", 5)
              .attr("stroke-width", 1);
            self.tool_tip.hide(event, d);
          });
      });

    return points;
  }

  _drawAveragePoints() {
    const self = this;
    const avgData = this.scatter_data.map(([slug, series]) => {
      const validVals = series
        .map(([year, val]) => val)
        .filter(v => v > 0);
      const avg = validVals.length > 0
        ? d3.mean(validVals)
        : 0;
      return { slug, avg };
    })
    .filter(d => d.avg > 0);

    // 先移除现有的点
    this.DrawArea.selectAll(".avg-point").remove();

    // 创建新的点，并立即设置为可交互
    const avgPoints = this.DrawArea
      .selectAll(".avg-point")
      .data(avgData)
      .join("circle")
      .attr("class", "avg-point")
      .attr("cx", d => this.x(d.avg))
      .attr("cy", d => this.y(d.slug) + this.y.bandwidth() / 2)
      .attr("r", 8)
      .attr("fill", "black")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("pointer-events", "all")
      .style("z-index", "20")
      .each(function(d) {
        const point = d3.select(this);
        point
          .on("mouseover", function(event) {
            event.stopPropagation();
            point
              .transition()
              .duration(200)
              .attr("r", 12)
              .attr("stroke-width", 3);
            self.tool_tip.show(event, d);
          })
          .on("mouseout", function(event) {
            event.stopPropagation();
            point
              .transition()
              .duration(200)
              .attr("r", 8)
              .attr("stroke-width", 2);
            self.tool_tip.hide(event, d);
          });
      });

    return avgPoints;
  }

  // 添加新方法来一次性绘制所有数据点
  drawAllPoints() {
    this._drawAllYearPoints();
    this._drawAveragePoints();
    
    // 确保所有点都在最上层且可交互
    this.DrawArea
      .raise()
      .style("pointer-events", "all")
      .style("z-index", "10");

    this.DrawArea.selectAll(".year-point, .avg-point")
      .raise()
      .style("pointer-events", "all")
      .style("cursor", "pointer")
      .style("z-index", "20");

    // 确保tooltip正确绑定
    this.svg.call(this.tool_tip);
  }

  showOverlay() {
    // 方法保留但不执行任何操作
    return;
  }

  hideOverlay() {
    // 方法保留但不执行任何操作
    return;
  }







  worldPath_to_circle() {
    this._world_path_change_to_circle();
    this._addLegend();
  }

  circle_to_worldPath() {
    this._circle_change_to_world_path();
    this.removeLine();
  }


  _world_path_change_to_circle() {
    const xScale = this.x,
          yScale = this.y,
          validSlugs = new Set(yScale.domain());

    // 1. Hide all "invalid" countries
    d3.selectAll(".worldPath")
      .filter(d => !validSlugs.has(d.properties.admin_slug))
      .transition()
      .duration(300)
      .style("opacity", 0)
      .attr("pointer-events", "none");  // Also disable hover

    // 2. Morph "valid" countries
    d3.selectAll(".worldPath")
      .filter(d => validSlugs.has(d.properties.admin_slug))
      .transition()
      .duration(1000)
      .delay((d,i) => 10 + i*2)
      .style("opacity", 1)
      .attrTween("d", function(d) {
        const startD = d3.select(this).attr("d"),
              cx = xScale(d.properties.value),
              // Add bandwidth()/2 to align circle center with middle of band
              cy = yScale(d.properties.admin_slug) + yScale.bandwidth() / 2;
        return flubber.toCircle(startD, cx, cy, 5);
      });
  }


  _circle_change_to_world_path() {
    const pathFn = this.data_path;
    const validSlugs = new Set(this.y.domain());
    const duration = 1200;
    const delayPer = (d,i) => 10 + i*2;

    // First fade out and remove all year points
    this.DrawArea.selectAll(".year-point")
      .transition()
      .duration(duration / 2)
      .style("opacity", 0)
      .remove();

    this.DrawArea.selectAll(".avg-point")
      .transition()
      .duration(duration / 2)
      .style("opacity", 0)
      .remove();

    // 1. First animate countries that can morph back
    d3.selectAll(".worldPath")
      .filter(d => validSlugs.has(d.properties.admin_slug))
      .transition()
      .duration(duration)
      .delay(delayPer)
      .attrTween("d", function(d) {
        const curD = d3.select(this).attr("d");
        return flubber.interpolate(curD, pathFn(d));
      });

    // 2. After morph completes, show hidden countries
    d3.selectAll(".worldPath")
      .filter(d => !validSlugs.has(d.properties.admin_slug))
      .transition()
      .delay(duration + 10)       // Slightly after morph animation ends
      .duration(300)
      .style("opacity", 1)
      .attr("pointer-events", null);
  }






   

}

//legend
class Legend {
  constructor(config) {
    this.color = config.color;
    this.direction = config.direction;
    this.container = config.chartArea;
    this.x = config.x;
    this.y = config.y;
    this.legend_color_count = config.legend_color_count;
    this.width = config.width;
    this.height = config.height;
    this.xScale = config.xScale;
    this.legend_type = config.legend_type;
    this.config = config;
    this.init();
  }

  init() {
    this.initSvg();

    switch (this.legend_type) {
      case "threshold":
        this.addThresholdLegend();
        break;
      case "continue":
        this.addContinueLegend();
        break;
    }
  }

  initSvg() {
    this.svg = this.container
      .selectAll(".legend")
      .data(["legend"])
      .join("svg")
      .attr("class", (d) => d)
      .attr("transform", `translate(${this.x},${this.y})`)
      .attr("width", this.width);
  }

  addContinueLegend() {
    this.addGradientDef();
    this.addGradientRect();
  }

// 在 Legend 类里，替换掉原本的 addGradientDef()
addGradientDef() {
  // 1. 创建 <linearGradient>
  const grad = this.svg
    .append("defs")
    .append("linearGradient")
      .attr("id", "myGradient");

  // 2. 准备 stop 数量（比如 legend_color_count），以及 domain 范围
  const n = this.legend_color_count;
  const [d0, d1] = this.color.domain();  // e.g. [0, maxVal]

  // 3. 生成每个 stop
  d3.range(n).forEach(i => {
    const t = i / (n - 1);             // 从 0→1
    const value = d0 + t * (d1 - d0);   // 映射回你的数据域
    grad.append("stop")
      .attr("offset", (t * 100) + "%")
      .attr("stop-color", this.color(value));
  });
}



  addGradientRect() {
    this.svg

      .append("rect")
      .attr("width", this.width)
      .transition()
      .duration(2000)
      .attr("height", this.height)
      .attr("x", 0)

      .attr("y", 0)
      .attr("id", "myRect")
      .attr("fill", "url('#myGradient')");

    //label
    const legendScale = this.xScale.copy()
    .range([this.config.width - 2, 3]);

    const tickLabels = [
  "0 t",
  "100,000 t",
  "1,000,000 t",
  "10,000,000 t",
  "100,000,000 t"
];
    
  this.svg
    .append("g")
    .transition().delay(2000)
    .attr("transform", `translate(0,${this.height})`)
  .call(
    d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat((d,i) => tickLabels[i])
  );
  }

  addThresholdLegend() {
    let domain = this.color.domain();

    this.svg

      .selectAll("rect")
      .data(domain)
      .join("rect")

      .attr("x", (d, i) => (i * this.width) / domain.length)
      .attr("y", 0)

      .attr("width", this.width / domain.length)
      .attr("height", this.height)
      .attr("fill", (d) => this.color(d));

    this.svg.call(d3.axisBottom(this.xScale));
  }
}


class ScrollMorph {
  constructor(scatter, map, selector) {
    this.scatter = scatter;
    this.map = map;
    this.phase = 0;
    this.transitioning = false;
    this.lastTransitionTime = 0;

    // Listen for scroll events
    d3.select(selector).on("scroll", e => {
      const now = Date.now();
      // Ensure at least 800ms between transitions
      if (!this.transitioning && now - this.lastTransitionTime > 800) {
        window.requestAnimationFrame(() => this.handelscroll(e));
      }
    });
  }

  handelscroll(e) {
    const top = e.target.scrollTop;
    const h = e.target.scrollHeight;
    
    // Adjust trigger points
    const t1 = h * 0.15;
    const t2 = h * 0.45;
    const t3 = h * 0.65;

    // If already in scatter plot mode, ensure all points are interactive
    if (this.phase > 0 && !this.transitioning) {
      this.scatter.drawAllPoints();
    }

    if (top >= t3) {
      if (this.phase !== 3) {
        this.transitioning = true;
        this.lastTransitionTime = Date.now();
        
        if (this.phase === 0) {
          this.toScatter(() => {
            this.scatter.showOverlay();
            this.scatter.drawAllPoints();
            this.transitioning = false;
          });
        } else {
          this.scatter.showOverlay();
          this.scatter.drawAllPoints();
          this.transitioning = false;
        }
        this.phase = 3;
      }
    }
    else if (top >= t2) {
      if (this.phase !== 2) {
        this.transitioning = true;
        this.lastTransitionTime = Date.now();
        
        if (this.phase === 0) {
          this.toScatter(() => {
            this.scatter.applyLogScale();
            this.scatter.drawAllPoints();
            this.transitioning = false;
          });
        } else {
          this.scatter.applyLogScale();
          this.scatter.drawAllPoints();
          this.transitioning = false;
        }
        this.phase = 2;
      }
      this.scatter.hideOverlay();
    }
    else if (top >= t1) {
      if (this.phase !== 1) {
        this.transitioning = true;
        this.lastTransitionTime = Date.now();
        
        this.toScatter(() => {
          this.scatter.drawAllPoints();
          this.transitioning = false;
        });
        this.phase = 1;
      }
      this.scatter.hideOverlay();
    }
    else {
      if (this.phase !== 0) {
        this.transitioning = true;
        this.lastTransitionTime = Date.now();
        
        this.toWorld(() => {
          this.transitioning = false;
        });
        this.phase = 0;
      }
      this.scatter.hideOverlay();
    }
  }

  toScatter(callback) {
    // Interrupt all ongoing animations
    d3.selectAll(".worldPath").interrupt();
    
    // Ensure all map paths' events are disabled
    d3.selectAll(".worldPath")
      .style("pointer-events", "none");
    
    // Transform to scatter plot
    this.scatter.worldPath_to_circle();
    
    // Add coordinate axes
    this.scatter.addAxis();
    
    // Apply linear scale
    this.scatter.applyLinearScale();
    
    // Immediately draw and activate all points
    this.scatter.drawAllPoints();

    // Shorten delay time
    setTimeout(() => {
      // Ensure all points are interactive again
      this.scatter.drawAllPoints();
      if (callback) callback();
    }, 800);
  }

  toWorld(callback) {
    // Interrupt all ongoing animations
    d3.selectAll(".worldPath").interrupt();
    
    // Remove coordinate axes
    this.scatter.removeAxis();
    
    // Transform back to world map
    this.scatter.circle_to_worldPath();
    
    // Remove old legend
    this.scatter.svg.selectAll("g.legend").remove();
    
    // Add new map legend
    this.map._addLegend();
    
    // Remove scatter plot labels
    this.scatter.ChartArea.selectAll(".scatter-label")
      .transition().duration(600)
      .style("opacity", 0)
      .remove();
      
    // Restore map path events
    d3.selectAll(".worldPath")
      .style("pointer-events", "all");

    // Shorten delay time for faster response
    setTimeout(() => {
      if (callback) callback();
    }, 800);
  }
}















async function initData() {
  // 1. Load World map
  const world = await d3.json("./data/annual-co-emissions-from-aviation/world_with_emission.geojson");

  // Process features to add slugs and 2024 values
  world.features.forEach(feature => {
    const raw = feature.properties.admin;
    const slug = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    feature.properties.admin_slug = slug;
    feature.properties.value = feature.properties.aviation_emission_wide_C2024 ?? null;
  });

  // Generate scatter_data_world
  // Group by country, for each group create year-value pairs
  const years = d3.range(2013, 2024); // 2013…2024
  let scatter_data_world = d3.rollups(
    world.features,
    group => years.map(year => {
      // Note: property name must match JSON
      const key = `aviation_emission_wide_C${year}`;
      const v = group[0].properties[key];
      return [year, v == null ? 0 : v];
    }),
    d => d.properties.admin_slug
  );

  // Filter to 24 countries (names must match feature.properties.admin)
  const selected = new Set([
    "Netherlands", "Saudi Arabia", "Indonesia", "Qatar", "Singapore",
    "Thailand", "Mexico", "Italy", "Russia", "South Korea",
    "Brazil", "Turkey", "Canada", "Australia", "France",
    "Germany", "Spain", "India", "Oceania", "United Arab Emirates",
    "Japan", "United Kingdom", "China", "United States of America"
  ].map(raw =>
    raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  ));

  scatter_data_world = scatter_data_world
    .filter(([countryName, _]) => selected.has(countryName));

  // Sort by total emissions from high to low
  scatter_data_world.sort((a, b) => {
    const sumA = d3.sum(a[1], d => d[1]);
    const sumB = d3.sum(b[1], d => d[1]);
    return sumB - sumA;
  });

  // Return prepared data
  return {
    world,
    scatter_data_world
  };
}

async function main() {
  let data = await initData();

  // Map section remains unchanged
  let map = new Map("map", data, "I am map");
  map.drawWorld();
  map._addLegend();

  // Scatter section also remains unchanged
  let scatter = new Scatter("map", data, "I am scatter", map);
  

  // Keep auto-scroll on mouse enter if desired
  d3.select("#chartArea").on("mouseenter", (e) => {
    let navtop =
      e.target.getBoundingClientRect().top -
      d3.select(".navbar").node().getBoundingClientRect().height;
    window.scrollBy({ top: navtop, behavior: "smooth" });

    d3.select(".chart")
      .style("position", "sticky")
      .style("top", 0)
      .style("left", 0);
  });

  // Let ScrollMorph handle scroll triggers
  new ScrollMorph(scatter, map, "#chartArea");
}

main();