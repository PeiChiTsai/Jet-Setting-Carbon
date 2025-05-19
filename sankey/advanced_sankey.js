// Advanced Sankey Diagram - Using WRI 2019 Emission Data

/**
 * 初始化桑基图
 */
function initSankeyChart() {

    
    // 检查DOM和容器状态
    console.log("DOM ready state:", document.readyState);
    
    const sankeyContainer = document.getElementById('sankey-container');
    if (!sankeyContainer) {
        console.error("ERROR: Sankey container not found! This is critical.");
        return;
    }
    console.log("Sankey container found:", sankeyContainer);
    
    // 检查D3和D3-Sankey是否可用
    if (typeof d3 === 'undefined') {
        console.error("ERROR: D3.js is not loaded! Cannot create Sankey chart.");
        return;
    }
    console.log("D3.js version:", d3.version);
    
    if (typeof d3.sankey === 'undefined') {
        console.error("ERROR: D3-Sankey is not loaded! Cannot create Sankey chart.");
        return;
    }
    console.log("D3-Sankey is available");
    
    // 获取保存的年份，如果没有则默认为2019
    let defaultYear = "2019";
    try {
        const savedYear = localStorage.getItem('selectedYear');
        if (savedYear) {
            defaultYear = savedYear;
        }
    } catch (e) {
        console.warn("Could not retrieve saved year:", e);
    }
    console.log("Using default year:", defaultYear);
    
    // 获取数据
    const data = getWRISankeyData();
    console.log('Data loaded, total:', data.length, 'records');
    
    // 可用年份
    const availableYears = ["2016", "2018", "2019", "2020"];
    
    // 设置年份选择器
    setupYearSelector(data, defaultYear);
    
    // 创建桑基图
    try {
        console.log("Creating Sankey chart for year:", defaultYear);
        createSankeyChart(data, defaultYear);
        console.log("Sankey chart creation initiated");
    } catch (error) {
        console.error("Error creating Sankey chart:", error);
    }
}

/**
 * 设置年份选择器 - 避免任何可能导致页面重载的操作
 */
function setupYearSelector(data, defaultYear) {
    console.log('Setting up year selector with default year:', defaultYear);
    
    // 获取所有年份按钮（同时支持旧的和新的按钮选择器）
    const yearButtons = document.querySelectorAll('.year-button, .year-selector-button');
    console.log('Found year buttons:', yearButtons.length);
    
    // 先清除所有活跃状态
    yearButtons.forEach(btn => btn.classList.remove('active'));
    
    // 标记默认年份为活跃
    const buttonSelectors = [
        `#year-${defaultYear}`, 
        `#selector-year-${defaultYear}`,
        `.year-selector-button[data-year="${defaultYear}"]`,
        `.year-button[data-year="${defaultYear}"]`
    ];
    
    // 尝试查找按钮并设置活跃状态
    let activeButtonFound = false;
    buttonSelectors.forEach(selector => {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.classList.add('active');
            activeButtonFound = true;
            console.log(`Set active state for button: ${selector}`);
        }
    });
    
    if (!activeButtonFound) {
        console.warn(`No button found for year ${defaultYear}`);
        // 尝试基于文本内容查找
        yearButtons.forEach(btn => {
            if (btn.textContent.trim() === defaultYear) {
                btn.classList.add('active');
                activeButtonFound = true;
                console.log(`Found button by text content: ${defaultYear}`);
            }
        });
    }
    
    // 为每个按钮添加点击事件
    yearButtons.forEach(button => {
        // 从按钮ID或数据属性中提取年份
        let year = '';
        if (button.id && button.id.includes('-')) {
            year = button.id.split('-').pop();
        } else if (button.getAttribute('data-year')) {
            year = button.getAttribute('data-year');
        } else {
            year = button.textContent.trim();
        }
        
        console.log(`Setting up click handler for button: ${button.id || 'unnamed'}, year: ${year}`);
        
        // 添加点击事件处理器 - 简化版本，避免任何刷新
        button.addEventListener('click', function(e) {
            // 阻止默认行为，防止可能的页面刷新
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Year button clicked:', year);
            
            // 移除所有按钮的活跃状态
            yearButtons.forEach(btn => btn.classList.remove('active'));
            
            // 添加当前按钮的活跃状态
            this.classList.add('active');
            
            // 保存选择的年份到localStorage
            try {
                localStorage.setItem('selectedYear', year);
                console.log('Year saved to localStorage:', year);
            } catch (error) {
                console.warn('Could not save year to localStorage:', error);
            }
            
            // 创建桑基图 - 直接调用，不涉及URL或历史记录操作
            createSankeyChart(data, year);
        });
    });
}

/**
 * 创建桑基图
 */
function createSankeyChart(data, year) {
    console.log(`Creating WRI-style three-level Sankey diagram for ${year}...`);
    
    // 获取容器并显示加载中状态
    const container = document.getElementById('sankey-container');
    if (container) {
        // 显示优雅的加载状态
        container.innerHTML = `
            <div class="sankey-loading-container" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; background-color: rgba(255,255,255,0.9);">
                <div class="loading-spinner" style="width: 50px; height: 50px; border: 5px solid rgba(26, 42, 67, 0.1); border-radius: 50%; border-top-color: #1A2A43; animation: spin 1s ease-in-out infinite; margin-bottom: 15px;"></div>
                <div style="font-family: 'Montserrat', sans-serif; font-size: 18px; color: #1A2A43; font-weight: 600;">
                    Processing ${year} Data...
                </div>
                <div style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: #777; margin-top: 5px;">
                    Please wait while we prepare the visualization
                </div>
            </div>
        `;
        
        // 添加加载动画样式（如果尚未添加）
        if (!document.getElementById('sankey-loading-styles')) {
            const loadingStyle = document.createElement('style');
            loadingStyle.id = 'sankey-loading-styles';
            loadingStyle.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(loadingStyle);
        }
    }
    
    try {
        // 过滤特定年份的数据
        const yearData = data.filter(d => d.year === year);
        console.log(`${year} data:`, yearData.length, 'records');
        
        if (yearData.length === 0) {
            console.error(`No data found for year ${year}`);
            // 显示错误消息
            const container = document.getElementById('sankey-container');
            if (container) {
                container.innerHTML = `
                    <div style="color: #e74c3c; padding: 30px; text-align: center; font-family: 'Montserrat', sans-serif;">
                        <div style="font-size: 24px; margin-bottom: 10px;">No Data Available</div>
                        <div style="font-size: 16px;">No data found for year ${year}. Please try another year.</div>
                    </div>
                `;
            }
            return;
        }
        
        // 延时处理，让加载效果更明显
        setTimeout(() => {
            // 准备节点和链接数据
            const { nodes, links } = processWRIData(yearData);
            
            if (!nodes || !links || nodes.length === 0 || links.length === 0) {
                console.error('Failed to process data into nodes and links');
                
                if (container) {
                    container.innerHTML = `
                        <div style="color: #e74c3c; padding: 30px; text-align: center; font-family: 'Montserrat', sans-serif;">
                            <div style="font-size: 24px; margin-bottom: 10px;">Data Processing Error</div>
                            <div style="font-size: 16px;">Failed to process data. Please try refreshing the page.</div>
                        </div>
                    `;
                }
                return;
            }
            
            console.log(`Processed data: ${nodes.length} nodes, ${links.length} links`);
            
            // 更新标题和右侧信息
            updateChartInfo(year);
            
            // 绘制桑基图
            renderSankeyDiagram(nodes, links);
        }, 300); // 短暂延迟，使加载动画能够显示
        
    } catch (error) {
        console.error('Error creating Sankey chart:', error);
        // 显示错误消息
        const container = document.getElementById('sankey-container');
        if (container) {
            container.innerHTML = `
                <div style="color: #e74c3c; padding: 30px; text-align: center; font-family: 'Montserrat', sans-serif;">
                    <div style="font-size: 24px; margin-bottom: 10px;">Error Creating Chart</div>
                    <div style="font-size: 16px;">Error creating Sankey chart: ${error.message}</div>
                    <div style="font-size: 14px; margin-top: 20px; color: #7f8c8d;">Please try refreshing the page or selecting a different year.</div>
                </div>
            `;
        }
    }
}

/**
 * 根据年份更新图表信息和右侧文本内容
 */
function updateChartInfo(year) {
    // 更新图表标题和副标题
    if(year === "2016") {
        document.getElementById('chart-title').textContent = `World Greenhouse Gas Emissions in 2016 (Sector | End Use | Gas)`;
        document.getElementById('chart-subtitle').textContent = `Total: 49.4 GtCO₂e`;

        document.getElementById('data-source-year').textContent = '2016';
        document.getElementById('data-source-link').href = 'https://www.wri.org/data/world-greenhouse-gas-emissions-2016';
    } else if(year === "2018") {
        document.getElementById('chart-title').textContent = `World Greenhouse Gas Emissions in 2018 (Sector | End Use | Gas)`;
        document.getElementById('chart-subtitle').textContent = `Total: 48.9 GtCO₂e`;
        document.getElementById('data-source-year').textContent = '2018';
        document.getElementById('data-source-link').href = 'https://www.wri.org/data/world-greenhouse-gas-emissions-2018';
    } else if(year === "2019") {
        document.getElementById('chart-title').textContent = `World Greenhouse Gas Emissions in 2019 (Sector | End Use | Gas)`;
        document.getElementById('chart-subtitle').textContent = `Total: 49.8 GtCO₂e`;
        document.getElementById('data-source-year').textContent = '2019';
        document.getElementById('data-source-link').href = 'https://www.wri.org/data/world-greenhouse-gas-emissions-2019';
    } else if(year === "2020") {
        document.getElementById('chart-title').textContent = `World Greenhouse Gas Emissions in 2020 (Sector | End Use | Gas)`;
        document.getElementById('chart-subtitle').textContent = `Total: 47.5 GtCO₂e`;
        document.getElementById('data-source-year').textContent = '2020';
        document.getElementById('data-source-link').href = 'https://www.wri.org/data/world-greenhouse-gas-emissions-2020';
    }
    
    // 更新右侧信息内容 - 根据不同年份提供不同的航空影响内容
    updateAviationInfo(year);
}

