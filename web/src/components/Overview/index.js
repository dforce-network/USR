// operation panel
import React, { Component, Suspense } from 'react';
import styles from './index.less';
import { formatCurrencyNumber, percentFormatter, SuspenseFallback } from '@utils';
import { Translation } from 'react-i18next';

export default class Overview extends Component {
  render() {
    const {
      usrBalance,
      interestRate,
      exchangeRate,
      totalBalanceValue,
    } = this.props.usr;

    return (
      <Suspense fallback={ <SuspenseFallback /> }>
        <Translation>
          {
            t => (
              <section className={styles.overview}>
                <h2>{ t('overview.title') } <b>{ formatCurrencyNumber(totalBalanceValue) }</b> USDx</h2>

                <p>{ t('overview.balance') } { formatCurrencyNumber(usrBalance) }</p>
                <p>1 USR = { exchangeRate } USDx</p>
                <p>{ t('overview.annualRate') } { percentFormatter(interestRate) }</p>
              </section>
            )
          }
        </Translation>
      </Suspense>
    );
  }
}
