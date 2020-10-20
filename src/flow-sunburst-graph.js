import {BaseElement, html, css, flow, dpc} from './base-element.js';
import {Flowd3Element} from './flow-d3.js';
import {FlowSampler} from './flow-sampler.js';
import {FlowFormat} from './flow-format.js';

d3.selection.prototype.selectAppend = function(name) {
    let t = this.select(name);
    return t.size()?t:this.append(name);
}

let data = 
{"name":"flare","children":[
	{"name":"analytics", "children":[
		{"name":"cluster","children":[
			{"name":"AgglomerativeCluster","value":3938},
			{"name":"CommunityStructure","value":3812},
			{"name":"HierarchicalCluster","value":6714},
			{"name":"MergeEdge","value":743}
		]},
		{"name":"graph","children":[
			{"name":"BetweennessCentrality","value":3534},
			{"name":"LinkDistance","value":5731},
			{"name":"MaxFlowMinCut","value":7840}
		]},
		{"name":"optimization","children":[
			{"name":"AspectRatioBanker","value":7074}
		]}
	]},
	{"name":"animate","children":[
		{"name":"Easing","value":17010},
		{"name":"FunctionSequence","value":5842},
		{"name":"interpolate","children":[
			{"name":"ArrayInterpolator","value":1983},
			{"name":"ColorInterpolator","value":2047},
			{"name":"DateInterpolator","value":1375},
			{"name":"Interpolator","value":8746},
		]},
		{"name":"ISchedulable","value":1041},
		{"name":"Parallel","value":5176},
		{"name":"Pause","value":449},
	]},
	{"name":"data","children":[
		{"name":"converters","children":[
			{"name":"Converters","value":721},
			{"name":"DelimitedTextConverter","value":4294},
			{"name":"GraphMLConverter","value":9800}
		]},
		{"name":"DataField","value":1759},
		{"name":"DataSchema","value":2165},
		{"name":"DataSet","value":586}
	]},
	{"name":"display","children":[
		{"name":"DirtySprite","value":8833},
		{"name":"LineSprite","value":1732}
	]},
	{"name":"flex","children":[
		{"name":"FlareVis","value":4116}
	]},
	{"name":"physics","children":[
		{"name":"DragForce","value":1082},
		{"name":"GravityForce","value":1336},
		{"name":"IForce","value":1319}
	]},
	{"name":"query","children":[
		{"name":"AggregateExpression","value":1616},
		{"name":"And","value":3027}
	]}
]}

/**
* @class FlowSunburstGraph
* @extends Flowd3Element
* @prop {Boolean} noZoom
* @cssvar {color} [--flow-sunburst-graph-text-color="var(--flow-color, #000)"]
* @example
*   <flow-sunburst-graph></flow-sunburst-graph>
*
*/
export class FlowSunburstGraph extends Flowd3Element {
	static get properties() {
		return {
			noZoom:{type:Boolean}
		}
	}

	static get styles(){
		return [Flowd3Element.styles, css`
			:host{
				display:inline-flex;
				font-weight:bold;
				font-size:13px;
				text-transform:uppercase;
				cursor:pointer;
				font-family:var(--flow-data-field-font-family, "Julius Sans One");
				font-weight:var(--flow-data-field-font-weight, bold);
				border-radius: 10px;
				overflow: hidden;
				position:relative;
				width:600px;
				height:600px;
				margin-left:calc(50% - 300px);
			}
			:host([disabled]){opacity:0.5;cursor:default;pointer-events:none;}
			.container{white-space:nowrap;padding:2px 6px 6px 6px;height:100%;}
			.container>div{padding:2px;}
			.suffix{opacity:0.9;margin-left:3px;margin-top:3px; font-size: 10px;}
			.col{display: flex; flex-direction: column; align-items: left;}
			.row{display: flex; flex-direction: row; flex:0;}

			.wrapper {
				position:relative;
				flex:1;
				margin:6px;overflow:hidden;
			}
			
			:host([border]) .wrapper {
				border: 2px solid var(--flow-primary-color,#333);
				box-shadow: 2px 2px 1px rgba(1, 123, 104, 0.1);
				border-radius: 10px;

			}

			.wrapper > div {
				width:100%;height:100%;
				position:relative;left:0px;top:0px;bottom:0px;right:0px;
			}

			.d3-holder{
				min-height:10px;
				min-width:10px;
				opacity:1;
			}
			.wrapper>div.d3-holder{position:absolute;}
			[flex] {
				flex: 1;
			}
			text{fill:var(--flow-sunburst-graph-text-color, var(--flow-color, #000))}
			path{cursor:default}
		`];
	}

