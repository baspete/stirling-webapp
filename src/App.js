import React, { Component } from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';
import { default as Stirling } from 'material-ui/svg-icons/hardware/toys';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import { grey50 } from 'material-ui/styles/colors';
import myFetch from './myFetch';
import DeviceList from './DeviceList';
import ContourChart from './ContourChart';
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.fetchDataForDevice = this.fetchDataForDevice.bind(this);
    this.xSelected = this.xSelected.bind(this);
    this.ySelected = this.ySelected.bind(this);
    this.state = {
      series: [],
      flat: [],
      last: 0,
    };
  }

  componentWillMount() {
    this.timer = setInterval(() => this.fetchDataForDevice(), 30000);
  }

  compnentWillUnmount() {
    clearInterval(this.timer);
  }

  get urlState() {
    // Ignore 0 index, it's empty as the url starts with a slash
    const [ , device, x, y ] = this.props.match.url.split('/');
    return { device, x, y };
  }

  fetchDataForDevice(dev) {
    if(dev != null && dev !== this.urlState.device) {
      this.props.history.push(`/${dev}`);
      // Reset data
      this.setState({ last: 0, series: [], flat: [] });
    }
    const device = dev || this.urlState.device;
    console.log(`Fetching data for device ${device}`);
    myFetch(`https://fast-ts.run.aws-usw02-pr.ice.predix.io/devices/${device}/events?count=10000`).then(events => {
      const series = Array.from(events.values.reduce((a, e) => {
        Object.keys(e.status).forEach(t => a.add(t));
        return a;
      }, new Set()));
      const flat = events.values
        .map(e => Object.assign({}, e, e.status, { status: undefined }))
        .sort((a, b) => a.timestamp - b.timestamp);
      const last = flat[flat.length-1].timestamp;
      // Only update if something changed to avoid a redraw
      if (last > this.state.last) {
        this.setState({series, flat, last});
      } else {
        console.log('No change');
      }
    }).catch(e => {
      console.error(`Error fetching data for device ${device}`, e);
    });
  }

  xSelected(event, index, value) {
    console.log('X Selected:', value);
    this.props.history.push(`/${this.urlState.device}/${value}/${this.urlState.y ? this.urlState.y : ''}`);
  }

  ySelected(event, index, value) {
    console.log('Y Selected:', value);
    this.props.history.push(`/${this.urlState.device}/${this.urlState.x}/${value}`);
  }

  render() {
    const logoStyle = { width: 50, height: 50 };
    const { device, x, y } = this.urlState;
    return (
      <div className='App'>
        <div className='App-header'>
          <Stirling color={grey50} style={logoStyle} className='App-logo'/>
          <h2 className='App-title'>Stirling Twins</h2>
        </div>
        <div>
          <DeviceList device={device} onDeviceChange={this.fetchDataForDevice}/>
        </div>
        <div>
          <SelectField className='select-field' floatingLabelText='Property for X' value={x} onChange={this.xSelected}>
            { this.state.series.map(s => <MenuItem key={s} value={s} primaryText={s} />) }
          </SelectField>
          <SelectField className='select-field' floatingLabelText='Property for Y' value={y} onChange={this.ySelected}>
            { this.state.series.map(s => <MenuItem key={s} value={s} primaryText={s} />) }
          </SelectField>
        </div>
        <div>
          <ContourChart xProp={x} yProp={y} data={this.state.flat}/>
        </div>
      </div>
    );
  }
}

class Routes extends Component {
  render() {
    return (
      <Router>
        <Route path="*" component={App} />
      </Router>
    );
  }
}

export default Routes;
