import React from 'react';
import {
  Router as DefaultRouter,
  Route,
  Switch,
  StaticRouter,
} from 'react-router-dom';
import dynamic from 'umi/dynamic';
import renderRoutes from 'umi/lib/renderRoutes';
import history from '@@/history';

const Router = require('dva/router').routerRedux.ConnectedRouter;

const routes = [
  {
    path: '/',
    component: require('../../layouts/index.js').default,
    routes: [
      {
        path: '/404',
        exact: true,
        component: require('../404.js').default,
        _title: 'dforce-usr',
        _title_default: 'dforce-usr',
      },
      {
        path: '/',
        exact: true,
        component: require('../index/index.js').default,
        _title: 'dforce-usr',
        _title_default: 'dforce-usr',
      },
      {
        component: () =>
          React.createElement(
            require('/Users/gaoyang/Desktop/USR/web/node_modules/_umi-build-dev@1.18.5@umi-build-dev/lib/plugins/404/NotFound.js')
              .default,
            { pagesPath: 'src/pages', hasRoutesInConfig: false },
          ),
        _title: 'dforce-usr',
        _title_default: 'dforce-usr',
      },
    ],
    _title: 'dforce-usr',
    _title_default: 'dforce-usr',
  },
  {
    component: () =>
      React.createElement(
        require('/Users/gaoyang/Desktop/USR/web/node_modules/_umi-build-dev@1.18.5@umi-build-dev/lib/plugins/404/NotFound.js')
          .default,
        { pagesPath: 'src/pages', hasRoutesInConfig: false },
      ),
    _title: 'dforce-usr',
    _title_default: 'dforce-usr',
  },
];
window.g_routes = routes;
const plugins = require('umi/_runtimePlugin');
plugins.applyForEach('patchRoutes', { initialValue: routes });

export { routes };

export default class RouterWrapper extends React.Component {
  unListen() {}

  constructor(props) {
    super(props);

    // route change handler
    function routeChangeHandler(location, action) {
      plugins.applyForEach('onRouteChange', {
        initialValue: {
          routes,
          location,
          action,
        },
      });
    }
    this.unListen = history.listen(routeChangeHandler);
    // dva 中 history.listen 会初始执行一次
    // 这里排除掉 dva 的场景，可以避免 onRouteChange 在启用 dva 后的初始加载时被多执行一次
    const isDva =
      history.listen
        .toString()
        .indexOf('callback(history.location, history.action)') > -1;
    if (!isDva) {
      routeChangeHandler(history.location);
    }
  }

  componentWillUnmount() {
    this.unListen();
  }

  render() {
    const props = this.props || {};
    return <Router history={history}>{renderRoutes(routes, props)}</Router>;
  }
}
