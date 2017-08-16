import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import { default as Play } from 'material-ui/svg-icons/av/play-circle-outline';
import { default as Pause } from 'material-ui/svg-icons/av/pause-circle-outline';
import './App.css';

const style = {
  margin: 12,
};

class Stepper extends Component {
  constructor() {
    super();
    this.tick = this.tick.bind(this);
    this.pause = this.pause.bind(this);
    this.play = this.play.bind(this);
    this.toggle = this.toggle.bind(this);
    this.getIcon = this.getIcon.bind(this);
    this.incRate = this.incRate.bind(this);
    this.state = {
      rate: 1,
      playing: false,
      title: 'Play',
      timer: null,
    };
  }

  tick() {
    const position = this.props.current + this.state.rate;

    // console.log(`Tick to ${position}`);

    if (typeof this.props.onTick === 'function') {
      this.props.onTick(position);
    }

    if (position >= this.props.max) {
      this.pause();
    }
  }

  pause() {
    clearInterval(this.state.timer);
    this.setState({
      title: 'Play',
      playing: false,
      timer: null,
    });
  }

  play(rate) {
    rate = rate || this.state.rate;
    clearInterval(this.state.timer);
    this.setState({
      title: 'Pause',
      playing: true,
      timer: setInterval(this.tick, 250),
      rate,
    });
  }

  toggle() {
    if (this.state.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  incRate() {
    if (this.state.rate >= 10) {
      this.play(1);
    } else {
      this.play(this.state.rate + 1);
    }
  }

  getIcon() {
    if (this.state.playing) {
      return (
        <Pause />
      );
    }
    return (<Play />);
  }

  render() {
    const icon = this.getIcon();
    return (
      <div>
        <RaisedButton icon={icon} style={style} onTouchTap={this.toggle} title={this.state.title} />
        <FlatButton label={
          this.state.playing ? `${this.state.rate}x` : 'Live'
        } primary={true} onTouchTap={this.incRate} disabled={!this.state.playing} />
      </div>
    );
  }
}

Stepper.defaultProps = {
  current: 0,
  max: 0,
};

export default Stepper;
