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

    // 恢复响应式SVG尺寸，使交互正常工作
  this.svg = div
    .selectAll(".mysvg")
    .data(["mysvg"])
    .join("svg")
      .attr("class", "mysvg")
        // 定义内部坐标系为 [0,0] → [width,height]
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
        // 保持等比缩放，居中显示
      .attr("preserveAspectRatio", "xMidYMid meet")
        // 恢复响应式尺寸
      .style("width", "100%")
        .style("height", "auto")
        .style("max-width", "100%")
        .style("margin", "0 auto")
        .style("display", "block");

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
        // 1. 国家名称：优先用 GeoJSON 的 admin 字段
        let countryName;
        if (d.properties && d.properties.admin) {
          countryName = d.properties.admin;
        } else if (d.country) {
          countryName = d.country;
        } else {
          // 回退：把 slug 反转为人类可读名
          countryName = d.slug
            .split("_")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }

        // 2. 年份：feature 上的 properties.year 或 d.year，否则回退成 2024
        const year =
          (d.properties && d.properties.year) ||
          d.year ||
          2024;
        // 如果是平均点（有 d.avg 且无 d.year），显示 "Average"
        const labelYear =
          (d.avg != null && d.year == null)
            ? "Average"
            : year;

        // 3. 值：feature.properties.value、散点 d.val，或平均点用 d.avg
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

        // 4. 显示文字：val 为 0 显示 "No data"
        const emissionText =
          val === 0
            ? "No data"
            : d3.format(".2f")(val) + " t";

        // 5. 返回 HTML
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
      "#f0f0f0",  // 灰白色（无数据）
      "#e1ecf7",  // 极浅蓝色
      "#93c4f5",  // 浅蓝色
      "#4c8ed4",  // 中蓝色
      "#1e54a8",  // 深蓝色
      "#072656",  // 极深蓝色
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
    super(id, data,title);
    this.map = map;
    this.scatter_data = data.scatter_data_world;
    this.slug2admin = {};
    data.world.features.forEach(f => {
      this.slug2admin[f.properties.admin_slug] = f.properties.admin;
    });
    this._initScale();
    this.initAxis();

    this.AxisX.call(d3.axisBottom(this.x).ticks(6, "~s"))
    .style("opacity", 0); 
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


  _initScale() {
    // 1. 阈值断点和颜色，直接从 map 拷贝
    const domain = this.map.color.domain();
    const range  = this.map.color.range();

    this.color = d3.scaleThreshold()
      .domain(domain)
      .range(range);

    // 2. X 轴用同样的 sqrt（或 log）定位，但配色不影响位置
    const maxVal = d3.max(
      this.scatter_data,
      d => d3.max(d[1], v => v[1])
    );
    this.x = d3.scaleSqrt()
      .domain([0, maxVal])
      .range([0, this.innerW]);

    // 3. Y 轴不变
    this.y = d3.scaleBand()
      .range([0, this.innerH])
      .domain(this.scatter_data.map(d => d[0]))
      .padding(0.3);
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
    // —— 1. 先拿旧的 this.x（log）、yScale 和 validSlugs
    const oldX = this.x;
    const yScale = this.y;
    const validSlugs = new Set(yScale.domain());

    // —— 2. 重建 this.x 为 √ 刻度
    const maxVal = d3.max(this.scatter_data, d => d3.max(d[1], v=>v[1]));
    const newX = d3.scaleSqrt()
      .domain([0, maxVal])
      .range([0, this.innerW]);
    this.x = newX;

    this.AxisX
      .attr("transform", `translate(0,${this.innerH})`)
      .style("opacity", 1);
    // —— 3. 更新 X 轴
    this.AxisX
      .transition().duration(800)
      .call(d3.axisBottom(newX).ticks(6, "~s"));

    // —— 4. 平滑过渡 year-point / avg-point 的 cx
    this.DrawArea.selectAll(".year-point")
      .transition().duration(800)
      .attr("cx", d => newX(d.val));
    this.DrawArea.selectAll(".avg-point")
      .transition().duration(800)
      .attr("cx", d => newX(d.avg));

    // —— 5. **关键**：对 morph 出来的 "2024 圆" 再来一次 flubber 过渡
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
    // 1. 找到最小正值和最大值
    const allVals = this.scatter_data
      .flatMap(d => d[1].map(v => v[1]))
      .filter(v => v > 0);
    const minPos = d3.min(allVals);
    const maxVal = d3.max(allVals);

    // 2. 重建 this.x 为对数刻度
    this.x = d3.scaleLog()
      .base(10)
      .domain([minPos, maxVal])
      .range([0, this.innerW]);

    // 3. 更新 X 轴（保持显示原始排放量）
    this.AxisX
      .transition().duration(800)
      .call(
        d3.axisBottom(this.x)
          .ticks(6)
          .tickFormat(d3.format("~s"))
      );

    // 4. 更新所有 "year-point" 和 "avg-point" 的 cx
    this.DrawArea.selectAll(".year-point")
      .transition().duration(800)
      .attr("cx", d => this.x(d.val));
    this.DrawArea.selectAll(".avg-point")
      .transition().duration(800)
      .attr("cx", d => this.x(d.avg));

    // —— 重点：flubber 也要用新的 this.x —— 
    const newX   = this.x;
    const yScale = this.y;
    const valid  = new Set(yScale.domain());

    d3.selectAll(".worldPath")
      .filter(d => valid.has(d.properties.admin_slug))
      .transition().duration(800)
      .attrTween("d", function(d) {
        const startD = d3.select(this).attr("d");
        const cx     = newX(d.properties.value);
        const cy     = yScale(d.properties.admin_slug) + yScale.bandwidth()/2;
        return flubber.toCircle(startD, cx, cy, 5);
      });
  }





  _drawAveragePoints() {
    // 1. 计算每个国家的平均值，先过滤掉所有 val===0 的"无数据"点
    const avgData = this.scatter_data.map(([slug, series]) => {
      // 提取所有数值并剔除 0
      const validVals = series
        .map(([year, val]) => val)
        .filter(v => v > 0);
      // 如果没有任何有效数据，就让 avg 为 0（或你也可以让它为 null/undefined）
      const avg = validVals.length > 0
        ? d3.mean(validVals)
        : 0;
      return { slug, avg };
    })
    // 如果你不想为那些 avg===0 的国家画点，可以再过滤一遍
    .filter(d => d.avg > 0);

    // 2. 绘制平均值点
    this.DrawArea
      .selectAll(".avg-point")
      .data(avgData, d => d.slug)
      .join("circle")
        .attr("class", "avg-point")
        .attr("cx", d => this.x(d.avg))
        .attr("cy", d => this.y(d.slug) + this.y.bandwidth() / 2)
        .attr("r", 6)
        .attr("fill", "black")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
      .on("mouseover", this.tool_tip.show)
      .on("mouseout", this.tool_tip.hide);
  }


  _drawAllYearPoints() {
    // 1. 把 [slug, [[year,val],…]] 拍平成 {slug, year, val} 的数组
    const flat = this.scatter_data.flatMap(([slug, series]) =>
      series.map(([year, val]) => ({ slug, year, val }))
    );

    // 2. 绑定到 circle
    this.DrawArea
      .selectAll(".year-point")
      .data(flat, d => d.slug + "-" + d.year)
      .join("circle")
        .attr("class", "year-point")
        .attr("cx", d => this.x(d.val))
        .attr("cy", d => this.y(d.slug) + this.y.bandwidth() / 2)
        .attr("r", 3)
        .attr("fill", d => this.color(d.val))
      .on("mouseover", this.tool_tip.show)
      .on("mouseout", this.tool_tip.hide);
  }



