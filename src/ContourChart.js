import React, { Component } from 'react';
import { scaleLinear, scaleSequential } from 'd3-scale';
import { extent } from 'd3-array';
import { contourDensity } from 'd3-contour';
import { geoPath } from 'd3-geo';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { interpolateYlGnBu } from 'd3-scale-chromatic';
import Brush from './Brush';
import './App.css';

const margin = {
  top: 20, right: 30, bottom: 30, left: 40
};

const marginStyle = {
  marginTop: margin.top,
  marginRight: margin.right,
  marginBottom: margin.bottom,
  marginLeft: margin.left,
}

class ContourChart extends Component {
  constructor() {
    super();
    this.getData = this.getData.bind(this);
    this.onBrush = this.onBrush.bind(this);
    this.state = {
      minIdx: 0,
      maxIdx: 0,
    };
  }

  getData() {

    const { xProp, yProp, data } = this.props;

    console.log(`Plotting ${xProp} vs ${yProp}`);

    if (data && xProp && yProp && data.length > 0) {

      const dataView = this.state.maxIdx ? data.slice(this.state.minIdx, this.state.maxIdx) : data;
      console.log(`Viewing ${dataView.length} points between ${this.state.minIdx} and ${this.state.maxIdx}`);

      const x = scaleLinear().rangeRound([margin.left, this.props.width - margin.right]);
      const y = scaleLinear().rangeRound([this.props.height - margin.bottom, margin.top]);
      const colors = scaleSequential(interpolateYlGnBu).domain([0, this.props.contours]);

      // Create axis over the full extent of the data, not just the dataView
      x.domain(extent(data, d => d[xProp] || 0)).nice();
      y.domain(extent(data, d => d[yProp] || 0)).nice();

      const cdataView = contourDensity()
          .x(d => x(d[xProp] || 0))
          .y(d => y(d[yProp] || 0))
          .size([this.props.width, this.props.height])
          .bandwidth(this.props.contours)(dataView);

      const contours = cdataView.map(c => geoPath()(c));
      const points = dataView.map(p => ({ x: x(p[xProp] || 0), y: y(p[yProp] || 0) }));

      // Attach the axes
      select(this.refs.xAxis).call(axisBottom(x));
      select(this.refs.xAxis)
        .selectAll('.axis-label')
          .remove();

      select(this.refs.xAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
          .classed('axis-label', true)
          .attr('y', -3)
          .attr('dy', null)
          .attr('font-weight', 'bold')
          .text(this.props.xProp);

      select(this.refs.yAxis).call(axisLeft(y));
      select(this.refs.yAxis)
        .selectAll('.axis-label')
          .remove();

      select(this.refs.yAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
          .classed('axis-label', true)
          .attr('x', 3)
          .attr('text-anchor', 'start')
          .attr('font-weight', 'bold')
          .text(this.props.yProp);

      return { points, contours, colors };
    }
    return { points: [], contours: [], colors: () => 'black' };
  }

  onBrush([ minIdx, maxIdx ]) {
    if (this.state.minIdx !== minIdx || this.state.maxIdx !== maxIdx) {
      this.setState({ minIdx, maxIdx });
    }
  }

  render() {
    const { points, contours, colors } = this.getData();
    const pointColor = colors(this.props.contours);
    const OP_MIN = 0.3;
    const OP_MAX = 1.0;
    const opac = i => ((i / points.length) * (OP_MAX-OP_MIN)) + OP_MIN;
    const newest = i => i === points.length - 1;

    return (
      <div>
        <svg id='chart' width={this.props.width} height={this.props.height} style={marginStyle}>
          <g fill='none' stroke='steelblue' strokeLinejoin='round' strokeWidth='0.5'>
            { contours.map((c, i) => <path key={i} d={c} fill={colors(i)}></path>) }
          </g>
          <g stroke='none'>
          { points.map((p, i) =>
            <circle className={newest(i) ? 'new-point' : ''} key={i} cx={p.x} cy={p.y} r='1' fill={newest(i) ? 'red' : pointColor} fillOpacity={opac(i)}></circle>
          )}
          </g>
          <g ref='xAxis' transform={`translate(0,${this.props.height - margin.bottom})`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='middle'></g>
          <g ref='yAxis' transform={`translate(${margin.left},0)`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='end'></g>
        </svg>
        <Brush width={this.props.width} data={this.props.data} xProp={this.props.xProp} onBrush={this.onBrush}/>
      </div>
    );
  }
}

ContourChart.defaultProps = {
  width: 960,
  height: 500,
  contours: 6,
};

export default ContourChart;
