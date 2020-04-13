import React, { PureComponent, Suspense } from 'react';
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

  componentDidMount() {
    initBrowserWallet.bind(this)(this.dispatchValue);
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
      {
        /*
        <button
          onClick={e => {
            i18n.changeLanguage('zh');
          }}
        >
          <Trans i18nKey="title"></Trans>
        </button>
        */
      }


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