// Scatter 类里，替换掉原来的 showOverlay()：
  showOverlay() {
    // 1. 定义要遮罩的国家 slug 以及对应的"由深到浅"色值数组
    const targets = [
      "united_states_of_america",
      "brazil",
      "canada",
      "mexico",
      "germany",
      "australia",
      "china",
      "united_kingdom",
      "spain"
    ];
    const colors = [
      "#072656",     // 极深蓝色
      "#0d3672",
      "#154491",
      "#1e54a8",
      "#306cbd",
      "#4c8ed4",
      "#70abe3",
      "#93c4f5",
      "#e1ecf7"      // 极浅蓝色
    ];

    // 2. 过滤出 y 轴上存在的那些 slug，并组装成 { slug, color } 的对象数组
    const data = targets
      .map((slug, i) => ({ slug, color: colors[i] }))
      .filter(d => this.y.domain().includes(d.slug));

    // 3. 绑定数据并绘制/更新矩形
    this.DrawArea
      .selectAll(".overlay")
      .data(data, d => d.slug)
      .join(
        enter => enter.append("rect")
          .attr("class", "overlay")
          .attr("x", 0)
          .attr("y", d => this.y(d.slug))
          .attr("width", this.innerW)
          .attr("height", this.y.bandwidth())
          .attr("fill", d => d.color)
          .attr("opacity", 0)
          .lower()
          .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr("opacity", 0.5),
        update => update
          .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr("fill", d => d.color)
            .attr("y",   d => this.y(d.slug))
            .attr("opacity", 0.5),
        exit => exit
          .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr("opacity", 0)
          .remove()
      );
  }

  hideOverlay() {
    this.DrawArea
      .selectAll(".overlay")
      .transition()                     // 直接对现有 rect 淡出
        .duration(200)
        .ease(d3.easeCubicInOut)
        .attr("opacity", 0)
      .remove();
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
    const xScale    = this.x,
          yScale    = this.y,
          validSlugs = new Set(yScale.domain());

    // 1. 隐藏掉所有 "无效" 国家
    d3.selectAll(".worldPath")
      .filter(d => !validSlugs.has(d.properties.admin_slug))
      .transition()
      .duration(300)
      .style("opacity", 0)
      .attr("pointer-events", "none");  // 也一起禁用 hover

    // 2. 对 "有效" 国家 做 morph
    d3.selectAll(".worldPath")
      .filter(d => validSlugs.has(d.properties.admin_slug))
      .transition()
      .duration(1000)
      .delay((d,i) => 10 + i*2)
      .style("opacity", 1)
      .attrTween("d", function(d) {
        const startD = d3.select(this).attr("d"),
              cx     = xScale(d.properties.value),
              // 加上 bandwidth()/2，圆心就对到图形中线
              cy     = yScale(d.properties.admin_slug) + yScale.bandwidth() / 2;
        return flubber.toCircle(startD, cx, cy, 5);
      });

  }


  _circle_change_to_world_path() {
    const pathFn    = this.data_path;
    const validSlugs = new Set(this.y.domain());
    const duration  = 1200;
    const delayPer  = (d,i) => 10 + i*2;

      // —— 新增：把所有年的散点先淡出并删掉 —— 
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

    // 1. 先把能 morph 回去的国家做动画
    d3.selectAll(".worldPath")
      .filter(d => validSlugs.has(d.properties.admin_slug))
      .transition()
      .duration(duration)
      .delay(delayPer)
      .attrTween("d", function(d) {
        const curD = d3.select(this).attr("d");
        return flubber.interpolate(curD, pathFn(d));
      })
      // （可选）在动画最后再做下一步
      .on("end", function(d, i, nodes) {
        // 只有最后一个结束时触发一次，或者直接用独立 transition
      });

    // 2. 等 morph 完成后再把隐藏的国家放出来
    d3.selectAll(".worldPath")
      .filter(d => !validSlugs.has(d.properties.admin_slug))
      .transition()
      .delay(duration + 10)       // 稍微晚于 morph 动画结束
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
    this.map     = map;
    this.phase   = 0;  // 0=world,1=linear,2=log,3=overlay

    d3.select(selector).on("scroll", e =>
      window.requestAnimationFrame(() => this.handelscroll(e))
    );
  }

  handelscroll(e) {
    const top = e.target.scrollTop;
    const h   = e.target.scrollHeight;
    const t1  = h * 0.25;  // 25%
    const t2  = h * 0.50;  // 50%
    const t3  = h * 0.75;  // 75%

    if (top >= t3) {
      // 4) ≥75% 显示遮罩
      if (this.phase !== 3) {
        // 确保先有对数散点
        if (this.phase < 2) {
          if (this.phase === 0) this.toScatter();
          this.scatter.applyLogScale();
        }
        this.phase = 3;
        this.scatter.showOverlay();
      }
    }
    else if (top >= t2) {
      // 3) 50%–75% → 对数散点
      if (this.phase !== 2) {
        if (this.phase === 0) this.toScatter();
        this.phase = 2;
        this.scatter.applyLogScale();
      }
      this.scatter.hideOverlay();

    }
    else if (top >= t1) {
      // 2) 25%–50% → 线性散点
      if (this.phase !== 1) {
        this.phase = 1;
        this.toScatter();
      }
      this.scatter.hideOverlay();

    }
    else {
      // 1) <25% → 世界图
      if (this.phase !== 0) {
        this.phase = 0;
        this.toWorld();
      }
      this.scatter.hideOverlay();
    }
  }

  toScatter() {
    d3.selectAll(".worldPath").interrupt();
    this.scatter.worldPath_to_circle();
    this.scatter.addAxis();
    this.scatter.applyLinearScale();
  }

  toWorld() {
    d3.selectAll(".worldPath").interrupt();
    this.scatter.removeAxis();
    this.scatter.circle_to_worldPath();
    this.scatter.svg.selectAll("g.legend").remove();
    this.map._addLegend();

    this.scatter.ChartArea.selectAll(".scatter-label")
      .transition().duration(600)
      .style("opacity", 0)
      .remove();
  }
}















