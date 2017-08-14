import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
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
    this.resetPollTimer = this.resetPollTimer.bind(this);
    this.xSelected = this.xSelected.bind(this);
    this.ySelected = this.ySelected.bind(this);
    this.state = {
      series: [],
      flat: [],
      timer: null,
    };
  }

  get urlState() {
    const [ _, device, x, y ] = this.props.match.url.split('/');
    const toString = () => {
      if (device) {
        if (x) {
          if (y) {
            return `/${device}/${x}/${y}`;
          }
          return `/${device}/${x}`;
        }
        return `/${device}`;
      }
      return '';
    };
    return { device, x, y, toString };
  }

  resetPollTimer(device) {
    clearInterval(this.state.timer);
    this.setState({ timer: setInterval(() => this.fetchDataForDevice(device), 30000) });
  }

  fetchDataForDevice(device) {
    if(device !== this.urlState.device) {
      this.props.history.push(`/${device}`);
      this.resetPollTimer(device);
    }
    console.log(`Fetching data for device ${device}`);
    myFetch(`https://fast-ts.run.aws-usw02-pr.ice.predix.io/devices/${device}/events?count=1000`).then(events => {
      const series = Array.from(events.values.reduce((a, e) => {
        Object.keys(e.status).forEach(t => a.add(t));
        return a;
      }, new Set()));
      const flat = events.values
        .map(e => Object.assign({}, e, e.status, { status: undefined }))
        .sort((a, b) => a.timestamp - b.timestamp);
      this.setState({series, flat});
    }).catch(e => {
      console.error(`Error fetching data for device ${device}`, e);
    });
  }

  xSelected(event, index, value) {
    console.log('X Selected:', value);
    this.setState({ x: value });
    this.props.history.push(`/${this.urlState.device}/${value}`);
  }

  ySelected(event, index, value) {
    console.log('Y Selected:', value);
    this.setState({ y: value });
    this.props.history.push(`/${this.urlState.device}/${this.urlState.x}/${value}`);
  }

  render() {
    const logoStyle = { width: 50, height: 50 };
    const { device, x, y } = this.urlState;
    return (
      <div className='App'>
        <div className='App-header'>
          <Stirling color={grey50} style={logoStyle}/>
          <h2>Stirling Twins</h2>
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
