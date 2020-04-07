// operation panel
import React, { Component } from 'react';
import styles from './index.less';

export default class Overview extends Component {
  render() {
    return (
      <section className={styles.overview}>
        <h2>You can withdraw <b>12,234.87</b> USDx</h2>

        <p>USR balance: 12,645.93</p>
        <p>1 USR = 1.01801456 USDx</p>
        <p>USDx Annual Rate: 14.45%</p>
      </section>
    );
  }
}
