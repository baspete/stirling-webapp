import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import './App.css';

class ReloadButton extends Component {
  constructor() {
    super();
    this.getIcon = this.getIcon.bind(this);
  }

  getIcon() {
    if (this.props.loading) {
      return (
        <CircularProgress size={24} thickness={2} />
      );
    }
    return this.props.icon;
  }

  render() {
    return (
      <RaisedButton icon={this.getIcon()} onTouchTap={this.props.onTouchTap} title={this.props.title} />
    );
  }
}

export default ReloadButton;
