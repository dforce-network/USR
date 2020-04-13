// import i18n from '@services/i18n';
import React, { Component, Suspense } from 'react';
import styles from './index.less';
import { Translation } from 'react-i18next';
import PageFooter from '@components/PageFooter';
import '@services/i18n';

class BasicLayout extends Component {
  render() {
    return (
      <Suspense fallback={(<b>loading</b>)}>
        <Translation>
          {
            t => (
              <div className={styles.usr}>
                {this.props.children}
                <PageFooter />
              </div>
            )
          }
        </Translation>
      </Suspense>
    );
  }
}

export default BasicLayout;