/**
 * 根据年份更新右侧航空影响信息
 */
function updateAviationInfo(year) {
    let heading, paragraph1, paragraph2, citation;
    
    if(year === "2016") {
        heading = "Its emissions may seem modest at <strong>2.2%</strong>, but aviation's true climate impact is nearly twice as large: <strong>4.3%</strong> of global warming.";
        paragraph1 = "We often read that aviation is responsible for only <strong>2.2%</strong> of greenhouse gas emissions in 2016. In reality, this does not take into account non-CO₂ effects.";
        paragraph2 = "Research from the International Council on Clean Transportation (ICCT) shows that non-CO₂ effects account for approximately <strong>half of radiative forcing</strong>, which means the role of commercial aviation accounts for around <strong>4.3%</strong> of global warming.";
        citation = "Source: Lee et al. (2021), The contribution of global aviation to anthropogenic climate forcing. Atmospheric Environment.";
    } else if(year === "2018") {
        heading = "Its emissions may seem modest at <strong>2.4%</strong>, but aviation's true climate impact is nearly twice as large: <strong>4.7%</strong> of global warming.";
        paragraph1 = "We often read that aviation is responsible for only <strong>2.4%</strong> of greenhouse gas emissions in 2018. In reality, this does not take into account non-CO₂ effects.";
        paragraph2 = "Studies from 2018 indicate that non-CO₂ effects account for between <strong>1/2 and 2/3 of radiative forcing</strong>, which means that the role of commercial aviation accounts for around <strong>4.7%</strong> of global warming.";
        citation = "Source: Environmental and Energy Study Institute (EESI), 2022. The Growth in Greenhouse Gas Emissions from Commercial Aviation.";
    } else if(year === "2019") {
        heading = "Its emissions may seem modest at <strong>2.5%</strong>, but aviation's true climate impact is twice as large: <strong>5%</strong> of global warming.";
        paragraph1 = "We often read that aviation is responsible for only <strong>2.5%</strong> of greenhouse gas emissions in 2019. In reality, this does not take into account non-CO₂ effects.";
        paragraph2 = "Today we know that non-CO₂ effects account for between <strong>1/2 and 2/3 of radiative forcing</strong>, which means that the role of commercial aviation accounts for around <strong>5%</strong> of global warming between 2000 and 2019.";
        citation = "Source: Ritchie, H. (2024). What share of global CO₂ emissions come from aviation? Our World in Data.";
    } else if(year === "2020") {
        heading = "Despite reduced travel, aviation's 2020 emissions at <strong>1.8%</strong> still have a disproportionate climate impact of <strong>3.5%</strong> when non-CO₂ effects are included.";
        paragraph1 = "Due to the global pandemic, aviation emissions dropped to <strong>1.8%</strong> of greenhouse gas emissions in 2020. However, even with this reduction, the full climate impact remains understated.";
        paragraph2 = "When accounting for non-CO₂ effects that persist in the atmosphere, aviation's contribution to global warming is approximately <strong>3.5%</strong> - significantly higher than direct emissions suggest.";
        citation = "Source: Klöwer et al. (2021). Quantifying aviation's contribution to global warming. Environmental Research Letters.";
    }
    
    // 获取DOM元素
    const headingEl = document.querySelector('.info-heading');
    const para1El = document.querySelector('.info-text:nth-of-type(1)');
    const para2El = document.querySelector('.info-text:nth-of-type(2)');
    
    // 检查是否存在引用元素，如果不存在则创建
    let citationElement = document.querySelector('.info-citation');
    if (!citationElement) {
        citationElement = document.createElement('p');
        citationElement.className = 'info-citation';
        document.querySelector('.right-column').appendChild(citationElement);
    }
    
    // 使用淡入淡出动画更新文本
    if (headingEl && para1El && para2El) {
        // 首先淡出现有文本
        headingEl.style.transition = 'opacity 0.5s ease';
        para1El.style.transition = 'opacity 0.5s ease';
        para2El.style.transition = 'opacity 0.5s ease';
        citationElement.style.transition = 'opacity 0.5s ease';
        
        headingEl.style.opacity = '0';
        para1El.style.opacity = '0';
        para2El.style.opacity = '0';
        citationElement.style.opacity = '0';
        
        // 短暂延迟后更新内容并淡入
        setTimeout(() => {
            headingEl.innerHTML = heading;
            para1El.innerHTML = paragraph1;
            para2El.innerHTML = paragraph2;
            citationElement.textContent = citation;
            
            // 淡入更新后的内容
            setTimeout(() => {
                headingEl.style.opacity = '1';
                para1El.style.opacity = '1';
                para2El.style.opacity = '1';
                citationElement.style.opacity = '1';
                
                // 添加突出显示效果
                setTimeout(() => {
                    const highlight = document.createElement('span');
                    highlight.className = 'highlight-animation';
                    highlight.style.cssText = `
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(52, 152, 219, 0.1);
                        opacity: 0;
                        z-index: -1;
                        pointer-events: none;
                        border-radius: 8px;
                    `;
                    
                    const rightColumn = document.querySelector('.right-column');
                    if (rightColumn && !rightColumn.querySelector('.highlight-animation')) {
                        rightColumn.style.position = 'relative';
                        rightColumn.appendChild(highlight);
                        
                        // 使用动画突出显示
                        setTimeout(() => {
                            highlight.style.transition = 'opacity 0.8s ease';
                            highlight.style.opacity = '1';
                            
                            setTimeout(() => {
                                highlight.style.opacity = '0';
                                
                                // 动画完成后移除元素
                                setTimeout(() => {
                                    highlight.remove();
                                }, 800);
                            }, 800);
                        }, 100);
                    }
                }, 300);
            }, 50);
        }, 500);
    } else {
        console.warn('Some info text elements not found');
    }
}

/**
 * 获取WRI数据
 */
