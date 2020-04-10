// operation panel
import React, { Component } from 'react';
import styles from './index.less';
import { formatCurrencyNumber, percentFormatter } from '@utils';

export default class Overview extends Component {
  render() {
    const {
      usrBalance,
      usdxBalance,
      interestRate,
      exchangeRate,
      totalBalanceValue,
    } = this.props.usr;

    return (
      <section className={styles.overview}>
        <h2>You can withdraw <b>{ formatCurrencyNumber(totalBalanceValue) }</b> USDx</h2>

        <p>USR balance: { formatCurrencyNumber(usrBalance) }</p>
        <p>1 USR = { exchangeRate } USDx</p>
        <p>USDx Annual Rate: { percentFormatter(interestRate) }</p>
      </section>
    );
  }
}
