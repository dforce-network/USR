import React, { Component, Suspense } from 'react';
import { Menu, Dropdown, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { initBrowserWallet } from '@utils/web3Utils';
import { connect } from 'dva';
import { accountHideFormatter, SuspenseFallback } from '@utils';
import { Translation } from 'react-i18next';
import styles from './index.less';

const downSvg = require('@assets/icon_xl.svg');

export default class PageHeader extends Component {
  state = {
    drawerVisible: false
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

  onClose = () => {
    this.setState({
      drawerVisible: false
    });
  }

  openMenu = () => {
    this.setState({
      drawerVisible: true
    });
  }

  // connect wallet
  connectWallet = async () => {
    initBrowserWallet.bind(this)(this.dispatchValue);
  }

  render() {
    const { walletAddress } = this.props.usr;

    return (
      <Suspense fallback={ <SuspenseFallback /> }>
        <Translation>
          {
            t => (
              <div className={styles.header}>
                <a href="/" className={styles.header__logo}>
                  <img src={require('@assets/logo.svg')} alt="logo" />
                </a>

                <MenuOutlined
                  className={styles.header__dropdown}
                  style={{fontSize: '20px', fontWeight: 'bold'}}
                  onClick={this.openMenu}
                />

                <div className={styles.header__menu}>
                  <Dropdown
                    overlay={
                      <Menu className={styles.header__overlay}>
                        <Menu.Item>
                          <a target="_blank" rel="noopener noreferrer" href="https://usdx.dforce.network/" className={styles.header__overlay_item}>
                            <span>{ t('menu.dForceStablecoin.usdx.title') }</span>
                            <label>{ t('menu.dForceStablecoin.usdx.label') }</label>
                          </a>
                        </Menu.Item>
                        <Menu.Item>
                          <a target="_blank" rel="noopener noreferrer" href="/" className={styles.header__overlay_item}>
                            <span>{ t('menu.dForceStablecoin.usr.title') }</span>
                            <label>{ t('menu.dForceStablecoin.usr.label') }</label>
                          </a>
                        </Menu.Item>
                        <Menu.Item>
                          <a target="_blank" rel="noopener noreferrer" href="https://dip001.dforce.network" className={styles.header__overlay_item}>
                            <span>{ t('menu.dForceStablecoin.dip001.title') }</span>
                            <label>{ t('menu.dForceStablecoin.dip001.label') }</label>
                          </a>
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <span className={styles.header__menu_item}>
                      <label>{ t('menu.dForceStablecoin.title') }</label>
                      <img src={downSvg} alt="down" />
                    </span>
                  </Dropdown>

                  <Dropdown
                    overlay={
                      <Menu className={styles.header__overlay}>
                        <Menu.Item>
                          <a target="_blank" rel="noopener noreferrer" href="https://lendf.me" className={styles.header__overlay_item}>
                            <span>{ t('menu.yieldMarket.lendfMe.title') }</span>
                            <label>{ t('menu.yieldMarket.lendfMe.label') }</label>
                          </a>
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <span className={styles.header__menu_item}>
                      <label>{ t('menu.yieldMarket.title') }</label>
                      <img src={downSvg} alt="down" />
                    </span>
                  </Dropdown>

                  <Dropdown
                    overlay={
                      <Menu className={styles.header__overlay}>
                        <Menu.Item>
                          <a target="_blank" rel="noopener noreferrer" href="/" className={styles.header__overlay_item}>
                            <span>{ t('menu.exchangeMarket.xswap.title') }</span>
                            <label>{ t('menu.exchangeMarket.xswap.label') }</label>
                          </a>
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <span className={styles.header__menu_item}>
                      <label>{ t('menu.exchangeMarket.title') }</label>
                      <img src={downSvg} alt="down" />
                    </span>
                  </Dropdown>

                  {
                    walletAddress
                      ?  (
                        <a
                          className={styles.header__menu_wallet}
                          href={
                            this.props.usr.network == 1
                              ? `https://etherscan.com/address/${walletAddress}`
                              : `https://rinkeby.etherscan.io/address/${walletAddress}`
                          }
                          target="_blank"
                        >
                          <div>
                            <i style={{ backgroundColor: this.props.usr.network == 1 ? '#29B6AF' : '#e2bc73' }}></i>
                            { accountHideFormatter(walletAddress) }
                          </div>
                        </a>
                      )
                      : <a className={styles.header__menu_wallet} onClick={this.connectWallet}>{ t('menu.connectWallet') }</a>
                  }

                </div>

                <Drawer
                  title={(
                    <section className={styles.header}>
                      <a href="/" className={styles.header__logo}>
                        <img src={require('@assets/logo.svg')} alt="logo" />
                      </a>

                      <img className={styles.header__close} alt="close" onClick={this.onClose} src={require('@assets/icon_close.svg')} />
                    </section>
                  )}
                  placement='top'
                  closable={false}
                  onClose={this.onClose}
                  visible={this.state.drawerVisible}
                  height="640"
                >
                  <section className={styles.header__drawer}>
                    <h2>
                      { t('menu.dForceStablecoin.title') }
                      <img src={require('@assets/icon_down.svg')} alt="down" />
                    </h2>
                    <a target="_blank" rel="noopener noreferrer" href="https://usdx.dforce.network" className={styles.header__overlay_item}>
                      <span>{ t('menu.dForceStablecoin.usdx.title') }</span>
                      <label>{ t('menu.dForceStablecoin.usdx.label') }</label>
                    </a>
                    <a target="_blank" rel="noopener noreferrer" href="/" className={styles.header__overlay_item}>
                      <span>{ t('menu.dForceStablecoin.usr.title') }</span>
                      <label>{ t('menu.dForceStablecoin.usr.label') }</label>
                    </a>
                    <a target="_blank" rel="noopener noreferrer" href="https://dip001.dforce.network" className={styles.header__overlay_item}>
                      <span>{ t('menu.dForceStablecoin.dip001.title') }</span>
                      <label>{ t('menu.dForceStablecoin.dip001.label') }</label>
                    </a>
                  </section>

                  <section className={styles.header__drawer}>
                    <h2>
                      { t('menu.yieldMarket.title') }
                      <img src={require('@assets/icon_down.svg')} alt="down" />
                    </h2>
                    <a target="_blank" rel="noopener noreferrer" href="https://lendf.me" className={styles.header__overlay_item}>
                      <span>{ t('menu.yieldMarket.lendfMe.title') }</span>
                      <label>{ t('menu.yieldMarket.lendfMe.label') }</label>
                    </a>
                  </section>

                  <section className={styles.header__drawer}>
                    <h2>
                      { t('menu.exchangeMarket.title') }
                      <img src={require('@assets/icon_down.svg')} alt="down" />
                    </h2>
                    <a target="_blank" href="/" className={styles.header__overlay_item}>
                      <span>{ t('menu.exchangeMarket.xswap.title') }</span>
                      <label>{ t('menu.exchangeMarket.xswap.label') }</label>
                    </a>
                  </section>
                </Drawer>
              </div>
            )
          }
        </Translation>
      </Suspense>
    );
  }
}
