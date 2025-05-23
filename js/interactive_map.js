// 在文件开头添加一个自定义tooltip实现
function createCustomTooltip() {
  // 先检查并移除可能存在的旧tooltip
  d3.select("body").selectAll(".d3-tip.custom-tooltip").remove();
  
  // 创建一个简单的tooltip div - 增加更高的z-index和更强的视觉效果
  const tooltipDiv = d3.select("body").append("div")
    .attr("class", "d3-tip custom-tooltip")
    .style("position", "fixed") // 使用fixed而非absolute定位，避免滚动问题
    .style("z-index", "99999") // 极高的z-index
    .style("visibility", "hidden")
    .style("opacity", "0")
    .style("background", "rgba(26, 42, 67, 0.95)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("padding", "12px")
    .style("pointer-events", "none")
    .style("font-family", "'Montserrat', sans-serif")
    .style("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.5)") // 更明显的阴影
    .style("min-width", "200px") 
    .style("border", "2px solid #38bdf8") // 更明显的边框
    .style("transform", "translateZ(0)") // 强制硬件加速
    .style("max-width", "300px") // 限制最大宽度
    .style("-webkit-backdrop-filter", "blur(3px)") // 模糊背景效果
    .style("backdrop-filter", "blur(3px)");
  
  console.log("创建了新的tooltip元素");
  
  // 返回一个拥有类似d3-tip API的对象
  return {
    // 显示tooltip
    show: function(event, d) {
      console.log("调用tooltip.show方法:", event ? {pageX: event.pageX, pageY: event.pageY} : "无事件");
      
      // 如果有内容，更新它
      if (this._content) {
        const content = this._content(event, d);
        console.log("生成的tooltip HTML:", content);
        tooltipDiv.html(content);
      }
      
      // 确保有event才计算位置
      let posX = 20;
      let posY = 20;
      
      if (event) {
        // 使用pageX/pageY而不是clientX/clientY
        posX = event.pageX + 15;
        posY = event.pageY - 28;
        
        // 避免tooltip超出视口
        const tooltipWidth = tooltipDiv.node().getBoundingClientRect().width;
        const tooltipHeight = tooltipDiv.node().getBoundingClientRect().height;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (posX + tooltipWidth > windowWidth) {
          posX = windowWidth - tooltipWidth - 10;
        }
        
        if (posY + tooltipHeight > windowHeight) {
          posY = event.pageY - tooltipHeight - 10;
        }
        
        if (posY < 0) posY = 10;
      }
      
      console.log("设置tooltip位置:", {posX, posY});
      
      // 显示tooltip - 使用强制显示
      tooltipDiv
        .style("left", posX + "px")
        .style("top", posY + "px")
        .style("visibility", "visible")
        .style("display", "block") // 确保显示
        .transition()
        .duration(100) // 加速显示动画
        .style("opacity", "1");
        
      // 移除其他可能干扰的tooltips
      d3.selectAll(".d3-tip:not(.custom-tooltip)").style("display", "none");
      
      // 添加高亮效果
      setTimeout(() => {
        tooltipDiv
          .style("transform", "scale(1.02)")
          .transition()
          .duration(100)
          .style("transform", "scale(1)");
      }, 100);
        
      return this;
    },
    
    // 隐藏tooltip
    hide: function() {
      console.log("调用tooltip.hide方法");
      tooltipDiv
        .transition()
        .duration(200)
        .style("opacity", "0")
        .on("end", function() {
          d3.select(this)
            .style("visibility", "hidden")
            .style("display", "none");
        });
      return this;
    },
    
    // 设置html内容
    html: function(contentFn) {
      if (!arguments.length) return this._content;
      this._content = contentFn;
      return this;
    },
    
    // 兼容d3.tip()的API
    offset: function() { return this; },
    direction: function() { return this; },
    attr: function() { return this; },
    style: function() { return this; },
    
    // 空call方法，兼容d3.tip()的API
    call: function() { return this; },
    
    // 添加一个静态方法清除所有tooltips
    hideAll: function() {
      d3.selectAll(".d3-tip.custom-tooltip")
        .style("visibility", "hidden")
        .style("opacity", "0")
        .style("display", "none");
      return this;
    }
  };
}

// 创建一个全局函数用于清除所有tooltips
window.hideAllTooltips = function() {
  d3.selectAll(".d3-tip.custom-tooltip")
    .style("visibility", "hidden")
    .style("opacity", "0")
    .style("display", "none");
};

// 添加在窗口大小变化时隐藏所有提示框的处理
window.addEventListener("resize", function() {
  window.hideAllTooltips();
});

// 数据安全检查工具函数
function safeDataValue(value, defaultValue = 0) {
  // 检查值是否为数字且有效
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }
  return value;
}