function getWRISankeyData() {
    // 返回准确匹配WRI图像的数据结构
    return [
        // === 2016 data ===
        // First column to second column: Energy sub-sectors
        {year: "2016", source: "30.4% Energy: Electricity and Heat", target: "Residential Buildings", value: 10.9},
        {year: "2016", source: "30.4% Energy: Electricity and Heat", target: "Commercial Buildings", value: 6.6},
        {year: "2016", source: "30.4% Energy: Electricity and Heat", target: "Unallocated Fuel Combustion", value: 7.8},
        {year: "2016", source: "30.4% Energy: Electricity and Heat", target: "Iron & Steel", value: 7.2},
        {year: "2016", source: "15.9% Energy: Transportation", target: "Road", value: 11.9},
        {year: "2016", source: "15.9% Energy: Transportation", target: "Air", value: 1.9},
        {year: "2016", source: "15.9% Energy: Transportation", target: "Rail, Ship & Pipeline", value: 2.1},
        {year: "2016", source: "5.5% Energy: Buildings", target: "Agriculture & Fishing Energy Use", value: 1.7},
        {year: "2016", source: "5.5% Energy: Buildings", target: "Coal", value: 1.0},
        {year: "2016", source: "3% Energy: Other Fuel Combustion", target: "Other Fuel Combustion", value: 3.0},
        {year: "2016", source: "12.4% Energy: Manufacturing and Construction", target: "Chemical and Petrochemical", value: 5.8},
        {year: "2016", source: "12.4% Energy: Manufacturing and Construction", target: "Other Industry", value: 10.6},
        {year: "2016", source: "5.8% Energy: Fugitive Emissions", target: "Oil and Natural Gas", value: 3.8},
        
        // First column to second column: Other departments
        {year: "2016", source: "5.6% Industrial Processes", target: "Cement", value: 3.0},
        {year: "2016", source: "5.6% Industrial Processes", target: "Other Industry Processes", value: 2.6},
        
        {year: "2016", source: "11.8% Agriculture", target: "Livestock & Manure", value: 5.8},
        {year: "2016", source: "11.8% Agriculture", target: "Rice Cultivation", value: 1.3},
        {year: "2016", source: "11.8% Agriculture", target: "Agriculture Soils", value: 4.1},
        
        {year: "2016", source: "6.5% Land Use Change and Forestry", target: "Burning", value: 3.5},
        {year: "2016", source: "6.5% Land Use Change and Forestry", target: "Forest Land", value: 2.0},
        {year: "2016", source: "6.5% Land Use Change and Forestry", target: "Cropland", value: 1.0},
        
        {year: "2016", source: "3.2% Waste", target: "Landfills", value: 1.9},
        {year: "2016", source: "3.2% Waste", target: "Wastewater", value: 1.3},
        
        // Second column to third column: All sub-sectors to gas type - 2016
        // Building and energy use
        {year: "2016", source: "Residential Buildings", target: "CO2", value: 9.3},
        {year: "2016", source: "Residential Buildings", target: "CH4", value: 1.0},
        {year: "2016", source: "Residential Buildings", target: "N2O", value: 0.6},
        
        {year: "2016", source: "Commercial Buildings", target: "CO2", value: 5.8},
        {year: "2016", source: "Commercial Buildings", target: "CH4", value: 0.5},
        {year: "2016", source: "Commercial Buildings", target: "N2O", value: 0.3},
        
        // Industrial and manufacturing
        {year: "2016", source: "Unallocated Fuel Combustion", target: "CO2", value: 7.0},
        {year: "2016", source: "Unallocated Fuel Combustion", target: "CH4", value: 0.5},
        {year: "2016", source: "Unallocated Fuel Combustion", target: "N2O", value: 0.3},
        
        {year: "2016", source: "Iron & Steel", target: "CO2", value: 6.8},
        {year: "2016", source: "Iron & Steel", target: "CH4", value: 0.3},
        {year: "2016", source: "Iron & Steel", target: "N2O", value: 0.1},
        
        {year: "2016", source: "Chemical and Petrochemical", target: "CO2", value: 5.0},
        {year: "2016", source: "Chemical and Petrochemical", target: "CH4", value: 0.5},
        {year: "2016", source: "Chemical and Petrochemical", target: "N2O", value: 0.3},
        
        {year: "2016", source: "Other Industry", target: "CO2", value: 8.6},
        {year: "2016", source: "Other Industry", target: "CH4", value: 0.8},
        {year: "2016", source: "Other Industry", target: "N2O", value: 0.4},
        {year: "2016", source: "Other Industry", target: "F-gases", value: 0.8},
        
        {year: "2016", source: "Other Fuel Combustion", target: "CO2", value: 2.5},
        {year: "2016", source: "Other Fuel Combustion", target: "CH4", value: 0.3},
        {year: "2016", source: "Other Fuel Combustion", target: "N2O", value: 0.2},
        
        // Energy use and mining
        {year: "2016", source: "Agriculture & Fishing Energy Use", target: "CO2", value: 1.5},
        {year: "2016", source: "Agriculture & Fishing Energy Use", target: "CH4", value: 0.1},
        {year: "2016", source: "Agriculture & Fishing Energy Use", target: "N2O", value: 0.1},
        
        {year: "2016", source: "Coal", target: "CO2", value: 0.3},
        {year: "2016", source: "Coal", target: "CH4", value: 0.7},
        
        // Transportation department
        {year: "2016", source: "Road", target: "CO2", value: 11.3},
        {year: "2016", source: "Road", target: "CH4", value: 0.1},
        {year: "2016", source: "Road", target: "N2O", value: 0.5},
        
        {year: "2016", source: "Rail, Ship & Pipeline", target: "CO2", value: 2.1},
        {year: "2016", source: "Air", target: "CO2", value: 1.9},
        
        // Other industries
        {year: "2016", source: "Oil and Natural Gas", target: "CO2", value: 0.8},
        {year: "2016", source: "Oil and Natural Gas", target: "CH4", value: 3.0},
        
        // Industrial processes
        {year: "2016", source: "Cement", target: "CO2", value: 2.9},
        {year: "2016", source: "Cement", target: "N2O", value: 0.1},
        
        {year: "2016", source: "Other Industry Processes", target: "CO2", value: 1.0},
        {year: "2016", source: "Other Industry Processes", target: "CH4", value: 0.2},
        {year: "2016", source: "Other Industry Processes", target: "N2O", value: 0.2},
        {year: "2016", source: "Other Industry Processes", target: "F-gases", value: 1.2},
        
        // Agriculture department
        {year: "2016", source: "Livestock & Manure", target: "CH4", value: 5.0},
        {year: "2016", source: "Livestock & Manure", target: "N2O", value: 0.8},
        
        {year: "2016", source: "Agriculture Soils", target: "N2O", value: 3.8},
        {year: "2016", source: "Agriculture Soils", target: "CO2", value: 0.3},
        
        {year: "2016", source: "Rice Cultivation", target: "CH4", value: 1.3},
        
        // Land use change and waste
        {year: "2016", source: "Burning", target: "CO2", value: 2.0},
        {year: "2016", source: "Burning", target: "CH4", value: 0.9},
        {year: "2016", source: "Burning", target: "N2O", value: 0.6},
        
        {year: "2016", source: "Forest Land", target: "CO2", value: 2.0},
        
        {year: "2016", source: "Cropland", target: "CO2", value: 0.6},
        {year: "2016", source: "Cropland", target: "CH4", value: 0.2},
        {year: "2016", source: "Cropland", target: "N2O", value: 0.2},
        
        {year: "2016", source: "Landfills", target: "CH4", value: 1.9},
        
        {year: "2016", source: "Wastewater", target: "CH4", value: 0.9},
        {year: "2016", source: "Wastewater", target: "N2O", value: 0.4},
        
        // === 2018 data ===
        // First column to second column: Energy sub-sectors
        {year: "2018", source: "31.9% Energy: Electricity and Heat", target: "Residential Buildings", value: 11.4},
        {year: "2018", source: "31.9% Energy: Electricity and Heat", target: "Commercial Buildings", value: 6.7},
        {year: "2018", source: "31.9% Energy: Electricity and Heat", target: "Unallocated Fuel Combustion", value: 8.0},
        {year: "2018", source: "31.9% Energy: Electricity and Heat", target: "Iron and steel", value: 5.8},
        {year: "2018", source: "5.9% Energy: Buildings", target: "Agriculture & Fishing Energy Use", value: 1.9},
        {year: "2018", source: "5.9% Energy: Buildings", target: "Non-ferrous metals", value: 1.8},
        {year: "2018", source: "5.9% Energy: Buildings", target: "Non-metallic minerals", value: 2.2},
        {year: "2018", source: "5% Energy: Other Fuel Combustion", target: "Other Fuel Combustion", value: 5.0},
        {year: "2018", source: "12.6% Energy: Manufacturing and Construction", target: "Chemical and petrochemical", value: 6.3},
        {year: "2018", source: "12.6% Energy: Manufacturing and Construction", target: "Other Industry", value: 4.5},
        {year: "2018", source: "14.2% Energy: Transportation", target: "Road", value: 12.5},
        {year: "2018", source: "14.2% Energy: Transportation", target: "Air", value: 2.1},
        {year: "2018", source: "14.2% Energy: Transportation", target: "Ship", value: 1.6},
        {year: "2018", source: "2.7% Energy: International Bunker", target: "Coal", value: 0.7},
        {year: "2018", source: "5.9% Energy: Fugitive Emissions", target: "Oil and Natural Gas", value: 3.9},
        
        // First column to second column: Other departments
        {year: "2018", source: "5.9% Industrial Processes", target: "Cement", value: 3.1},
        {year: "2018", source: "5.9% Industrial Processes", target: "Other Industry Processes", value: 2.8},
        
        {year: "2018", source: "11.9% Agriculture", target: "Livestock & Manure", value: 5.9},
        {year: "2018", source: "11.9% Agriculture", target: "Agriculture Soils", value: 4.2},
        {year: "2018", source: "11.9% Agriculture", target: "Rice Cultivation", value: 1.3},
        {year: "2018", source: "11.9% Agriculture", target: "Burning", value: 0.3},
        
        {year: "2018", source: "2.8% Land Use Change and Forestry", target: "Cropland", value: 1.4},
        
        {year: "2018", source: "3.3% Waste", target: "Landfills", value: 2.0},
        {year: "2018", source: "3.3% Waste", target: "Wastewater", value: 1.3},
        
        // Second column to third column: All sub-sectors to gas type - 2018
        // Building and energy use
        {year: "2018", source: "Residential Buildings", target: "CO2", value: 9.5},
        {year: "2018", source: "Residential Buildings", target: "CH4", value: 1.2},
        {year: "2018", source: "Residential Buildings", target: "N2O", value: 0.7},
        
        {year: "2018", source: "Commercial Buildings", target: "CO2", value: 6.0},
        {year: "2018", source: "Commercial Buildings", target: "CH4", value: 0.4},
        {year: "2018", source: "Commercial Buildings", target: "N2O", value: 0.3},
        
        // Industrial and manufacturing
        {year: "2018", source: "Unallocated Fuel Combustion", target: "CO2", value: 7.2},
        {year: "2018", source: "Unallocated Fuel Combustion", target: "CH4", value: 0.5},
        {year: "2018", source: "Unallocated Fuel Combustion", target: "N2O", value: 0.3},
        
        {year: "2018", source: "Iron and steel", target: "CO2", value: 5.5},
        {year: "2018", source: "Iron and steel", target: "CH4", value: 0.2},
        {year: "2018", source: "Iron and steel", target: "N2O", value: 0.1},
        
        {year: "2018", source: "Chemical and petrochemical", target: "CO2", value: 5.4},
        {year: "2018", source: "Chemical and petrochemical", target: "CH4", value: 0.5},
        {year: "2018", source: "Chemical and petrochemical", target: "N2O", value: 0.4},
        
        {year: "2018", source: "Other Industry", target: "CO2", value: 3.6},
        {year: "2018", source: "Other Industry", target: "CH4", value: 0.5},
        {year: "2018", source: "Other Industry", target: "N2O", value: 0.2},
        {year: "2018", source: "Other Industry", target: "F-gases", value: 0.2},
        
        {year: "2018", source: "Other Fuel Combustion", target: "CO2", value: 4.3},
        {year: "2018", source: "Other Fuel Combustion", target: "CH4", value: 0.4},
        {year: "2018", source: "Other Fuel Combustion", target: "N2O", value: 0.3},
        
        // Energy use and mining
        {year: "2018", source: "Agriculture & Fishing Energy Use", target: "CO2", value: 1.7},
        {year: "2018", source: "Agriculture & Fishing Energy Use", target: "CH4", value: 0.1},
        {year: "2018", source: "Agriculture & Fishing Energy Use", target: "N2O", value: 0.1},
        
        {year: "2018", source: "Non-ferrous metals", target: "CO2", value: 1.6},
        {year: "2018", source: "Non-ferrous metals", target: "CH4", value: 0.1},
        {year: "2018", source: "Non-ferrous metals", target: "N2O", value: 0.1},
        
        {year: "2018", source: "Non-metallic minerals", target: "CO2", value: 3.4},
        {year: "2018", source: "Non-metallic minerals", target: "CH4", value: 0.2},
        {year: "2018", source: "Non-metallic minerals", target: "N2O", value: 0.1},
        
        // Transportation department
        {year: "2018", source: "Road", target: "CO2", value: 11.8},
        {year: "2018", source: "Road", target: "CH4", value: 0.1},
        {year: "2018", source: "Road", target: "N2O", value: 0.6},
        
        {year: "2018", source: "Air", target: "CO2", value: 1.9},
        {year: "2018", source: "Air", target: "N2O", value: 0.2},
        
        {year: "2018", source: "Ship", target: "CO2", value: 1.5},
        {year: "2018", source: "Ship", target: "CH4", value: 0.05},
        {year: "2018", source: "Ship", target: "N2O", value: 0.05},
        
        // Other industries
        {year: "2018", source: "Coal", target: "CO2", value: 0.2},
        {year: "2018", source: "Coal", target: "CH4", value: 0.5},
        
        {year: "2018", source: "Oil and Natural Gas", target: "CO2", value: 0.7},
        {year: "2018", source: "Oil and Natural Gas", target: "CH4", value: 3.2},
        
        // Industrial processes
        {year: "2018", source: "Cement", target: "CO2", value: 3.0},
        {year: "2018", source: "Cement", target: "N2O", value: 0.1},
        
        {year: "2018", source: "Other Industry Processes", target: "CO2", value: 1.3},
        {year: "2018", source: "Other Industry Processes", target: "CH4", value: 0.2},
        {year: "2018", source: "Other Industry Processes", target: "N2O", value: 0.3},
        {year: "2018", source: "Other Industry Processes", target: "F-gases", value: 1.0},
        
        // Agriculture department
        {year: "2018", source: "Livestock & Manure", target: "CH4", value: 5.1},
        {year: "2018", source: "Livestock & Manure", target: "N2O", value: 0.8},
        
        {year: "2018", source: "Agriculture Soils", target: "N2O", value: 3.9},
        {year: "2018", source: "Agriculture Soils", target: "CO2", value: 0.3},
        
        {year: "2018", source: "Rice Cultivation", target: "CH4", value: 1.3},
        
        {year: "2018", source: "Burning", target: "CH4", value: 0.2},
        {year: "2018", source: "Burning", target: "N2O", value: 0.1},
        
        // Land use change and waste
        {year: "2018", source: "Cropland", target: "CO2", value: 0.8},
        {year: "2018", source: "Cropland", target: "CH4", value: 0.2},
        {year: "2018", source: "Cropland", target: "N2O", value: 0.4},
        
        {year: "2018", source: "Landfills", target: "CO2", value: 0.1},
        {year: "2018", source: "Landfills", target: "CH4", value: 1.9},

        {year: "2018", source: "Wastewater", target: "CH4", value: 0.9},
        {year: "2018", source: "Wastewater", target: "N2O", value: 0.4},
        
        // === 2019 data ===
        // First column to second column: Energy sub-sectors
        {year: "2019", source: "31.8% Energy: Electricity and Heat", target: "Residential Buildings", value: 11.5},
        {year: "2019", source: "31.8% Energy: Electricity and Heat", target: "Commercial Buildings", value: 6.5},
        {year: "2019", source: "31.8% Energy: Electricity and Heat", target: "Unallocated Fuel Combustion", value: 6.9},
        {year: "2019", source: "31.8% Energy: Electricity and Heat", target: "Iron and steel", value: 6.1},
        {year: "2019", source: "12.7% Energy: Manufacturing and Construction", target: "Chemical and petrochemical", value: 6.1},
        {year: "2019", source: "12.7% Energy: Manufacturing and Construction", target: "Machinery", value: 1.5},
        {year: "2019", source: "12.7% Energy: Manufacturing and Construction", target: "Other Industry", value: 4.5},
        {year: "2019", source: "6.2% Energy: Buildings", target: "Agriculture & Fishing Energy Use", value: 1.9},
        {year: "2019", source: "6.2% Energy: Buildings", target: "Mining and quarrying", value: 0.8},
        {year: "2019", source: "6.2% Energy: Buildings", target: "Non-metallic minerals", value: 3.1},
        {year: "2019", source: "14.3% Energy: Transportation", target: "Road", value: 12.6},
        {year: "2019", source: "14.3% Energy: Transportation", target: "Air", value: 2.1},
        {year: "2019", source: "14.3% Energy: Transportation", target: "Ship", value: 1.8},
        {year: "2019", source: "2.6% Energy: International Bunker", target: "Paper, pulp and printing", value: 0.7},
        {year: "2019", source: "6.8% Energy: Fugitive Emissions", target: "Vented", value: 4.4},
        
        // First column to second column: Other departments
        {year: "2019", source: "6.1% Industrial Processes", target: "Cement", value: 3.2},
        
        {year: "2019", source: "11.6% Agriculture", target: "Livestock & Manure", value: 5.8},
        {year: "2019", source: "11.6% Agriculture", target: "Rice Cultivation", value: 1.2},
        {year: "2019", source: "11.6% Agriculture", target: "Agriculture Soils", value: 4.1},
        
        {year: "2019", source: "3.3% Land Use Change and Forestry", target: "Drained organic soils", value: 1.5},
        
        {year: "2019", source: "3.0% Waste", target: "Landfills", value: 2.0},
        
        // Second column to third column: All sub-sectors to gas type
        // Building and energy use
        {year: "2019", source: "Residential Buildings", target: "CO2", value: 9.8},
        {year: "2019", source: "Residential Buildings", target: "CH4", value: 1.0},
        {year: "2019", source: "Residential Buildings", target: "N2O", value: 0.7},
        
        {year: "2019", source: "Commercial Buildings", target: "CO2", value: 5.9},
        {year: "2019", source: "Commercial Buildings", target: "CH4", value: 0.3},
        {year: "2019", source: "Commercial Buildings", target: "N2O", value: 0.3},
        
        // Industrial and manufacturing
        {year: "2019", source: "Unallocated Fuel Combustion", target: "CO2", value: 6.3},
        {year: "2019", source: "Unallocated Fuel Combustion", target: "CH4", value: 0.4},
        {year: "2019", source: "Unallocated Fuel Combustion", target: "N2O", value: 0.2},
        
        {year: "2019", source: "Iron and steel", target: "CO2", value: 5.8},
        {year: "2019", source: "Iron and steel", target: "CH4", value: 0.2},
        {year: "2019", source: "Iron and steel", target: "N2O", value: 0.1},
        
        {year: "2019", source: "Chemical and petrochemical", target: "CO2", value: 5.2},
        {year: "2019", source: "Chemical and petrochemical", target: "CH4", value: 0.5},
        {year: "2019", source: "Chemical and petrochemical", target: "N2O", value: 0.4},
        
        {year: "2019", source: "Machinery", target: "CO2", value: 1.3},
        {year: "2019", source: "Machinery", target: "CH4", value: 0.1},
        {year: "2019", source: "Machinery", target: "N2O", value: 0.1},
        
        {year: "2019", source: "Other Industry", target: "CO2", value: 3.6},
        {year: "2019", source: "Other Industry", target: "CH4", value: 0.5},
        {year: "2019", source: "Other Industry", target: "N2O", value: 0.2},
        {year: "2019", source: "Other Industry", target: "F-gases", value: 0.2},
        
        // Energy use and mining
        {year: "2019", source: "Agriculture & Fishing Energy Use", target: "CO2", value: 1.7},
        {year: "2019", source: "Agriculture & Fishing Energy Use", target: "CH4", value: 0.1},
        {year: "2019", source: "Agriculture & Fishing Energy Use", target: "N2O", value: 0.1},
        
        {year: "2019", source: "Mining and quarrying", target: "CO2", value: 0.7},
        {year: "2019", source: "Mining and quarrying", target: "CH4", value: 0.1},
        
        {year: "2019", source: "Non-metallic minerals", target: "CO2", value: 2.9},
        {year: "2019", source: "Non-metallic minerals", target: "CH4", value: 0.1},
        {year: "2019", source: "Non-metallic minerals", target: "N2O", value: 0.1},
        
        // Transportation department
        {year: "2019", source: "Road", target: "CO2", value: 11.9},
        {year: "2019", source: "Road", target: "CH4", value: 0.1},
        {year: "2019", source: "Road", target: "N2O", value: 0.6},
        
        {year: "2019", source: "Air", target: "CO2", value: 1.9},
        {year: "2019", source: "Air", target: "N2O", value: 0.2},
        
        {year: "2019", source: "Ship", target: "CO2", value: 1.7},
        {year: "2019", source: "Ship", target: "CH4", value: 0.05},
        {year: "2019", source: "Ship", target: "N2O", value: 0.05},
        
        // Other industries
        {year: "2019", source: "Paper, pulp and printing", target: "CO2", value: 0.6},
        {year: "2019", source: "Paper, pulp and printing", target: "CH4", value: 0.05},
        {year: "2019", source: "Paper, pulp and printing", target: "N2O", value: 0.05},
        
        {year: "2019", source: "Vented", target: "CO2", value: 0.8},
        {year: "2019", source: "Vented", target: "CH4", value: 3.6},
        
        // Industrial processes
        {year: "2019", source: "Cement", target: "CO2", value: 3.1},
        {year: "2019", source: "Cement", target: "N2O", value: 0.1},
        
        // Agriculture department
        {year: "2019", source: "Livestock & Manure", target: "CH4", value: 5.0},
        {year: "2019", source: "Livestock & Manure", target: "N2O", value: 0.8},
        
        {year: "2019", source: "Rice Cultivation", target: "CH4", value: 1.2},
        
        {year: "2019", source: "Agriculture Soils", target: "N2O", value: 3.8},
        {year: "2019", source: "Agriculture Soils", target: "CO2", value: 0.3},
        
        // Land use change
        {year: "2019", source: "Drained organic soils", target: "CO2", value: 0.4},
        {year: "2019", source: "Drained organic soils", target: "CH4", value: 0.2},
        {year: "2019", source: "Drained organic soils", target: "N2O", value: 0.9},
        
        // Waste
        {year: "2019", source: "Landfills", target: "CO2", value: 0.1},
        {year: "2019", source: "Landfills", target: "CH4", value: 1.9},

        // === 2020 data ===
        // First column to second column: Energy sub-sectors
        {year: "2020", source: "32% Energy: Electricity and Heat", target: "Residential Buildings", value: 11.5},
        {year: "2020", source: "32% Energy: Electricity and Heat", target: "Commercial Buildings", value: 6.7},
        {year: "2020", source: "32% Energy: Electricity and Heat", target: "Unallocated Fuel Combustion", value: 6.8},
        {year: "2020", source: "32% Energy: Electricity and Heat", target: "Iron and steel", value: 6.2},
        {year: "2020", source: "13.1% Energy: Manufacturing and Construction", target: "Chemical and petrochemical", value: 6.6},
        {year: "2020", source: "13.1% Energy: Manufacturing and Construction", target: "Non-metallic minerals", value: 3.2},
        {year: "2020", source: "13.1% Energy: Manufacturing and Construction", target: "Other Industry", value: 4.5},
        {year: "2020", source: "6.3% Energy: Buildings", target: "Agriculture & Fishing Energy Use", value: 1.9},
        {year: "2020", source: "6.3% Energy: Buildings", target: "Mining and quarrying", value: 0.7},
        {year: "2020", source: "6.3% Energy: Buildings", target: "Non-ferrous metals", value: 1.9},
        {year: "2020", source: "6.3% Energy: Buildings", target: "Machinery", value: 1.6},
        {year: "2020", source: "13.4% Energy: Transportation", target: "Road", value: 12.0},
        {year: "2020", source: "13.4% Energy: Transportation", target: "Ship", value: 1.7},
        {year: "2020", source: "13.4% Energy: Transportation", target: "Air", value: 1.2},
        {year: "2020", source: "6.8% Energy: Fugitive Emissions", target: "Vented", value: 4.5},
        
        // First column to second column: Other departments
        {year: "2020", source: "6.6% Industrial Processes", target: "Cement", value: 3.4},
        
        {year: "2020", source: "12.3% Agriculture", target: "Livestock & Manure", value: 6.2},
        {year: "2020", source: "12.3% Agriculture", target: "Rice Cultivation", value: 1.3},
        {year: "2020", source: "12.3% Agriculture", target: "Agriculture Soils", value: 4.4},
        
        {year: "2020", source: "3.5% Waste", target: "Landfills", value: 2.1},
        {year: "2020", source: "3.5% Waste", target: "Drained organic soils", value: 1.7},
        
        // Second column to third column: All sub-sectors to gas type
        // Building and energy use - 2020
        {year: "2020", source: "Residential Buildings", target: "CO2", value: 9.7},
        {year: "2020", source: "Residential Buildings", target: "CH4", value: 1.1},
        {year: "2020", source: "Residential Buildings", target: "N2O", value: 0.7},
        
        {year: "2020", source: "Commercial Buildings", target: "CO2", value: 6.0},
        {year: "2020", source: "Commercial Buildings", target: "CH4", value: 0.4},
        {year: "2020", source: "Commercial Buildings", target: "N2O", value: 0.3},
        
        // Industrial and manufacturing - 2020
        {year: "2020", source: "Unallocated Fuel Combustion", target: "CO2", value: 6.2},
        {year: "2020", source: "Unallocated Fuel Combustion", target: "CH4", value: 0.4},
        {year: "2020", source: "Unallocated Fuel Combustion", target: "N2O", value: 0.2},
        
        {year: "2020", source: "Iron and steel", target: "CO2", value: 5.9},
        {year: "2020", source: "Iron and steel", target: "CH4", value: 0.2},
        {year: "2020", source: "Iron and steel", target: "N2O", value: 0.1},
        
        {year: "2020", source: "Chemical and petrochemical", target: "CO2", value: 5.7},
        {year: "2020", source: "Chemical and petrochemical", target: "CH4", value: 0.5},
        {year: "2020", source: "Chemical and petrochemical", target: "N2O", value: 0.4},
        
        {year: "2020", source: "Non-metallic minerals", target: "CO2", value: 3.0},
        {year: "2020", source: "Non-metallic minerals", target: "CH4", value: 0.1},
        {year: "2020", source: "Non-metallic minerals", target: "N2O", value: 0.1},
        
        {year: "2020", source: "Non-ferrous metals", target: "CO2", value: 1.8},
        {year: "2020", source: "Non-ferrous metals", target: "CH4", value: 0.05},
        {year: "2020", source: "Non-ferrous metals", target: "N2O", value: 0.05},
        
        {year: "2020", source: "Machinery", target: "CO2", value: 1.4},
        {year: "2020", source: "Machinery", target: "CH4", value: 0.1},
        {year: "2020", source: "Machinery", target: "N2O", value: 0.1},
        
        {year: "2020", source: "Other Industry", target: "CO2", value: 3.6},
        {year: "2020", source: "Other Industry", target: "CH4", value: 0.5},
        {year: "2020", source: "Other Industry", target: "N2O", value: 0.2},
        {year: "2020", source: "Other Industry", target: "F-gases", value: 0.2},
        
        // Energy use and mining - 2020
        {year: "2020", source: "Agriculture & Fishing Energy Use", target: "CO2", value: 1.7},
        {year: "2020", source: "Agriculture & Fishing Energy Use", target: "CH4", value: 0.1},
        {year: "2020", source: "Agriculture & Fishing Energy Use", target: "N2O", value: 0.1},
        
        {year: "2020", source: "Mining and quarrying", target: "CO2", value: 0.6},
        {year: "2020", source: "Mining and quarrying", target: "CH4", value: 0.1},
        
        // Transportation department - 2020
        {year: "2020", source: "Road", target: "CO2", value: 11.4},
        {year: "2020", source: "Road", target: "CH4", value: 0.1},
        {year: "2020", source: "Road", target: "N2O", value: 0.5},
        
        {year: "2020", source: "Air", target: "CO2", value: 1.1},
        {year: "2020", source: "Air", target: "N2O", value: 0.1},
        
        {year: "2020", source: "Ship", target: "CO2", value: 1.6},
        {year: "2020", source: "Ship", target: "CH4", value: 0.05},
        {year: "2020", source: "Ship", target: "N2O", value: 0.05},
        
        // Other industries - 2020
        {year: "2020", source: "Vented", target: "CO2", value: 0.9},
        {year: "2020", source: "Vented", target: "CH4", value: 3.6},
        
        // Industrial processes - 2020
        {year: "2020", source: "Cement", target: "CO2", value: 3.3},
        {year: "2020", source: "Cement", target: "N2O", value: 0.1},
        
        // Agriculture department - 2020
        {year: "2020", source: "Livestock & Manure", target: "CH4", value: 5.4},
        {year: "2020", source: "Livestock & Manure", target: "N2O", value: 0.8},
        
        {year: "2020", source: "Rice Cultivation", target: "CH4", value: 1.3},
        
        {year: "2020", source: "Agriculture Soils", target: "N2O", value: 4.1},
        {year: "2020", source: "Agriculture Soils", target: "CO2", value: 0.3},
        
        // Land use change and waste - 2020
        {year: "2020", source: "Drained organic soils", target: "CO2", value: 0.5},
        {year: "2020", source: "Drained organic soils", target: "CH4", value: 0.3},
        {year: "2020", source: "Drained organic soils", target: "N2O", value: 0.9},
        
        {year: "2020", source: "Landfills", target: "CO2", value: 0.1},
        {year: "2020", source: "Landfills", target: "CH4", value: 2.0}
    ];
}

