import React, { Component } from 'react';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { contourDensity } from 'd3-contour';
import { geoPath } from 'd3-geo';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import './App.css';

const margin = {
  top: 20, right: 30, bottom: 30, left: 40
};

class ContourChart extends Component {
  constructor() {
    super();
    this.getData = this.getData.bind(this);
  }

  getData() {

    const { xProp, yProp, data } = this.props;

    console.log(`Plotting ${xProp} vs ${yProp}`);

    if (data && xProp && yProp && data.length > 0) {

      const x = scaleLinear().rangeRound([margin.left, this.props.width - margin.right]);
      const y = scaleLinear().rangeRound([this.props.height - margin.bottom, margin.top]);

      x.domain(extent(data, d => d[xProp])).nice();
      y.domain(extent(data, d => d[yProp])).nice();

      const cData = contourDensity()
          .x(d => x(d[xProp]))
          .y(d => y(d[yProp]))
          .size([this.props.width, this.props.height])
          .bandwidth(40)(data);

      const contours = cData.map(c => geoPath()(c));
      const points = data.map(p => ({ x: x(p[xProp]), y: y(p[yProp]) }));

      // Attach the axes
      select(this.refs.xAxis).call(axisBottom(x));
      select(this.refs.xAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
        .attr('y', -3)
        .attr('dy', null)
        .attr('font-weight', 'bold')
        .text(this.props.xProp);

      select(this.refs.yAxis).call(axisLeft(y));
      select(this.refs.yAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
        .attr('x', 3)
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold')
        .text(this.props.yProp);

      return { points, contours };
    }
    return { points: [], contours: [] };
  }

  render() {
    const { points, contours } = this.getData();
    return (
      <div>
        <svg id='chart' width={this.props.width} height={this.props.height} style={margin}>
          <g fill='none' stroke='steelblue' strokeLinejoin='round'>
            { contours.map((c, i) => <path key={i} d={c}></path>) }
          </g>
          <g stroke='white'>
            { points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r='2'></circle>) }
          </g>
          <g ref='xAxis' transform={`translate(0,${this.props.height - margin.bottom})`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='middle'></g>
          <g ref='yAxis' transform={`translate(${margin.left},0)`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='end'></g>
        </svg>
      </div>
    );
  }
}

ContourChart.defaultProps = {
  width: 960,
  height: 500,
};

export default ContourChart;
