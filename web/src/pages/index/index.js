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
// import { Translation } from 'react-i18next';
import { useTranslation, withTranslation, Trans, NamespacesConsumer } from 'react-i18next';
import i18n from '@services/i18n.js';
const web3 = new Web3(new Web3.providers.HttpProvider(config.defaultWeb3Provider));

@connect(({ usr }) => ({ usr }))
class IndexPage extends PureComponent {
  state = {
    web3: web3
  }

  dispatchValue = (name, value) => {
    this.props.dispatch({
      type: 'usr/updateParams',
      payload: {
        name,
        value
      }
    });
  }

  componentWillUpdate(nextProps) {
    // if (this.props.usr.walletAddress !== nextProps.usr.walletAddress) {
    //   console.log('componentWillUpdate');
    //   console.log(this.dispatchTimer);
    // }
  }

  componentDidMount() {
    let self = this;
    let dispatchTimer = null;

    initBrowserWallet.bind(self)(self.dispatchValue);
    // this.dispatchTimer = setInterval(() => {
    //   initBrowserWallet.bind(self)(self.dispatchValue);
    // }, 15000);

    this.props.dispatch({
      type: 'usr/updateRecentTransactions'
    });

    setTimeout(() => {
      document.getElementById('page__loader').style.display = 'none';
    }, 500);
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