/**
 * 处理WRI数据
 */
function processWRIData(data) {
    // 创建节点映射和链接数据
    const nodeMap = new Map();
    const nodes = [];
    
    // 处理所有数据点以提取唯一的节点
    data.forEach(d => {
        if (!nodeMap.has(d.source)) {
            // 确定主要部门节点（第一级）类别和列
            const category = determineCategory(d.source);
            nodeMap.set(d.source, {
                name: d.source,
                category: category,
                column: 0
            });
        }
        
        if (!nodeMap.has(d.target)) {
            // 确定目标节点类别和列
            let targetCategory, targetColumn;
            
            if (['CO2', 'CH4', 'N2O', 'F-gases'].includes(d.target)) {
                // 气体类型是第三列
                targetCategory = 'Greenhouse Gases';
                targetColumn = 2;
            } else {
                // 子部门是第二列
                // 从源节点推断类别
                const sourceNode = nodeMap.get(d.source);
                targetCategory = sourceNode ? sourceNode.category : 'Other';
                targetColumn = 1;
            }
            
            nodeMap.set(d.target, {
                name: d.target,
                category: targetCategory,
                column: targetColumn
            });
        }
    });
    
    // 将Map转换为数组
    nodeMap.forEach(node => {
        nodes.push(node);
    });
    
    // 创建链接数组
    const links = data.map(d => ({
        source: d.source,
        target: d.target,
        value: d.value
    }));
    
    return { nodes, links };
}