	constructor() {
		super();
		this.sampler = '';
		this.svgPreserveAspectRatio = 'xMaxYMax meet';
	}

	onElementResize(){
		super.onElementResize();
		dpc(()=>{
			this.requestUpdate();
		})
	}

	connectedCallback() {
		super.connectedCallback();
		if(this.sampler)
			this.interval = setInterval(this.requestUpdate.bind(this), this.refresh);
	}

	disconnectedCallback() {
		super.disconnectedCallback();

		if(this.interval)
			clearInterval(this.interval);
	}

	render() {

		dpc(()=>{
			this.draw();
		})

		let value = '';
		//this.log("render flow-graph");
		if(this.sampler) {
			let idents = this.sampler.split(':');
			let ident = idents.shift(); 
			let sampler =  FlowSampler.get(ident);
			value = sampler.last() || '';
			if(value !== undefined) { 
				value = FlowFormat[this.format || 'default'](value || 0, this);
			}
		}
		else {
			console.log("no sampler", this);
		}


		return html`
			<div class='wrapper'>
				<div class="d3-holder">${super.render()}</div>
			</div>
			`;
	}

	getMargin(){
		if(this.axes){
			return {
				bottom:40,
				top:30,
				left:20,
				right:20
			}
		}
		return {
			bottom:0,
			top:0,
			left:0,
			right:0
		}
	}
	draw(){
		let margin = this.getMargin();
		let {height:fullHeight, width:fullWidth} = this.el_d3.getBoundingClientRect();
		let width = fullWidth - margin.left - margin.right;
    	let height = fullHeight - margin.top - margin.bottom;
		/*
		if(!this.sampler)
			return;
		let samplerIdents = this.sampler.split(':');
		
		let samplers = samplerIdents.map((ident) => {
			let sampler =  FlowSampler.get(ident);
			if(!this._draw){
				this._draw = this.draw.bind(this);
				sampler.on('data', this._draw);
			}
			return sampler;
		})
		
		let data = samplers[0].data;

		//console.log(JSON.stringify(data, null))
		let [min,max] = d3.extent(data, d => d.date);
		//console.log("processing min-max[1]",min,max);
		if(!this.axes)
			min = max - 1000*this.range;
		let maxTextLength = 0;
		data.forEach(d=>{
			if(d.value.toFixed(this.precision).length>maxTextLength)
				maxTextLength = d.value.toFixed(this.precision).length;
		})

		if(this.axes && margin.left < maxTextLength * 10){
			let oldLeft = margin.left
			margin.left = maxTextLength * 10;
			width += oldLeft - margin.left;
		}

		
		const x = d3.scaleUtc()
		.domain([min, max])
		.range([0, width])

		const y = d3.scaleLinear()
		.domain(d3.extent(data, d => d.value)).nice()
		.range([height, 0]);

		
		let xAxis, yAxis;
		if(this.axes){
			xAxis = g => g
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

			yAxis = g => g
			//.attr("transform", `translate(${margin.left},0)`)
			.call(d3.axisLeft(y).ticks(height / 20).tickSizeOuter(0))
			//.call(g => g.select(".domain").remove())
		}
		

		const area = d3.area()
			.curve(d3.curveLinear)
			.x(d => x(d.date))
			.y0(height)
			.y1(d => y(d.value));
		*/


		const root = this.partition(data);
  		root.each(d => d.current = d);


		const { el } = this;
		let t = `translate(${(width/2)+margin.left},${(height/2)+margin.top})`;
		if(el.__t != t){
			el.__t = t
			el.attr("transform", t)
		}

		if(this.svg.__w != fullWidth){
			this.svg.__w = fullWidth;
			this.svg
				.attr("width", fullWidth)
		}
		if(this.svg.__h != fullHeight){
			this.svg.__h = fullHeight;
			this.svg
				.attr("height", fullHeight)
		}

		let color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
		let format = d3.format(",d");
		let radius = width / 6.2;
		let arc = d3.arc()
			.startAngle(d => d.x0)
			.endAngle(d => d.x1)
			.padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
			.padRadius(radius * 1.5)
			.innerRadius(d => d.y0 * radius)
			.outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

		
		if(!this.rootPaths){
			this.rootPaths = el.append("g")
				.attr("class", "paths")
		}
		const path = this.rootPaths
		    .selectAll("path")
		    .data(root.descendants().slice(1))
		    .join("path")
				.attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
				.attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
				.attr("d", d => arc(d.current));
		
		path.filter(d => d.children)
			.style("cursor", "pointer")
			.on("click", clicked);


		const title = path.selectAppend("title")
      		.text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);


