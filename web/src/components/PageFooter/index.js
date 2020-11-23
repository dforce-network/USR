import React, { Component, Suspense } from 'react';
import styles from './index.less';
import { message, Dropdown, Menu } from 'antd';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { SuspenseFallback, isMobileDevice } from '@utils';
import { Translation } from 'react-i18next';
import i18next from 'i18next';
import i18n from '@services/i18n.js';

const iconTwitter = require('@assets/icon_twitter.svg');
const iconTelegram = require('@assets/icon_telegram.svg');
const iconMedium = require('@assets/icon_medium.svg');
const iconReddit = require('@assets/icon_reddit.svg');
const iconDiscord = require('@assets/icon_discord.svg');
const iconLinkedin = require('@assets/icon_linkedin.svg');
const iconYoutube = require('@assets/icon_youtube.svg');
const iconWechat = require('@assets/icon_wechat.svg');
const iconWechatQRCode = require('@assets/wechat.png');

export default class PageFooter extends Component {
  state = {
    language: 'en',
  }

  changeLanguage = (language) => {
    i18n.changeLanguage(language);
    this.setState({
      language
    });
  }

  componentDidMount() {

    setTimeout(() => {
      this.setState({
        language: i18next.language || 'en'
      });

      if (isMobileDevice()) {
        if (navigator.language) {
          let language = ['en', 'en-US'].indexOf(navigator.language) >= 0 ? 'en' : 'zh-CN';
          this.changeLanguage(language);
        }
      }
    }, 300);
  }

  render() {
    let currentLanguage = this.state.language;

    return (
      <Suspense fallback={<SuspenseFallback />}>
        <Translation>
          {
            t => (
              <div className={styles.footer}>
                <section className={styles.footer__link}>
                  <h2>{t('footer.resource.title')}</h2>
                  <a href="https://github.com/dforce-network/USR" target="_blank">{t('footer.resource.github')}</a>
                  <a href="https://github.com/dforce-network/USR" target="_blank">{t('footer.resource.faq')}</a>
                </section>

                <section className={styles.footer__community}>
                  <h2>{t('footer.community.title')}</h2>
                  <div>
                    <a href="https://twitter.com/dForcenet" target="_blank">
                      <img src={iconTwitter} alt="twitter" />
                    </a>
                    <a href="https://t.me/dforcenet" target="_blank">
                      <img src={iconTelegram} alt="telegram" />
                    </a>
                    <a href="https://medium.com/dforcenet" target="_blank">
                      <img src={iconMedium} alt="medium" />
                    </a>
                    <a href="https://www.reddit.com/r/dForceNetwork" target="_blank">
                      <img src={iconReddit} alt="reddit" />
                    </a>
                    <a href="https://discord.gg/c2PC8SM" target="_blank">
                      <img src={iconDiscord} alt="discord" />
                    </a>
                    <a href="https://www.linkedin.com/company/dforce-network" target="_blank">
                      <img src={iconLinkedin} alt="linkedin" />
                    </a>
                    <a href="https://www.youtube.com/channel/UCM6Vgoc-BhFGG11ZndUr6Ow" target="_blank">
                      <img src={iconYoutube} alt="youtube" />
                    </a>
                    {
                      ['en', 'en-US'].indexOf(currentLanguage) >= 0
                        ? null
                        : (
                          <a className={styles.footer__community_wechat} target="_blank">
                            <img src={iconWechat} alt="wechat" />
                            <img className={styles.footer__community_wechat_qr} src={iconWechatQRCode} alt="wechat" />
                          </a>
                        )
                    }
                  </div>

                  <Dropdown
                    placement="topCenter"
                    overlay={(
                      <Menu style={{ width: '100px' }}>
                        <Menu.Item onClick={e => this.changeLanguage('zh')}>{t('footer.community.chinese')}</Menu.Item>
                        <Menu.Item onClick={e => this.changeLanguage('en')}>{t('footer.community.english')}</Menu.Item>
                      </Menu>
                    )}
                  >
                    <label className={styles.footer__community_language}>
                      {currentLanguage === 'en' ? t('footer.community.english') : t('footer.community.chinese')}
                      <img src={require('@assets/icon_language_down.svg')} />
                    </label>
                  </Dropdown>
                </section>

                <section className={styles.footer__email}>
                  <h2>{t('footer.contact.title')}</h2>
                  <CopyToClipboard
                    text={'support@dforce.network'}
                    onCopy={() => {
                      message.success(t('footer.copied'), 4);
                    }}
                  >
                    <span>support@dforce.network</span>
                  </CopyToClipboard>
                  <CopyToClipboard
                    text={'bd@dforce.network'}
                    onCopy={() => {
                      message.success(t('footer.copied'), 4);
                    }}
                  >
                    <span>bd@dforce.network</span>
                  </CopyToClipboard>
                  <CopyToClipboard
                    text={'tech@dforce.network'}
                    onCopy={() => {
                      message.success(t('footer.copied'), 4);
                    }}
                  >
                    <span>tech@dforce.network</span>
                  </CopyToClipboard>
                </section>
              </div>
            )
          }
        </Translation>
      </Suspense>
    )
  };
}