/**
 * 根据节点名称确定类别
 */
function determineCategory(nodeName) {
    // Energy sub-sectors
    if (nodeName.includes('Energy:')) return 'Energy';
    
    // Other main sectors
    if (nodeName.includes('Industrial Processes')) return 'Industrial Processes';
    if (nodeName.includes('Agriculture')) return 'Agriculture';
    if (nodeName.includes('Land Use Change')) return 'Land-Use Change and Forestry';
    if (nodeName.includes('Waste')) return 'Waste';
    
    // Sub-sector categories
    if (['Residential Buildings', 'Commercial Buildings', 'Unallocated Fuel Combustion', 
         'Iron and steel', 'Iron & Steel', 'Chemical and petrochemical', 'Chemical and Petrochemical', 
         'Machinery', 'Other Industry', 'Agriculture & Fishing Energy Use', 'Mining and quarrying', 
         'Non-metallic minerals', 'Non-ferrous metals', 'Road', 'Air', 'Ship', 'Rail, Air, Ship & Pipeline',
         'Paper, pulp and printing', 'Vented', 'Other Fuel Combustion', 'Coal', 'Oil and Natural Gas'].includes(nodeName)) {
        return 'Energy';
    }
    
    if (['Cement', 'Other Industry Processes'].includes(nodeName)) {
        return 'Industrial Processes';
    }
    
    if (['Livestock & Manure', 'Rice Cultivation', 'Agriculture Soils', 'Burning'].includes(nodeName)) {
        return 'Agriculture';
    }
    
    if (['Drained organic soils', 'Cropland', 'Forest Land'].includes(nodeName)) {
        return 'Land-Use Change and Forestry';
    }
    
    if (['Landfills', 'Wastewater'].includes(nodeName)) {
        return 'Waste';
    }
    
    // If it's a gas
    if (['CO2', 'CH4', 'N2O', 'F-gases'].includes(nodeName)) {
        return 'Greenhouse Gases';
    }
    
    // Default return other
    return 'Other';
}