// 安全的对数比例尺函数
function safeLogScale(value, scale, minPositive) {
  // 对于零或负值，返回最小正值的刻度位置
  if (value <= 0 || isNaN(value)) {
    return scale(minPositive) / 2; // 位于最小值的一半位置
  }
  return scale(value);
}

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

    // 使用适当的边距，使图表与第一张图一致
    this.margin = { left: 90, right: 20, top: 80, bottom: 100 };
    // 使用正常尺寸
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;

    // 恢复响应式SVG尺寸，使交互正常工作
    this.svg = div
      .selectAll(".mysvg")
      .data(["mysvg"])
      .join("svg")
        .attr("class", "mysvg")
          // 使用正常尺寸的视口
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
      .attr("y", 30)  // 恢复到原来的位置
      .attr("class", "svgtitle")
      .text("");

    this.DrawArea = this.ChartArea.append("g");
  }

  _getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }

  _tips() {
    console.log("初始化tooltip实现");
    try {
      // 先清除可能存在的旧tooltip
      window.hideAllTooltips();
      d3.selectAll(".d3-tip.custom-tooltip").remove();
      
      // 使用自定义的tooltip实现替代d3.tip
      this.tool_tip = createCustomTooltip();
      
      // 验证tooltip是否成功创建
      console.log("自定义tooltip创建成功:", 
        this.tool_tip ? {
          hasShowMethod: typeof this.tool_tip.show === 'function',
          hasHideMethod: typeof this.tool_tip.hide === 'function',
          hasHtmlMethod: typeof this.tool_tip.html === 'function'
        } : "未创建"
      );
      
      // 添加测试方法，便于手动触发tooltip
      this.testTooltip = () => {
        const testData = {
          properties: {
            admin: "测试国家",
            value: 12345678
          }
        };
        const testEvent = {pageX: 100, pageY: 100};
        const content = this._getTooltipContent(testEvent, testData);
        this.tool_tip.html(() => content);
        this.tool_tip.show(testEvent, testData);
        
        // 3秒后自动隐藏
        setTimeout(() => this.tool_tip.hide(), 3000);
      };
      
    } catch (e) {
      console.error("Error creating custom tooltip:", e);
    }
  }

  _initProjection_world() {
    // 使用与第一张图相似的地图缩放比例
    const projection_world = d3.geoNaturalEarth1()
      .fitSize([this.innerW * 1.25, this.innerH * 1.25], this.data)
      .translate([this.innerW / 2, this.innerH / 2]);
    this.data_path = d3.geoPath().projection(projection_world);
  }

  // 改进 _getTooltipContent 方法，提供更明显的样式
  _getTooltipContent(event, d) {
    try {
      console.log("生成tooltip内容，数据对象:", d);
      
      // 1. 国家名称：多种提取方式
      let countryName = "未知国家";
      if (d.properties?.admin) {
        countryName = d.properties.admin;
      } else if (d.properties?.name) {
        countryName = d.properties.name;
      } else if (d.country) {
        countryName = d.country;
      } else if (d.slug) {
        countryName = d.slug
          .split("_")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      } else if (d.properties?.admin_slug) {
        countryName = d.properties.admin_slug
          .split("_")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }

      // 2. 年份确定
      const year = d.properties?.year || d.year || 2024;
      
      // 如果是平均点（有 d.avg 且无 d.year），显示 "Average"
      const labelYear = (d.avg != null && d.year == null) ? "Average" : year;

      // 3. 值提取：多种来源尝试
      let rawVal = 0;
      if (d.properties?.value != null) {
        rawVal = d.properties.value;
      } else if (d.properties?.aviation_emission_wide_C2024 != null) {
        rawVal = d.properties.aviation_emission_wide_C2024;
      } else if (d.val != null) {
        rawVal = d.val;
      } else if (d.avg != null) {
        rawVal = d.avg;
      }
      
      console.log(`提取到的值: 国家=${countryName}, 年份=${labelYear}, 排放量=${rawVal}`);

      // 格式化显示文本
      const emissionText = rawVal > 0
        ? d3.format(",.2f")(rawVal) + " t"
        : "No data";

      // 返回更鲜明、结构清晰的HTML
      const tooltipHTML = `
        <div style="background-color: rgba(26, 42, 67, 0.95); padding: 12px; border-radius: 4px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); font-family: 'Montserrat', sans-serif; border: 2px solid #38bdf8; position: relative;">
          <div style="position: absolute; top: -8px; right: -8px; background: #38bdf8; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; cursor: pointer;" onclick="window.hideAllTooltips()">×</div>
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #fff; border-bottom: 1px solid #4e6284; padding-bottom: 5px;">
            ${countryName}
          </div>
          <div style="margin: 8px 0; color: #d9e1f2;">
            <span style="color: #a3b7d9;">${labelYear} Arial Emission:</span>
          </div>
          <div style="font-weight: bold; color: #38bdf8; font-size: 18px; text-shadow: 0 0 2px rgba(0,0,0,0.5);">
            ${emissionText}
          </div>
        </div>
      `;

      console.log("生成的tooltip HTML:", tooltipHTML);
      return tooltipHTML;
    } catch (error) {
      console.error("Error generating tooltip content:", error);
      return `
        <div style="background-color: #ff5252; color: white; padding: 10px; border-radius: 4px; border: 2px solid #ff0000;">
          <strong>Error displaying data</strong>
          <div>${error.message}</div>
        </div>
      `;
    }
  }

  // 修改bindTooltip方法
  bindTooltip(selector, items) {
    const self = this;
    
    // 检查items是否有效
    if (!items || !items.nodes || items.nodes().length === 0) {
      console.warn(`绑定tooltip到选择器 ${selector} 失败：没有找到元素`);
      return items;
    }
    
    // 添加调试信息
    console.log(`绑定tooltip到选择器 ${selector} 的 ${items.nodes().length} 个元素`);
    
    // 清除可能的旧事件
    items.on("mouseover", null).on("mouseout", null).on("click", null);
    
    // 同时绑定鼠标悬停和点击事件，增加交互机会
    items
      .on("mouseover", function(event, d) {
        try {
          event.stopPropagation(); // 阻止事件冒泡
          console.log(`Tooltip触发于: ${d.properties?.admin || d.slug || '未知'}`);
          
          // 添加调试信息 - 检查对象结构
          if (d.properties) {
            console.log("属性值:", {
              admin: d.properties.admin,
              admin_slug: d.properties.admin_slug,
              value: d.properties.value,
              aviation_emission: d.properties.aviation_emission_wide_C2024
            });
          } else if (d.val) {
            console.log("散点值:", {
              slug: d.slug,
              year: d.year,
              val: d.val
            });
          }
          
          // 确保DOM中有tooltip元素
          if (d3.select("body").selectAll(".d3-tip.custom-tooltip").size() === 0) {
            console.log("tooltip元素丢失，重新创建");
            self.tool_tip = createCustomTooltip();
          }
          
          const content = self._getTooltipContent(event, d);
          self.tool_tip.html(() => content);
          self.tool_tip.show(event, d);
          
          // 添加高亮效果
          d3.select(this)
            .classed("tooltip-highlight", true)
            .style("stroke-width", function() {
              // 对于路径元素增加描边
              if (this.tagName.toLowerCase() === "path") {
                return 1.5;
              }
              return null;
            })
            .style("stroke", "#38bdf8")
            .style("cursor", "pointer");
        } catch (error) {
          console.error("Tooltip显示错误:", error);
        }
      })
      .on("mouseout", function() {
        self.tool_tip.hide();
        d3.select(this)
          .classed("tooltip-highlight", false)
          .style("stroke-width", function() {
            // 还原描边
            if (this.tagName.toLowerCase() === "path") {
              return 0.3;
            }
            return null;
          })
          .style("stroke", "white");
      })
      // 添加点击事件，使移动设备也能触发tooltip
      .on("click", function(event, d) {
        try {
          event.stopPropagation(); // 阻止事件冒泡
          
          // 先隐藏所有其他tooltip
          window.hideAllTooltips();
          
          // 展示当前tooltip
          const content = self._getTooltipContent(event, d);
          self.tool_tip.html(() => content);
          self.tool_tip.show(event, d);
          
          // 添加高亮效果
          d3.selectAll(".tooltip-highlight").classed("tooltip-highlight", false);
          d3.select(this).classed("tooltip-highlight", true);
          
          // 7秒后自动消失
          setTimeout(() => {
            if (d3.select(this).classed("tooltip-highlight")) {
              self.tool_tip.hide();
              d3.select(this).classed("tooltip-highlight", false);
            }
          }, 7000);
        } catch (error) {
          console.error("Tooltip点击错误:", error);
        }
      });
    
    return items; // 返回选择集合，便于链式调用
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
    console.log("开始绘制世界地图");
    
    // 确保数据准备就绪
    if (!this.data || !this.data.features) {
      console.error("Map数据不可用");
      return;
    }
    
    // 检查并输出几个国家的数据，以便诊断
    console.log("地图数据样本:", 
      this.data.features.slice(0, 2).map(f => {
        return {
          admin: f.properties.admin,
          admin_slug: f.properties.admin_slug, 
          emission: f.properties.aviation_emission_wide_C2024
        };
      })
    );
    
    this._drawWorldMap();
  }
  
  _drawWorldMap() {
    const self = this;
    
    // 首先确保数据中的航空排放量已正确设置
    this.data.features.forEach(feature => {
      // 明确设置value字段，用于tooltip
      if (feature.properties && feature.properties.aviation_emission_wide_C2024 != null) {
        feature.properties.value = feature.properties.aviation_emission_wide_C2024;
      } else {
        // 如果没有航空排放数据，设置为0
        feature.properties.value = 0;
      }
      
      // 确保admin和admin_slug字段存在
      if (!feature.properties.admin && feature.properties.admin_slug) {
        feature.properties.admin = feature.properties.admin_slug
          .split("_")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    });
    
    const paths = this.ChartArea.selectAll(".worldPath")
      .data(this.data.features)
      .join("path")
      .raise()
      .attr("class", (d) => `worldPath ${d.properties.admin_slug || "unknown"}`)
      .attr("id", (d) => {
        // 为Russia添加特殊ID，便于调试
        if (d.properties.admin_slug === 'russia') {
          return "russia-path";
        }
        return null;
      })
      .attr("opacity", 1)
      .attr("d", this.data_path)
      .attr("stroke-width", 0.3)
      .attr("stroke", "white")
      .attr("fill", (d) => {
        const v = d.properties.value;
        return v != null
          ? this.color(v)
          : "#ccc";
      });
    
    console.log(`绘制了 ${paths.nodes().length} 个国家路径`);
    
    // 使用通用绑定方法
    const allPaths = this.ChartArea.selectAll(".worldPath");
    console.log(`准备绑定tooltip到 ${allPaths.nodes().length} 个世界地图路径`);
    
    // 直接绑定事件，以确保tooltip正常工作
    allPaths.each(function(d) {
      if (d && d.properties) {
        console.log(`Path with country: ${d.properties.admin || 'unknown'}`);
      }
    });
    
    // 使用我们的bindTooltip方法
    this.bindTooltip(".worldPath", allPaths);
    
    // 手动验证是否绑定成功
    const firstPath = allPaths.nodes()[0];
    if (firstPath) {
      console.log("验证第一个路径的事件处理器:", {
        hasMouseover: !!d3.select(firstPath).on("mouseover"),
        hasMouseout: !!d3.select(firstPath).on("mouseout")
      });
    }
    
    // 查找并记录Russia的数据和事件
    const russiaPath = d3.select(".worldPath.russia");
    if (!russiaPath.empty()) {
      console.log("俄罗斯数据:", russiaPath.datum());
      console.log("俄罗斯事件处理器:", {
        hasMouseover: !!russiaPath.on("mouseover"),
        hasMouseout: !!russiaPath.on("mouseout"),
        hasClick: !!russiaPath.on("click")
      });
      
      // 添加Russia的调试标记
      russiaPath
        .attr("data-country", "russia")
        .attr("data-value", d => d.properties.value)
        .attr("data-testable", "true");
    }
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
      x: 0, y: 0, // 恢复到图片1的位置
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
    
    // 重新初始化投影，使散点图更大
    this._initProjection_world();
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
      .attr("font-size", "14px")
      .text("Annual Emission Amount");
    // x 轴标签
    this.ChartArea.append("text")
      .attr("class", "scatter-label")
      .attr("transform", `translate(${-110},${this.innerH/2}) rotate(270)`)
      .text("");
    // 标题
    this.svg.append("text")
      .attr("class", "scatter-label")
      .attr("x", 80).attr("y", 40)  // 恢复到原来的位置
      .attr("font-size", "16px")
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

    // 3. Y 轴不变 - 减小padding使国家名称间距更大，图表效果更好
    this.y = d3.scaleBand()
      .range([0, this.innerH])
      .domain(this.scatter_data.map(d => d[0]))
      .padding(0.2);
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
          .ticks(6)               // 使用合适的刻度数量
          .tickFormat(d3.format("~s"))
      );

    const axisY = d3.axisLeft(this.y)
      .tickSize(-this.innerW)
      .tickFormat(slug => this.slug2admin[slug] || slug);

    this.AxisY
      .transition().duration(1000).style("opacity", 0.8)
      .call(axisY);

    // 调整文本位置和字体大小
    this.AxisY.selectAll(".tick text")
      .attr("dy", "-0.5em")
      .attr("font-size", "12px");
      
    this.AxisX.selectAll(".tick text")
      .attr("font-size", "12px");

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
      x: 0, y: 0, // 恢复到图片1的位置
      width: this.innerW,
      height: 10,
      legend_color_count: this.color.range().length
    });
  }

  _drawAllYearPoints() {
    const self = this; // Store reference to class instance
    // 1. 把 [slug, [[year,val],…]] 拍平成 {slug, year, val} 的数组
    const flat = this.scatter_data.flatMap(([slug, series]) =>
      series.map(([year, val]) => ({ slug, year, val: safeDataValue(val) }))
    );

    // 2. 绑定到 circle
    const points = this.DrawArea
      .selectAll(".year-point")
      .data(flat, d => d.slug + "-" + d.year)
      .join("circle")
      .attr("class", "year-point")
      .attr("cx", d => {
        // 安全的cx计算
        const value = safeDataValue(d.val);
        const xPos = this.x(value);
        return isNaN(xPos) ? 0 : xPos; // 防止NaN
      })
      .attr("cy", d => {
        // 安全的cy计算
        const yPos = this.y(d.slug) + this.y.bandwidth() / 2;
        return isNaN(yPos) ? 0 : yPos; // 防止NaN
      })
      .attr("r", 4)
      .attr("fill", d => this.color(d.val));
      
    // 使用通用绑定方法
    this.bindTooltip(".year-point", points);
  }

  _drawAveragePoints() {
    const self = this; // Store reference to class instance
    // 1. 计算每个国家的平均值，先过滤掉所有 val===0 的"无数据"点
    const avgData = this.scatter_data.map(([slug, series]) => {
      // 提取所有数值并剔除 0
      const validVals = series
        .map(([year, val]) => val)
        .filter(v => v > 0 && !isNaN(v)); // 安全过滤
      // 如果没有任何有效数据，就让 avg 为 0（或你也可以让它为 null/undefined）
      const avg = validVals.length > 0
        ? d3.mean(validVals)
        : 0;
      return { slug, avg: safeDataValue(avg) };
    })
    // 如果你不想为那些 avg===0 的国家画点，可以再过滤一遍
    .filter(d => d.avg > 0);

    // 2. 绘制平均值点
    const points = this.DrawArea
      .selectAll(".avg-point")
      .data(avgData, d => d.slug)
      .join("circle")
      .attr("class", "avg-point")
      .attr("cx", d => {
        // 安全的cx计算
        const value = safeDataValue(d.avg);
        const xPos = this.x(value);
        return isNaN(xPos) ? 0 : xPos; // 防止NaN
      })
      .attr("cy", d => {
        // 安全的cy计算
        const yPos = this.y(d.slug) + this.y.bandwidth() / 2;
        return isNaN(yPos) ? 0 : yPos; // 防止NaN
      })
      .attr("r", 6)
      .attr("fill", "black")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.25);  // 边框粗细
    
    // 使用通用绑定方法
    this.bindTooltip(".avg-point", points);
  }

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
    const self = this; // Store reference to class instance

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
        // 使用适当的圆半径
        return flubber.toCircle(startD, cx, cy, 6);
      })
      .on("end", function(d, i, nodes) {
        // 在最后一个元素完成动画后，重新绑定所有tooltip
        if (i === nodes.length - 1) {
          console.log("世界地图到圆形转换完成，绑定tooltip");
          // 为所有圆形重新绑定事件
          const circles = d3.selectAll(".worldPath").filter(d => validSlugs.has(d.properties.admin_slug));
          self.bindTooltip(".worldPath", circles);
        }
      });
  }

  _circle_change_to_world_path() {
    const pathFn    = this.data_path;
    const validSlugs = new Set(this.y.domain());
    const duration  = 1200;
    const delayPer  = (d,i) => 10 + i*2;
    const self = this; // 保存this引用以在回调中使用

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
      // 在动画最后重新绑定tooltip
      .on("end", (d, i, nodes) => {
        if (i === nodes.length - 1) {
          console.log("Circle to path animation complete, updating tooltips");
          
          // 为所有国家重新绑定事件
          d3.selectAll(".worldPath")
            .on("mouseover", (event, d) => {
              const content = self._getTooltipContent(event, d);
              self.tool_tip.html(() => content);
              self.tool_tip.show(event, d);
            })
            .on("mouseout", (event, d) => {
              self.tool_tip.hide();
            });
        }
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

  // 覆盖World类的投影方法，使散点图更大
  _initProjection_world() {
      // 增大散点图的缩放比例，使其与地图大小一致
  const projection_world = d3.geoNaturalEarth1()
    .fitSize([this.innerW * 1.35, this.innerH * 1.35], this.data)
    .translate([this.innerW / 2, this.innerH / 2]);
  this.data_path = d3.geoPath().projection(projection_world);
  }

  applyLinearScale() {
    // —— 1. 先拿旧的 this.x（log）、yScale 和 validSlugs
    const oldX = this.x;
    const yScale = this.y;
    const validSlugs = new Set(yScale.domain());
    const self = this;

    // —— 2. 重建 this.x 为 √ 刻度
    const maxVal = d3.max(this.scatter_data, d => d3.max(d[1], v=>v[1])) || 100;
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
      .style("opacity", 1) // 确保显示所有点
      .attr("cx", d => {
        const val = safeDataValue(d.val);
        return isNaN(newX(val)) ? 0 : newX(val);
      });
      
    this.DrawArea.selectAll(".avg-point")
      .transition().duration(800)
      .style("opacity", 1) // 确保显示所有点
      .attr("cx", d => {
        const avg = safeDataValue(d.avg);
        return isNaN(newX(avg)) ? 0 : newX(avg);
      });

    // —— 5. **关键**：对 morph 出来的 "2024 圆" 再来一次 flubber 过渡 - 使用更大的圆半径
    d3.selectAll(".worldPath")
      .filter(d => validSlugs.has(d.properties.admin_slug))
      .transition().duration(800)
      .style("opacity", 1) // 确保显示所有国家
      .attrTween("d", function(d) {
        try {
          const startD = d3.select(this).attr("d");
          const value = safeDataValue(d.properties.value);
          const cx = isNaN(newX(value)) ? 0 : newX(value);
          const cy = yScale(d.properties.admin_slug) + yScale.bandwidth()/2;
          // 使用适当的圆半径
          return flubber.toCircle(startD, cx, cy, 6);
        } catch (e) {
          console.error("Error in linear scale flubber transform:", e);
          // 出错时返回原始路径
          return d => d3.select(this).attr("d");
        }
      })
      .on("end", function(d, i, nodes) {
        if (i === nodes.length - 1) {
          console.log("Linear scale transition complete, updating tooltips");
          
          // 为所有圆形重新绑定事件
          const circles = d3.selectAll(".worldPath").filter(d => validSlugs.has(d.properties.admin_slug));
          self.bindTooltip(".worldPath", circles);
          
          // 更新年份点tooltip
          const yearPoints = self.DrawArea.selectAll(".year-point");
          self.bindTooltip(".year-point", yearPoints);
          
          // 更新平均点tooltip
          const avgPoints = self.DrawArea.selectAll(".avg-point");
          self.bindTooltip(".avg-point", avgPoints);
        }
      });
  }

  applyLogScale() {
    this.AxisX
      .attr("transform", `translate(0,${this.innerH})`)
      .style("opacity", 1);
    // 1. 找到最小正值和最大值
    const allVals = this.scatter_data
      .flatMap(d => d[1].map(v => v[1]))
      .filter(v => v > 0);  // 过滤掉零值和负值
    const minPos = d3.min(allVals) || 1; // 确保有默认值
    const maxVal = d3.max(allVals) || 100; // 确保有默认值
    const self = this;

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
      .filter(d => d.val > 0)  // 确保只有正值才参与对数比例尺转换
      .transition().duration(800)
      .attr("cx", d => {
        try {
          return safeLogScale(d.val, this.x, minPos);
        } catch (e) {
          console.error("Error calculating year-point cx:", e);
          return 0;
        }
      });
      
    // 隐藏值为0的点
    this.DrawArea.selectAll(".year-point")
      .filter(d => d.val <= 0 || isNaN(d.val))
      .transition().duration(800)
      .style("opacity", 0);

    this.DrawArea.selectAll(".avg-point")
      .filter(d => d.avg > 0)  // 确保只有正值才参与对数比例尺转换
      .transition().duration(800)
      .attr("cx", d => {
        try {
          return safeLogScale(d.avg, this.x, minPos);
        } catch (e) {
          console.error("Error calculating avg-point cx:", e);
          return 0;
        }
      });
      
    // 隐藏值为0的平均点
    this.DrawArea.selectAll(".avg-point")
      .filter(d => d.avg <= 0 || isNaN(d.avg))
      .transition().duration(800)
      .style("opacity", 0);

    // —— 重点：flubber 也要用新的 this.x —— 
    const newX = this.x;
    const yScale = this.y;
    const valid = new Set(yScale.domain());

    d3.selectAll(".worldPath")
      .filter(d => valid.has(d.properties.admin_slug) && d.properties.value > 0)  // 确保只有正值参与转换
      .transition().duration(800)
      .attrTween("d", function(d) {
        try {
          const startD = d3.select(this).attr("d");
          // 使用安全函数计算圆心位置
          const cx = safeLogScale(d.properties.value, newX, minPos);
          const cy = yScale(d.properties.admin_slug) + yScale.bandwidth()/2;
          // 使用适当的圆半径
          return flubber.toCircle(startD, cx, cy, 6);
        } catch (e) {
          console.error("Error in flubber transform:", e);
          // 出错时返回原始路径
          return d => d3.select(this).attr("d");
        }
      })
      .on("end", function(d, i, nodes) {
        if (i === nodes.length - 1) {
          console.log("Log scale transition complete, updating tooltips");
          
          // 为所有圆形重新绑定事件
          const circles = d3.selectAll(".worldPath")
            .filter(d => valid.has(d.properties.admin_slug) && d.properties.value > 0);
          self.bindTooltip(".worldPath", circles);
          
          // 更新年份点tooltip
          const yearPoints = self.DrawArea.selectAll(".year-point")
            .filter(d => d.val > 0);
          self.bindTooltip(".year-point", yearPoints);
          
          // 更新平均点tooltip
          const avgPoints = self.DrawArea.selectAll(".avg-point")
            .filter(d => d.avg > 0);
          self.bindTooltip(".avg-point", avgPoints);
        }
      });
      
    // 隐藏值为0的国家路径
    d3.selectAll(".worldPath")
      .filter(d => valid.has(d.properties.admin_slug) && (d.properties.value <= 0 || d.properties.value === null || isNaN(d.properties.value)))
      .transition().duration(800)
      .style("opacity", 0);
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
    this.isTransitioning = false;  // 防止过渡动画中断
    this.lastWindowHeight = window.innerHeight; // 记录初始窗口高度

    // 使用requestAnimationFrame限制滚动事件处理频率
    this.scrollHandler = this.scrollHandler.bind(this);
    this.resizeHandler = this.resizeHandler.bind(this);
    
    // 注册节流后的滚动事件
    const scrollElement = document.querySelector(selector);
    if (scrollElement) {
      scrollElement.addEventListener("scroll", this.scrollHandler);
      // 添加窗口大小变化监听
      window.addEventListener("resize", this.resizeHandler);
    } else {
      console.error("ScrollMorph: selector not found:", selector);
    }
  }
  
  // 处理窗口大小变化 - 尤其是当控制台打开/关闭时
  resizeHandler() {
    // 如果窗口高度变化超过 10%，可能是控制台打开或关闭
    const heightDiff = Math.abs(this.lastWindowHeight - window.innerHeight) / this.lastWindowHeight;
    if (heightDiff > 0.1) {
      console.log("显著窗口高度变化检测到，可能是控制台打开/关闭");
      
      // 确保所有tooltips被清除
      window.hideAllTooltips();
      
      // 强制重置到初始状态
      if (this.phase !== 0) {
        this.phase = 0;
        // 确保地图可见
        d3.selectAll(".worldPath").style("opacity", 1);
        d3.selectAll(".year-point").style("opacity", 0);
        d3.selectAll(".avg-point").style("opacity", 0);
        
        // 延时执行转换，避免在布局调整期间执行过渡动画
        setTimeout(() => {
          this.toWorld();
        }, 300);
      }
      
      // 更新记录的窗口高度
      this.lastWindowHeight = window.innerHeight;
    }
  }
  
  // 节流后的滚动处理函数
  scrollHandler(e) {
    if (this.scrollRAF) return;
    
    this.scrollRAF = window.requestAnimationFrame(() => {
      this.handlescroll(e);
      this.scrollRAF = null;
    });
  }

  handlescroll(e) {
    // 如果正在转换中，不处理滚动
    if (this.isTransitioning) return;
    
    try {
      const target = e.target;
      if (!target) return;
      
      const top = target.scrollTop;
      const h   = target.scrollHeight;
      const viewportHeight = window.innerHeight;
      
      // 如果高度无效或窗口高度过小（可能是控制台打开），不继续处理
      if (!h || viewportHeight < 400) {
        console.log("滚动处理被跳过：无效高度或窗口过小");
        return;
      }
      
      const t1  = h * 0.20;  // 20%
      const t2  = h * 0.40;  // 40%
      const t3  = h * 0.60;  // 60%
      
      const self = this; // 保存this引用

      if (top >= t3) {
        // 4) ≥60% 显示遮罩
        if (this.phase !== 3) {
          this.isTransitioning = true;
          
          // 确保先有对数散点
          if (this.phase < 2) {
            if (this.phase === 0) {
              this.toScatter();
            }
            // 延迟应用对数刻度
            setTimeout(() => {
              this.scatter.applyLogScale();
              setTimeout(() => {
                this.phase = 3;
                this.scatter.showOverlay();
                this.isTransitioning = false;
                
                // 重新绑定对数散点图tooltip
                setTimeout(function() {
                  console.log("遮罩模式：强制重新绑定tooltip");
                  // 获取有效的slug
                  const valid = new Set(self.scatter.y.domain());
                  
                  // 为圆形绑定tooltip
                  const circles = d3.selectAll(".worldPath")
                    .filter(d => valid.has(d.properties.admin_slug) && d.properties.value > 0);
                  self.scatter.bindTooltip(".worldPath", circles);
                  
                  // 为年份点绑定tooltip
                  const yearPoints = self.scatter.DrawArea.selectAll(".year-point")
                    .filter(d => d.val > 0);
                  self.scatter.bindTooltip(".year-point", yearPoints);
                  
                  // 为平均点绑定tooltip
                  const avgPoints = self.scatter.DrawArea.selectAll(".avg-point")
                    .filter(d => d.avg > 0);
                  self.scatter.bindTooltip(".avg-point", avgPoints);
                }, 100);
              }, 900);
            }, this.phase === 0 ? 1200 : 100);
          } else {
            this.phase = 3;
            this.scatter.showOverlay();
            this.isTransitioning = false;
            
            // 重新绑定tooltip
            setTimeout(function() {
              console.log("遮罩模式(直接)：强制重新绑定tooltip");
              // 获取有效的slug
              const valid = new Set(self.scatter.y.domain());
              
              // 为圆形绑定tooltip
              const circles = d3.selectAll(".worldPath")
                .filter(d => valid.has(d.properties.admin_slug) && d.properties.value > 0);
              self.scatter.bindTooltip(".worldPath", circles);
              
              // 为年份点绑定tooltip
              const yearPoints = self.scatter.DrawArea.selectAll(".year-point")
                .filter(d => d.val > 0);
              self.scatter.bindTooltip(".year-point", yearPoints);
              
              // 为平均点绑定tooltip
              const avgPoints = self.scatter.DrawArea.selectAll(".avg-point")
                .filter(d => d.avg > 0);
              self.scatter.bindTooltip(".avg-point", avgPoints);
            }, 100);
          }
        }
      }
      else if (top >= t2) {
        // 3) 40%–60% → 对数散点
        if (this.phase !== 2) {
          this.isTransitioning = true;
          
          if (this.phase === 0) {
            this.toScatter();
            // 延迟应用对数刻度
            setTimeout(() => {
              this.phase = 2;
              this.scatter.applyLogScale();
              this.isTransitioning = false;
              
              // 重新绑定对数散点图tooltip
              setTimeout(function() {
                console.log("对数散点图模式：强制重新绑定tooltip");
                // 获取有效的slug
                const valid = new Set(self.scatter.y.domain());
                
                // 为圆形绑定tooltip
                const circles = d3.selectAll(".worldPath")
                  .filter(d => valid.has(d.properties.admin_slug) && d.properties.value > 0);
                self.scatter.bindTooltip(".worldPath", circles);
                
                // 为年份点绑定tooltip
                const yearPoints = self.scatter.DrawArea.selectAll(".year-point")
                  .filter(d => d.val > 0);
                self.scatter.bindTooltip(".year-point", yearPoints);
                
                // 为平均点绑定tooltip
                const avgPoints = self.scatter.DrawArea.selectAll(".avg-point")
                  .filter(d => d.avg > 0);
                self.scatter.bindTooltip(".avg-point", avgPoints);
              }, 100);
            }, 1200);
          } else {
            this.phase = 2;
            this.scatter.applyLogScale();
            setTimeout(() => {
              this.isTransitioning = false;
              
              // 重新绑定对数散点图tooltip
              setTimeout(function() {
                console.log("对数散点图模式(直接)：强制重新绑定tooltip");
                // 获取有效的slug
                const valid = new Set(self.scatter.y.domain());
                
                // 为圆形绑定tooltip
                const circles = d3.selectAll(".worldPath")
                  .filter(d => valid.has(d.properties.admin_slug) && d.properties.value > 0);
                self.scatter.bindTooltip(".worldPath", circles);
                
                // 为年份点绑定tooltip
                const yearPoints = self.scatter.DrawArea.selectAll(".year-point")
                  .filter(d => d.val > 0);
                self.scatter.bindTooltip(".year-point", yearPoints);
                
                // 为平均点绑定tooltip
                const avgPoints = self.scatter.DrawArea.selectAll(".avg-point")
                  .filter(d => d.avg > 0);
                self.scatter.bindTooltip(".avg-point", avgPoints);
              }, 100);
            }, 900);
          }
        }
        
        if (this.phase === 3) {
          this.scatter.hideOverlay();
        }
      }
      else if (top >= t1) {
        // 2) 20%–40% → 线性散点
        if (this.phase !== 1) {
          this.isTransitioning = true;
          this.phase = 1;
          this.toScatter();
          setTimeout(() => {
            this.isTransitioning = false;
          }, 1200);
        }
        
        if (this.phase === 3) {
          this.scatter.hideOverlay();
        }
      }
      else {
        // 1) <20% → 世界图
        if (this.phase !== 0) {
          this.isTransitioning = true;
          this.phase = 0;
          this.toWorld();
          setTimeout(() => {
            this.isTransitioning = false;
          }, 1200);
        }
        
        if (this.phase === 3) {
          this.scatter.hideOverlay();
        }
      }
    } catch (error) {
      console.error("Error in ScrollMorph.handlescroll:", error);
      this.isTransitioning = false;  // 出错时恢复状态
    }
  }

  toScatter() {
    const self = this;
    try {
      // 中断所有正在进行的过渡
      d3.selectAll(".worldPath").interrupt();
      
      // 执行散点图转换
      this.scatter.worldPath_to_circle();
      this.scatter.addAxis();
      this.scatter.applyLinearScale();
      
      // 强制在延迟后重新绑定所有tooltip
      setTimeout(function() {
        console.log("散点图模式：强制重新绑定tooltip");
        try {
          // 为圆形绑定tooltip
          const validSlugs = new Set(self.scatter.y.domain());
          const circles = d3.selectAll(".worldPath").filter(d => validSlugs.has(d.properties.admin_slug));
          console.log(`找到 ${circles.nodes().length} 个有效国家圆形`);
          self.scatter.bindTooltip(".worldPath", circles);
          
          // 为年份点绑定tooltip
          const yearPoints = self.scatter.DrawArea.selectAll(".year-point");
          if (yearPoints.nodes().length > 0) {
            console.log(`找到 ${yearPoints.nodes().length} 个年份点`);
            self.scatter.bindTooltip(".year-point", yearPoints);
          }
          
          // 为平均点绑定tooltip
          const avgPoints = self.scatter.DrawArea.selectAll(".avg-point");
          if (avgPoints.nodes().length > 0) {
            console.log(`找到 ${avgPoints.nodes().length} 个平均点`);
            self.scatter.bindTooltip(".avg-point", avgPoints);
          }
        } catch (err) {
          console.error("Error rebinding tooltips in toScatter:", err);
        }
      }, 1500);
    } catch (error) {
      console.error("Error in ScrollMorph.toScatter:", error);
    }
  }

  toWorld() {
    const self = this;
    try {
      // 中断所有正在进行的过渡
      d3.selectAll(".worldPath").interrupt();
      
      // 执行世界地图转换
      this.scatter.removeAxis();
      this.scatter.circle_to_worldPath();
      this.scatter.svg.selectAll("g.legend").remove();
      this.map._addLegend();

      this.scatter.ChartArea.selectAll(".scatter-label")
        .transition().duration(600)
        .style("opacity", 0)
        .remove();
        
      // 强制延迟后重新绑定世界地图tooltip
      setTimeout(function() {
        console.log("世界地图模式：强制重新绑定tooltip");
        try {
          const worldPaths = d3.selectAll(".worldPath");
          self.map.bindTooltip(".worldPath", worldPaths);
        } catch (err) {
          console.error("Error rebinding tooltips in toWorld:", err);
        }
      }, 1500);
    } catch (error) {
      console.error("Error in ScrollMorph.toWorld:", error);
    }
  }
  
  // 新增：清理事件监听器的方法
  cleanup() {
    const scrollElement = document.querySelector(selector);
    if (scrollElement) {
      scrollElement.removeEventListener("scroll", this.scrollHandler);
    }
    window.removeEventListener("resize", this.resizeHandler);
  }
}

// 全局tooltip初始化和修复函数
function ensureTooltipsWork() {
  console.log("确保所有tooltip正常工作");
  
  // 1. 清除任何现有的tooltip
  window.hideAllTooltips();
  d3.selectAll(".d3-tip.custom-tooltip").remove();
  
  // 2. 为body添加点击处理
  if (!window.tooltipCleanupInitialized) {
    document.body.addEventListener("click", function(e) {
      // 检查点击是否在tooltip外
      if (!e.target.closest(".d3-tip")) {
        window.hideAllTooltips();
      }
    });
    
    // 标记为已初始化
    window.tooltipCleanupInitialized = true;
  }
  
  // 3. 添加全局样式确保tooltip可见
  const style = document.createElement('style');
  style.textContent = `
    .d3-tip.custom-tooltip {
      pointer-events: auto !important;
      z-index: 99999 !important;
      position: fixed !important;
    }
    .tooltip-highlight {
      stroke: #38bdf8 !important;
      stroke-width: 1.5px !important;
    }
  `;
  document.head.appendChild(style);
  
  // 4. 为所有可能的元素重新绑定tooltip
  try {
    // 获取地图和散点图实例
    const mapInstances = d3.selectAll(".mysvg").nodes().map(node => {
      const id = node.closest("[id]").id;
      return window[id + "Instance"];
    }).filter(Boolean);
    
    // 如果找到实例，尝试重新绑定
    if (mapInstances.length > 0) {
      mapInstances.forEach(instance => {
        if (instance && instance.bindTooltip) {
          // 重新绑定国家路径
          const paths = d3.selectAll(".worldPath");
          if (paths.size() > 0) {
            instance.bindTooltip(".worldPath", paths);
          }
          
          // 重新绑定散点图点
          const points = d3.selectAll(".year-point, .avg-point");
          if (points.size() > 0) {
            instance.bindTooltip(".year-point, .avg-point", points);
          }
        }
      });
    }
  } catch (e) {
    console.error("重新绑定tooltip失败:", e);
  }
}

// 在DOM加载完成后初始化
document.addEventListener("DOMContentLoaded", function() {
  setTimeout(ensureTooltipsWork, 1000);
});

// 在任何AJAX请求完成后初始化
window.addEventListener("load", function() {
  setTimeout(ensureTooltipsWork, 1000);
});

// 每10秒检查一次tooltip是否工作
setInterval(function() {
  // 检查是否有tooltip元素
  if (d3.selectAll(".d3-tip.custom-tooltip").size() === 0) {
    ensureTooltipsWork();
  }
}, 10000);

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

  // 地图部分保持不变，但将实例存储在全局
  window.mapInstance = new Map("map", data, "I am map");
  window.mapInstance.drawWorld();
  window.mapInstance._addLegend();

  // 散点部分也保持不变，但存储在全局
  window.scatterInstance = new Scatter("map", data,"I am scatter", window.mapInstance);
  

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
  window.scrollMorphInstance = new ScrollMorph(window.scatterInstance, window.mapInstance, "#chartArea");
  
  // 确保tooltip正常工作
  setTimeout(ensureTooltipsWork, 500);
}

main();