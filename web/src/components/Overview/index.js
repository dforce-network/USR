// operation panel
import React, { Component } from 'react';
import styles from './index.less';
import { formatCurrencyNumber } from '@utils';

export default class Overview extends Component {
  render() {
    const {
      usrBalance,
      usdxBalance,
    } = this.props.usr;

    return (
      <section className={styles.overview}>
        <h2>You can withdraw <b>{ formatCurrencyNumber(usdxBalance) }</b> USDx</h2>

        <p>USR balance: { formatCurrencyNumber(usrBalance) }</p>
        <p>1 USR = 1.01801456 USDx</p>
        <p>USDx Annual Rate: 14.45%</p>
      </section>
    );
  }
}