/**
 * 渲染桑基图
 */
function renderSankeyDiagram(nodes, links) {
    console.log('Rendering Sankey diagram with nodes:', nodes.length, 'links:', links.length);
    
    // 检查容器是否存在
    const container = document.getElementById('sankey-container');
    if (!container) {
        console.error("Sankey container not found!");
        return;
    }
    
    // 检查D3和D3-Sankey是否可用
    if (typeof d3 === 'undefined') {
        console.error("D3.js is not loaded! Cannot render Sankey diagram");
        return;
    }
    
    if (typeof d3.sankey === 'undefined') {
        console.error("D3-Sankey is not loaded! Cannot render Sankey diagram");
        return;
    }
    
    try {
        // 克隆节点和链接数据，避免修改原始数据
        const myNodes = JSON.parse(JSON.stringify(nodes));
        const myLinks = JSON.parse(JSON.stringify(links));
        
        // 设置颜色方案
        setupNodeColors(myNodes);
        
        // 先清除容器内的所有元素
        container.innerHTML = '';
        
        // 添加一个加载指示器 - 使用绝对定位确保居中
        const loader = document.createElement('div');
        loader.classList.add('loader');
        container.appendChild(loader);
        
        // 为加载动画添加样式
        const style = document.createElement('style');
        style.textContent = `
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 5px solid rgba(26, 42, 67, 0.1);
                border-radius: 50%;
                border-top-color: #1A2A43;
                animation: spin 1s ease-in-out infinite;
                margin-bottom: 15px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .loading-text {
                font-weight: 600;
            }
            
            .sankey-container-wrapper {
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            .sankey-container-wrapper.loaded {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
        
        // 立即清除所有可能存在的重叠标签和百分比标签
        try {
            d3.selectAll('.node-value, .node-value-top, .value-label, .flow-value, .flow-label, .percentage-badge, .gas-percentage-badge, .gas-total-badge, .big-percentage-badge, .horizontal-label').remove();
        } catch (error) {
            console.warn("Error cleaning up existing elements:", error);
        }
        
        // 获取容器尺寸
        const width = container.clientWidth || 900;
        const height = container.clientHeight || 600;
        
        console.log('Container dimensions:', width, 'x', height);
        
        // 创建包装容器，初始隐藏
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'sankey-container-wrapper';
        wrapperDiv.style.width = '100%';
        wrapperDiv.style.height = '100%';
        wrapperDiv.style.position = 'relative';
        container.appendChild(wrapperDiv);
        
        // 创建SVG
        const svg = d3.select(wrapperDiv)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height])
            .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');
        
        // 添加definition for drop shadow effect
        const defs = svg.append("defs");
        
        // 添加filter for drop shadow
        const filter = defs.append("filter")
            .attr("id", "drop-shadow")
            .attr("height", "130%");
        
        // 添加shadow components
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 3)
            .attr("result", "blur");
        
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 2)
            .attr("dy", 2)
            .attr("result", "offsetBlur");
        
        const filterMerge = filter.append("feMerge");
        filterMerge.append("feMergeNode")
            .attr("in", "offsetBlur");
        filterMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");
        
        // 创建Sankey生成器
        console.log('Creating Sankey generator');
        const sankey = d3.sankey()
            .nodeId(d => d.name)
            .nodeAlign(d3.sankeyLeft) // 使用左对齐布局，更接近参考图像
            .nodeWidth(15)  // 减少节点宽度
            .nodePadding(3) // 略微增加填充以提高可见性
            .extent([[20, 10], [width - 20, height - 10]]);
        
        // 设置颜色 - 使用WRI官方配色方案，增强饱和度
        const colorScale = d3.scaleOrdinal()
            .domain(['Energy', 'Industrial Processes', 'Agriculture', 'Land-Use Change and Forestry', 'Waste', 'Greenhouse Gases'])
            .range(['#F0C808', '#3498db', '#2ecc71', '#8e44ad', '#e74c3c', '#95a5a6']);
        
        // 能源子部门颜色细分
        const energySubColors = {
            '30.4% Energy: Electricity and Heat': '#F0C808',     // 黄色 (2016)
            '31.9% Energy: Electricity and Heat': '#F0C808',     // 黄色 (2018)
            '31.8% Energy: Electricity and Heat': '#F0C808',     // 黄色 (2019)
            '32% Energy: Electricity and Heat': '#F0C808',       // 黄色 (2020)
            '12.6% Energy: Manufacturing and Construction': '#87CEEB',  // 浅蓝色 (2018/2019)
            '12.4% Energy: Manufacturing and Construction': '#87CEEB',  // 浅蓝色 (2016)
            '13.1% Energy: Manufacturing and Construction': '#87CEEB',  // 浅蓝色 (2020)
            '5.5% Energy: Buildings': '#FF9F45',       // 浅橙色 (2016/2018)
            '5.9% Energy: Buildings': '#FF9F45',       // 浅橙色 (2018)
            '6.2% Energy: Buildings': '#FF9F45',       // 浅橙色 (2019)
            '6.3% Energy: Buildings': '#FF9F45',       // 浅橙色 (2020)
            '15.9% Energy: Transportation': '#F4A460',  // 沙棕色 (2016)
            '14.2% Energy: Transportation': '#F4A460',  // 沙棕色 (2018)
            '14.3% Energy: Transportation': '#F4A460',  // 沙棕色 (2019)
            '13.4% Energy: Transportation': '#F4A460',  // 沙棕色 (2020)
            '2.7% Energy: International Bunker': '#FFD700',  // 金色 (2018)
            '2.6% Energy: International Bunker': '#FFD700',  // 金色 (2019)
            '3% Energy: Other Fuel Combustion': '#FFCC99',   // 浅橙色 (2016)
            '5% Energy: Other Fuel Combustion': '#FFCC99',   // 浅橙色 (2018)
            '5.9% Energy: Fugitive Emissions': '#9ACD32',    // 黄绿色 (2018)
            '5.8% Energy: Fugitive Emissions': '#9ACD32',    // 黄绿色 (2016)
            '6.8% Energy: Fugitive Emissions': '#9ACD32'     // 黄绿色 (2019)
        };
        
        // 气体类型颜色 - 匹配WRI
        const gasColors = {
            'CO2': '#7f8c8d',    // 灰色
            'CH4': '#95a5a6',    // 中灰色
            'N2O': '#bdc3c7',    // 浅灰色
            'F-gases': '#ecf0f1' // 最浅灰色
        };
        
        // 处理并复制数据
        const sankeyData = sankey({
            nodes: JSON.parse(JSON.stringify(myNodes)),
            links: JSON.parse(JSON.stringify(myLinks.map(d => ({
                ...d,
                value: d.value || 0.1 // 确保值至少为0.1
            }))))
        });
        
        // 创建一个容器用于链接，并设置裁剪路径
        const linkGroup = svg.append('g')
            .attr('fill', 'none')
            .attr('stroke-opacity', 0.5);
        
        // 创建链接，改进样式
        const link = linkGroup
            .selectAll('.link')
            .data(sankeyData.links)
            .join('g')
            .attr('class', 'link')
            .style('mix-blend-mode', 'multiply');
        
        // 添加渐变到链接
        const gradient = link.append('linearGradient')
            .attr('id', (d, i) => `link-gradient-${i}`)
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', d => d.source.x1)
            .attr('x2', d => d.target.x0);
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', d => {
                if (d.source.category === 'Energy' && d.source.name.includes('Energy:')) {
                    return energySubColors[d.source.name] || colorScale('Energy');
                }
                return d.source.category === 'Greenhouse Gases' 
                    ? gasColors[d.source.name] || colorScale(d.source.category)
                    : colorScale(d.source.category);
            });
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', d => {
                if (d.target.category === 'Greenhouse Gases') {
                    return gasColors[d.target.name] || colorScale(d.target.category);
                }
                return colorScale(d.target.category);
            });
        
        // 绘制链接路径，不再有逐渐显示的动画效果
        const path = link.append('path')
            .attr('class', 'link-path')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', (d, i) => `url(#link-gradient-${i})`)
            .attr('stroke-width', d => Math.max(1, d.width))
            .style('opacity', 0.7) // 不透明度固定，不再有动画
            .attr('data-source', d => d.source.name)
            .attr('data-target', d => d.target.name);
        
        // Add link tooltips
        link.append('title')
            .text(d => `${d.source.name} → ${d.target.name}\n${d.value.toFixed(1)}%`);
        
        // Add a group for flow labels
        const flowLabelsGroup = svg.append('g')
            .attr('class', 'flow-labels')
            .style('opacity', 0);
        
        // Create nodes
        const nodeGroup = svg.append('g');
        
        const node = nodeGroup
            .selectAll('.node')
            .data(sankeyData.nodes)
            .join('g')
            .attr('class', 'node')
            .attr('id', d => `node-${d.name.replace(/[^a-zA-Z0-9]/g, '-')}`)
            .attr('transform', d => `translate(${d.x0},${d.y0})`)
      
        // Add node rectangles with improved styles and interactions,但没有逐渐显示的动画
        node.append('rect')
            .attr('height', d => Math.max(1, d.y1 - d.y0))
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => {
                // Special handling for energy sector
                if (d.category === 'Energy' && d.name.includes('Energy:')) {
                    return energySubColors[d.name] || colorScale('Energy');
                }
                
                // If energy sub-sector, also use energy color
                if (d.category === 'Energy') {
                    return colorScale('Energy'); 
                }
                
                // Gas types use special colors
                if (d.category === 'Greenhouse Gases') {
                    return gasColors[d.name] || colorScale(d.category);
                }
                
                return colorScale(d.category);
            })
            .attr('stroke', '#000')
            .attr('stroke-width', 0.2)
            .attr('rx', 2) // Rounded corners for a more modern look
            .attr('ry', 2)
            .style('cursor', 'pointer')
            .style('opacity', 1); // 设置为1，不使用淡入效果
        
        // Improved interaction for nodes and links with highlighting
        node.on('mouseover', function(event, d) {
            // 高亮相关连接
            highlightConnections(d);
            
            // 显示流值
            showFlowValues(d);
        })
        .on('mouseout', function() {
            // Reset node styling
            d3.select(this).select('rect')
                .transition()
                .duration(500)
                .attr('stroke', '#000')
                .attr('stroke-width', 0.2)
                .style('filter', null);
            
            // Reset all links and hide flow values
            resetHighlights();
            hideFlowValues();
        })
        .on('click', function(event, d) {
            // Toggle persistent highlighting on click
            const isActive = d3.select(this).classed('active');
            
            // First reset everything
            node.classed('active', false);
            node.select('rect')
                .transition()
                .duration(300)
                .attr('stroke', '#000')
                .attr('stroke-width', 0.2)
                .style('filter', null);
            
            resetHighlights();
            hideFlowValues();
            
            // If the node wasn't active before, highlight it
            if (!isActive) {
                d3.select(this).classed('active', true);
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('stroke', '#000')
                    .attr('stroke-width', 1.5)
                    .style('filter', 'url(#drop-shadow)');
                
                highlightConnections(d, true); // persistent highlight
                showFlowValues(d, true); // persistent display
            }
        });
        
        function highlightConnections(d, persistent = false) {
            // 高亮节点
            d3.select('g.node rect[data-name="' + d.name + '"]')
                .transition()
                .duration(200)
                .attr('stroke', '#000')
                .attr('stroke-width', 1.5)
                .style('filter', 'url(#drop-shadow)');
            
            // 高亮与该节点相关的链接
            link.style('stroke-opacity', function(l) {
                if (l.source === d || l.target === d) {
                    return 0.7; // 高亮相关链接
                } else {
                    return 0.1; // 降低不相关链接的透明度
                }
            });
            
            // 高亮相关节点的矩形
            node.select('rect')
                .style('opacity', function(n) {
                    // 相关节点保持完全不透明
                    if (n === d || 
                        sankeyData.links.some(l => (l.source === d && l.target === n) || 
                                                  (l.source === n && l.target === d))) {
                        return 1.0;
                    } else {
                        return 0.3; // 降低不相关节点的透明度
                    }
                });
        }
        
        function showFlowValues(d, persistent = false) {
            // 移除任何现有的流值标签
            flowLabelsGroup.selectAll('*').remove();
            
            // 显示标签
            flowLabelsGroup.style('opacity', 0)
                .transition()
                .duration(300)
                .style('opacity', 1);
            
            // 控制变量，允许显示流值标签
            const showFlowPercentages = true;
            
            // 找出从该节点流出的连接
            const outgoingLinks = sankeyData.links.filter(link => link.source === d);
            // 找出流入该节点的连接
            const incomingLinks = sankeyData.links.filter(link => link.target === d);
            
            // 显示链接值标签
            if (showFlowPercentages) {
                // 处理流出连接
                outgoingLinks.forEach((link, index) => {
                    // 获取连接路径元素
                    const linkPath = d3.select(`path[data-source="${d.name}"][data-target="${link.target.name}"]`).node();
                    if (linkPath) {
                        const pathLength = linkPath.getTotalLength();
                        // 为避免重叠，根据索引分配不同位置
                        const offsetPercent = 0.45 + (index * 0.1); // 45% + 每个链接偏移10%
                        const midPoint = linkPath.getPointAtLength(pathLength * offsetPercent);
                        
                        // 显示百分比值
                        const pct = link.value.toFixed(1);
                        
                        // 添加浅色背景标签
                        flowLabelsGroup.append('rect')
                            .attr('x', midPoint.x - 18)
                            .attr('y', midPoint.y - 15)
                            .attr('width', 36)
                            .attr('height', 18)
                            .attr('rx', 3)
                            .attr('ry', 3)
                            .style('fill', 'rgba(0,0,0,0.7)')
                            .style('opacity', 0.9)
                            .attr('class', 'flow-label-bg');
                        
                        // 添加白色文本标签
                        flowLabelsGroup.append('text')
                            .attr('x', midPoint.x)
                            .attr('y', midPoint.y - 5)
                            .attr('text-anchor', 'middle')
                            .attr('class', 'flow-label')
                            .style('font-size', '11px')
                            .style('font-weight', 'bold')
                            .style('fill', '#fff')
                            .text(`${pct}%`);
                    }
                });
                
                // 处理流入连接
                incomingLinks.forEach((link, index) => {
                    const linkPath = d3.select(`path[data-source="${link.source.name}"][data-target="${d.name}"]`).node();
                    if (linkPath) {
                        const pathLength = linkPath.getTotalLength();
                        // 根据索引放置在不同位置
                        const positionPercent = 0.3 + (index * 0.05);
                        const midPoint = linkPath.getPointAtLength(pathLength * positionPercent);
                        
                        // 显示百分比值
                        const pct = link.value.toFixed(1);
                        
                        // 添加标签背景
                        flowLabelsGroup.append('rect')
                            .attr('x', midPoint.x - 18)
                            .attr('y', midPoint.y - 15)
                            .attr('width', 36)
                            .attr('height', 18)
                            .attr('rx', 3)
                            .attr('ry', 3)
                            .style('fill', 'rgba(0,0,0,0.7)')
                            .style('opacity', 0.9)
                            .attr('class', 'flow-label-bg-small');
                        
                        // 添加标签文本
                        flowLabelsGroup.append('text')
                            .attr('x', midPoint.x)
                            .attr('y', midPoint.y - 5)
                            .attr('text-anchor', 'middle')
                            .attr('class', 'flow-label flow-label-small')
                            .style('font-size', '10px')
                            .style('font-weight', 'bold')
                            .style('fill', '#fff')
                            .style('opacity', 0.9)
                            .text(`${pct}%`);
                    }
                });
            }
        }
        
        // 添加hideFlowValues函数
        function hideFlowValues() {
            // 确保flowLabelsGroup存在
            if (typeof flowLabelsGroup !== 'undefined' && flowLabelsGroup) {
                flowLabelsGroup.selectAll('*').remove();
            }
            
            // 移除任何其他可能的流值标签
            d3.selectAll('.flow-label, .flow-label-bg, .flow-label-bg-small').remove();
        }
        
        function resetHighlights() {
            // 重置节点样式
            node.select('rect')
                .transition()
                .duration(500)
                .attr('stroke', '#000')
                .attr('stroke-width', 0.2)
                .style('filter', null)
                .style('opacity', 1.0);
            
            // 重置链接样式
            link.style('stroke-opacity', 0.4);
            
            // 移除流值标签
            hideFlowValues();
        }
        
        // Add node tooltips
        node.append('title')
            .text(d => {
                if (d.name.includes('Energy:')) {
                    // For energy sub-sectors, show beautified name
                    return `${d.name.split('Energy: ')[1]}\n${d.value.toFixed(1)}%`;
                }
                return `${d.name}\n${d.value.toFixed(1)}%`;
            });
        
        // Add node labels with improved readability
        node.append('text')
            .attr('x', d => d.column === 0 ? 4 : d.column === 2 ? -4 : 0)
            .attr('y', d => (d.y1 - d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.column === 0 ? 'start' : d.column === 2 ? 'end' : 'middle')
            .text(d => {
                // 简化节点名称，去掉百分比前缀
                if (d.column === 0 && d.name.includes('%')) {
                    return d.name.split('%')[1].trim();
                } else if (d.column === 0 && d.name.includes('Energy:')) {
                    return d.name.split('Energy: ')[1];
                }
                return d.name;
            })
            .style('font-size', '10px')
            .style('fill', d => d.column === 0 ? '#fff' : '#000')
            .style('font-weight', d => d.column === 0 || d.column === 2 ? 'bold' : 'normal')
            .style('pointer-events', 'none');
        
        // 立即清除所有可能的中间列标签
        node.filter(d => d.column === 1).selectAll('text').each(function(d, i) {
            if (i > 0) d3.select(this).remove();
        });
        
        // 移除右侧的不合理大百分比标签
        d3.selectAll('.big-percentage-badge').remove();
        
        // 创建一个监听函数，避免百分比错误显示
        function removeInvalidPercentages() {
            // 移除任何大于100%的百分比显示
            d3.selectAll('text.value-label')
                .filter(function() {
                    const text = d3.select(this).text();
                    const percentValue = parseFloat(text);
                    return !isNaN(percentValue) && percentValue > 100;
                })
                .remove();
                
            // 移除右侧不合理的百分比标签盒子
            d3.selectAll('g.percentage-badge').remove();
            
            // 清除所有中间列节点标签
            d3.selectAll('.node-value, .node-value-top, .value-label').remove();
        }
        
        // 添加重置按钮
        const resetButton = d3.select('#sankey-container')
            .append('div')
            .attr('class', 'reset-button')
            .style('position', 'absolute')
            .style('top', '10px')
            .style('right', '10px')
            .style('padding', '5px 10px')
            .style('background-color', '#f8f9fa')
            .style('border', '1px solid #ddd')
            .style('border-radius', '4px')
            .style('cursor', 'pointer')
            .style('font-size', '12px')
            .style('display', 'none')
            .text('Reset View')
            .on('click', function() {
                // Reset all highlights
                node.classed('active', false);
                node.select('rect')
                    .transition()
                    .duration(300)
                    .attr('stroke', '#000')
                    .attr('stroke-width', 0.2)
                    .style('filter', null)
                    .style('opacity', 1);
                
                resetHighlights();
                
                // Hide the reset button
                d3.select(this).style('display', 'none');
            });
        
        // Show reset button when a node is clicked
        node.on('click.resetButton', function() {
            resetButton.style('display', 'block');
        });
        
        // 清理所有标签，确保没有中间节点标签
        cleanupAllLabels();
        
        // 在图表渲染完成后移除错误百分比
        removeInvalidPercentages();
        
        // 缩短等待时间，立即显示图表
        setTimeout(function() {
            // 移除加载指示器
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
            
            // 显示图表
            wrapperDiv.classList.add('loaded');
            
            console.log('Enhanced WRI-style Sankey diagram rendering complete');
            
            // 自动高亮Air流
            setTimeout(() => {
                try {
                    autoHighlightAirFlows();
                } catch (error) {
                    console.warn("Error highlighting air flows:", error);
                }
            }, 500);
        }, 600); // 缩短等待时间到600ms
        
        // Add CSS to the page for better styling
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .link-path {
                transition: opacity 0.3s, stroke-width 0.3s;
            }
            .node rect {
                transition: opacity 0.3s, stroke-width 0.3s, filter 0.3s;
            }
            .reset-button:hover {
                background-color: #e9ecef;
            }
        `;
        document.head.appendChild(styleEl);
        
    } catch (error) {
        console.error("Error creating Sankey diagram:", error);
        // Show error message in container
        container.innerHTML = '<div style="color: red; padding: 20px; text-align: center;">Error rendering Sankey chart.<br>Please check console for details.</div>';
    }
}

// 清除所有标签的函数
function cleanupAllLabels() {
    // 清除所有可能的标签
    d3.selectAll('.node-value, .node-value-top, .value-label, .flow-value, .flow-label, .percentage-badge, .gas-percentage-badge, .gas-total-badge, .big-percentage-badge, .flow-path-panel, .flow-label-bg, .flow-label-bg-small, .horizontal-label').remove();
    
    // 特别清理中间列节点的标签
    d3.selectAll('.node').filter(function(d) { 
        return d && d.column === 1; 
    }).selectAll('text').each(function(d, i) {
        if (i > 0) d3.select(this).remove();
    });
}

// 为节点设置颜色
function setupNodeColors(nodes) {
    // 行业部门颜色
    const sectorColors = {
        'Electricity and Heat': '#8dd3c7',  // 淡青色
        'Transportation': '#ffffb3',        // 淡黄色
        'Buildings': '#bebada',             // 淡紫色
        'Manufacturing and Construction': '#fb8072', // 淡红色
        'International Bunker': '#80b1d3',  // 淡蓝色
        'Fugitive Emissions': '#fdb462',    // 淡橙色
        'Industrial Processes': '#b3de69',  // 淡绿色
        'Agriculture': '#fccde5',           // 淡粉色
        'Land Use Change': '#d9d9d9',       // 淡灰色
        'Waste': '#bc80bd'                  // 紫色
    };
    
    // 气体类型颜色
    const gasColors = {
        'CO2': '#e41a1c',    // 红色
        'CH4': '#377eb8',    // 蓝色
        'N2O': '#4daf4a',    // 绿色
        'F-gases': '#984ea3'  // 紫色
    };
    
    // 为每个节点设置颜色
    nodes.forEach(node => {
        const name = node.name;
        
        // 检查是否是气体类型节点
        if (gasColors[name]) {
            node.color = gasColors[name];
            return;
        }
        
        // 检查行业部门
        for (const [sector, color] of Object.entries(sectorColors)) {
            if (name.includes(sector)) {
                node.color = color;
                return;
            }
        }
        
        // 默认颜色 - 灰色
        node.color = '#a9a9a9';
    });
}

function autoHighlightAirFlows() {
    console.log("Attempting to auto-highlight air flows");
    
    // Find all nodes with "Air" in their name
    const airNodes = document.querySelectorAll('g.node rect');
    let airNodeFound = false;
    
    airNodes.forEach(node => {
        const parentNode = node.parentElement;
        if (parentNode && parentNode.textContent && parentNode.textContent.includes('Air')) {
            console.log("Found Air node, highlighting");
            // Trigger click on the parent node to highlight connections
            const event = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            parentNode.dispatchEvent(event);
            airNodeFound = true;
        }
    });
    
    if (!airNodeFound) {
        console.log("No Air nodes found to highlight");
    }
}