      	if(!this.labels){
      		this.labels = el.append("g")
				.attr("pointer-events", "none")
				.attr("text-anchor", "middle")
				.style("user-select", "none")
      	}

		const label = this.labels
			.selectAll("text")
			.data(root.descendants().slice(1))
			.join("text")
				.attr("dy", "0.35em")
				.attr("fill-opacity", d => +labelVisible(d.current))
				.attr("transform", d => labelTransform(d.current))
				.text(d => d.data.name);

		if(!this.circleEl)
			this.circleEl = el.append("circle")

	    const parent = this.circleEl
			.datum(root)
			.attr("r", radius)
			.attr("fill", "none")
			.attr("pointer-events", "all")
			.on("click", clicked);

	    
		const noZoom = this.noZoom;
		function clicked(p, ...args) {
			if(!noZoom)
				return
			parent.datum(p.parent || root);
			//console.log("p.depth", args, p, p.x0, p.x1, p.depth);
			//return

			root.each(d => d.target = {
				x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
				x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
				y0: Math.max(0, d.y0 - p.depth),
				y1: Math.max(0, d.y1 - p.depth)
			});

			const t = el.transition().duration(750);

			// Transition the data on all arcs, even the ones that aren’t visible,
			// so that if this transition is interrupted, entering arcs will start
			// the next transition from the desired position.
			path.transition(t)
				.tween("data", d => {
					const i = d3.interpolate(d.current, d.target);
					return t => d.current = i(t);
				})
				.filter(function(d) {
					return +this.getAttribute("fill-opacity") || arcVisible(d.target);
				})
				.attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
				.attrTween("d", d => () => arc(d.current));

				label.filter(function(d) {
					return +this.getAttribute("fill-opacity") || labelVisible(d.target);
				})
				.transition(t)
				.attr("fill-opacity", d => +labelVisible(d.target))
				.attrTween("transform", d => () => labelTransform(d.current));
		}
	  
		function arcVisible(d) {
			return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
		}

		function labelVisible(d) {
			return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
		}

		function labelTransform(d) {
			//console.log("d.x0 + d.x1", d.x0 , d.x1)
			const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
			const y = (d.y0 + d.y1) / 2 * radius;
			return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
		}

		/*
		if(!this.path)
			this.path = el.append('path')
				.attr('stroke-opacity', 'var(--flow-graph-stroke-opacity, 1.0)')
				.attr("stroke-linejoin", "round")
				.attr("stroke-linecap", "round")
				.attr("stroke-width", 'var(--flow-graph-stroke-width, 0)')
				.attr('fill','var(--flow-graph-fill, steelblue)')
				.attr('stroke','var(--flow-graph-stroke, "#000)')

		
		try {				
			this.path.datum(data)
				.attr('d', area);
		} catch(ex) {
			if(this.sampler)
				console.log('error while processing sampler:',this.sampler);
			console.log(ex);

		}
		*/


		/*
		if(this.axes){
			this.xAxis = this.xAxis || el.append("g")
			this.xAxis.call(xAxis);
			this.yAxis = this.yAxis || el.append("g")
			this.yAxis.call(yAxis);

			this.xAxis.classed('axis', true);
			this.yAxis.classed('axis', true);
		}
		*/

	}

	partition(data){
		const root = d3.hierarchy(data)
			.sum(d => d.value)
			.sort((a, b) => b.value - a.value);
		return d3.partition()
			.size([2 * Math.PI, root.height + 1])(root);
	}
}

FlowSunburstGraph.define('flow-sunburst-graph');