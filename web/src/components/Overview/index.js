// operation panel
import React, { Component, Suspense } from 'react';
import styles from './index.less';
import { formatCurrencyNumber, percentFormatter, SuspenseFallback } from '@utils';
import { Translation } from 'react-i18next';

export default class Overview extends Component {
  render() {
    const {
      usrBalance,
      shareValue,
      interestRate,
      exchangeRate,
      totalBalanceValue,
      totalUSDxInUSR,
      savingOriginationFee,
    } = this.props.usr;

    return (
      <Suspense fallback={ <SuspenseFallback /> }>
        <Translation lang="en">
          {
            t => (
              <section className={styles.overview}>
                <h2>{ t('overview.title') } <b>{ formatCurrencyNumber(totalBalanceValue) }</b> USDx { t('overview.saving') }</h2>
                <div className={styles.overview__one}>
                  <span>{ t('overview.balance') }</span>
                  <label><b>{ formatCurrencyNumber(totalUSDxInUSR) }</b> USDx</label>
                </div>
                <div>
                  <span>{ t('overview.liquidityRemaining') }</span>
                  <label><b>{ formatCurrencyNumber(shareValue) }</b> USDx</label>
                </div>
                <div>
                  <span>{ t('overview.USRNetWorth')}</span>
                  <label><b>{ exchangeRate }</b> USDx</label>
                </div>
                <div>
                  <span>{ t('overview.annualRate') }</span>
                  <label><b>{ percentFormatter(interestRate) }</b></label>
                </div>
                <div>
                  <span>{ t('overview.savingOriginationFee') }</span>
                  <label><b>{ percentFormatter(savingOriginationFee) }</b></label>
                </div>
              </section>
            )
          }
        </Translation>
      </Suspense>
    );
  }
}
