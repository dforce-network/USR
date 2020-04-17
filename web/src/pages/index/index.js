import React, { PureComponent, Suspense } from 'react';
import PageHeader from '@components/PageHeader';
import OperationPanel from '@components/OperationPanel';
import Overview from '@components/Overview';
import Transactions from '@components/Transactions';
import styles from './index.less';
import { connect } from 'dva';
import config from '@utils/config';
import Web3 from 'web3';
import { initBrowserWallet } from '@utils/web3Utils';
import { useTranslation, withTranslation, Trans, NamespacesConsumer } from 'react-i18next';
import i18n from '@services/i18n.js';

@connect(({ usr }) => ({ usr }))
class IndexPage extends PureComponent {
  dispatchValue = (name, value) => {
    this.props.dispatch({
      type: 'usr/updateParams',
      payload: {
        name,
        value
      }
    });
  }

  componentDidMount() {
    let self = this;
    let dispatchTimer = null;
    if (window.localStorage.getItem('i18nextLng')) {
      window.localStorage.removeItem('i18nextLng')
    }

    initBrowserWallet.bind(self)(self.dispatchValue);
    this.dispatchTimer = setInterval(() => {
      initBrowserWallet.bind(self)(self.dispatchValue);
    }, 5000);

    this.props.dispatch({
      type: 'usr/updateRecentTransactions'
    });

    setTimeout(() => {
      document.getElementById('page__loader').style.display = 'none';
    }, 800);
  }

  render() {
    return (
      <div className={styles.home}>
        <PageHeader { ...this.props } />
        <div className={styles.home__box}>
          <OperationPanel { ...this.props } />
          <Overview { ...this.props } />
        </div>
        <Transactions { ...this.props } />
      </div>
    );
  }
};

export default IndexPage;