async function initData() {
  // 1. Load World map
  const world = await d3.json("./data/annual-co-emissions-from-aviation/world_with_emission.geojson");

  world.features.forEach(feature => {
      const raw = feature.properties.admin;
      const slug = raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      feature.properties.admin_slug = slug;
      feature.properties.value = feature.properties.aviation_emission_wide_C2024 ?? null;
    });

  // 3. 生成 scatter_data_world
  //    按国家分组，每组里按年份取值，拼成 [year, value] 数对数组
  const years = d3.range(2013, 2024); // 2013…2024
  let scatter_data_world = d3.rollups(
    world.features,
    group => years.map(year => {
      // 注意属性名要和 JSON 里一致
      const key = `aviation_emission_wide_C${year}`;
      const v   = group[0].properties[key];
      return [year, v == null ? 0 : v];
    }),
    d => d.properties.admin_slug

  );

  // **Filter 出 24 個國家**（名稱要跟 feature.properties.admin 一致）
  const selected = new Set([
    "Netherlands","Saudi Arabia","Indonesia","Qatar","Singapore",
    "Thailand","Mexico","Italy","Russia","South Korea",
    "Brazil","Turkey","Canada","Australia","France",
    "Germany","Spain","India","Oceania","United Arab Emirates",
    "Japan","United Kingdom","China","United States of America"
  ].map(raw =>
    raw.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")
  ));

  scatter_data_world = scatter_data_world
    .filter(([countryName, _]) => selected.has(countryName));

  

  // 4. 按总排放量从高到低排序
  scatter_data_world.sort((a, b) => {
    const sumA = d3.sum(a[1], d => d[1]);
    const sumB = d3.sum(b[1], d => d[1]);
    return sumB - sumA;
  });

  // 5. 返回准备好的数据
  return {
    world,
    scatter_data_world
  };
}



async function main() {
  let data = await initData();

  // 地图部分保持不变
  let map = new Map("map", data, "I am map");
  map.drawWorld();
  map._addLegend();

  // 散点部分也保持不变
  let scatter = new Scatter("map", data,"I am scatter", map);
  

  // 如果你还想保留鼠标进入自动滚动效果，这段可以留着：
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

  // —— 新增：让 ScrollMorph 接管滚动触发
  new ScrollMorph(scatter, map, "#chartArea");
}















main();
