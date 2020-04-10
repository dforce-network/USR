import React, { PureComponent } from 'react';
import { Button, Row, Col } from 'antd';
// import { Translation } from 'react-i18next';
import OperationPanel from '@components/OperationPanel';
import Overview from '@components/Overview';
import Transactions from '@components/Transactions';
import styles from './index.less';
import { connect } from 'dva';
import config from '@utils/config';
import Web3 from 'web3';
import { initBrowserWallet } from '@utils/web3Utils';

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
  }

  handleTest = () => {
    this.props.dispatch({
      type: 'usr/updateParams',
      payload: {
        name: 'walletAddress',
        value: 'abc'
      }
    });

    console.log(this.props.usr);
  }

  render() {
    return (
      <div className={styles.home}>
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
