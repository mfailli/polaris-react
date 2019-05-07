import {ReactWrapper, CommonWrapper} from 'enzyme';
import * as React from 'react';
import {noop} from '@shopify/javascript-utilities/other';
import {get} from '../utilities/get';
import merge from '../utilities/merge';
import {createThemeContext} from '../components';
import {PolarisContext} from '../components/types';

// eslint-disable-next-line shopify/strict-component-boundaries
import {
  createPolarisContext,
  createAppProviderContext,
  Provider as AppProviderProvider,
  Context as AppProviderContext,
} from '../components/AppProvider';
// eslint-disable-next-line shopify/strict-component-boundaries
import {Provider as FrameProvider} from '../components/Frame';

export type AnyWrapper = ReactWrapper<any, any> | CommonWrapper<any, any>;

export function findByTestID(root: ReactWrapper<any, any>, id: string) {
  function hasTestID(wrapper: ReactWrapper<any, any>) {
    return wrapper.length > 0 && wrapper.prop('testID') === id;
  }

  return root.findWhere(hasTestID).first();
}

export function matchByTestID(root: ReactWrapper<any, any>, regexp: RegExp) {
  function matchesTestID(wrapper: ReactWrapper<any, any>) {
    const id = wrapper.prop('testID');
    return typeof id === 'string' && regexp.test(id);
  }

  return root.findWhere(matchesTestID);
}

export function trigger(wrapper: AnyWrapper, keypath: string, ...args: any[]) {
  if (wrapper.length === 0) {
    throw new Error(
      [
        `You tried to trigger ${keypath} on a React wrapper with no matching nodes.`,
        'This generally happens because you have either filtered your React components incorrectly,',
        'or the component you are looking for is not rendered because of the props on your component,',
        'or there is some error during one of your component’s render methods.',
      ].join(' '),
    );
  }

  const props = wrapper.props();
  const callback = get(props, keypath);

  if (callback == null) {
    throw new Error(
      `No callback found at keypath '${keypath}'. Available props: ${Object.keys(
        props,
      ).join(', ')}`,
    );
  }

  // eslint-disable-next-line callback-return
  const returnValue = callback(...args);
  updateRoot(wrapper);

  if (returnValue instanceof Promise) {
    return returnValue.then((ret) => {
      updateRoot(wrapper);
      return ret;
    });
  }

  return returnValue;
}

function updateRoot(wrapper: AnyWrapper) {
  (wrapper as any).root().update();
}

export interface MountWithAppProviderOptions {
  context?: any;
}

export function mountWithAppProvider<P>(
  node: React.ReactElement<P>,
  options: MountWithAppProviderOptions = {},
): AppContextReactWrapper<P, any> {
  const {context: ctx} = options;

  const appProviderContext = createPolarisContext();
  merge(appProviderContext, ctx.polaris);

  const frameProviderContext = {
    frame: {
      showToast: noop,
      hideToast: noop,
      setContextualSaveBar: noop,
      removeContextualSaveBar: noop,
      startLoading: noop,
      stopLoading: noop,
    },
  };
  merge(appProviderContext, ctx.frame);

  const context: AppContext = {
    appProviderContext,
    frameProviderContext,
  };

  const wrapper = new AppContextReactWrapper(node, {
    app: context,
  });

  return wrapper;
}

interface AppContextOptions {
  app: AppContext;
}

export class AppContextReactWrapper<P, S> extends ReactWrapper<P, S> {
  public readonly app: AppContext;

  constructor(element: React.ReactElement<P>, {app}: AppContextOptions) {
    super(<TestProvider />);

    function TestProvider<P>(props: P) {
      let content: React.ReactNode = element;

      if (Object.keys(props).length > 0) {
        content = React.cloneElement(React.Children.only(element), props);
      }

      return (
        <AppProviderProvider value={app.appProviderContext}>
          <FrameProvider value={app.frameProviderContext}>
            {content}
          </FrameProvider>
        </AppProviderProvider>
      );
    }

    this.app = app;
  }
}

export type AppContext = {
  appProviderContext: AppProviderContext;
  frameProviderContext: any;
};

export function createPolarisProps(): PolarisContext {
  const {polaris} = createAppProviderContext();
  const theme = createThemeContext().polarisTheme;
  const polarisContext = {...polaris, theme};
  return {polaris: polarisContext};
}
