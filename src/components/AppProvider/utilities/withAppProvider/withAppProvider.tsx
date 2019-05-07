import * as React from 'react';
import hoistStatics from 'hoist-non-react-statics';
import {ClientApplication} from '@shopify/app-bridge';
import Intl from '../Intl';
import Link from '../Link';
import StickyManager from '../StickyManager';
import ScrollLockManager from '../ScrollLockManager';
import {
  ThemeContext,
  Consumer as ThemeProviderConsumer,
} from '../../../ThemeProvider';
import {
  Consumer as AppProviderConsumer,
  Provider as AppProviderProvider,
} from '../../Context';

export type ReactComponent<P, C> =
  | React.ComponentClass<P> & C
  | React.SFC<P> & C;

export interface WithAppProviderProps {
  polaris: {
    intl: Intl;
    link: Link;
    stickyManager: StickyManager;
    scrollLockManager: ScrollLockManager;
    theme?: ThemeContext;
    appBridge?: ClientApplication<{}>;
  };
}

export interface Options {
  inScrollable?: boolean;
}

function withScrollable<P, T>(WrappedComponent: ReactComponent<P, T>) {
  class WithScrollable extends React.Component {
    static contextTypes = WrappedComponent.contextTypes;
    private stickyManager: StickyManager = new StickyManager();

    render() {
      return (
        <AppProviderConsumer>
          {({polaris}) => (
            <AppProviderProvider
              value={{
                polaris: {...polaris, stickyManager: this.stickyManager},
              }}
            >
              <WrappedComponent {...this.props} />
            </AppProviderProvider>
          )}
        </AppProviderConsumer>
      );
    }
  }

  return WithScrollable;
}

export default function withAppProvider<OwnProps>({
  inScrollable,
}: Options = {}) {
  return function addProvider<C>(
    WrappedComponent: ReactComponent<OwnProps & WithAppProviderProps, C>,
  ): React.ComponentClass<OwnProps> & C {
    // eslint-disable-next-line react/prefer-stateless-function
    class WithProvider extends React.Component<OwnProps, never> {
      static contextTypes = WrappedComponent.contextTypes;

      render() {
        return (
          <AppProviderConsumer>
            {({polaris}) => {
              return (
                <ThemeProviderConsumer>
                  {({polarisTheme}) => {
                    const polarisContext = {
                      ...polaris,
                      theme: polarisTheme,
                    };

                    if (!polaris) {
                      throw new Error(
                        `The <AppProvider> component is required as of v2.0 of Polaris React. See
                                    https://polaris.shopify.com/components/structure/app-provider for implementation
                                    instructions.`,
                      );
                    }

                    return (
                      <WrappedComponent
                        {...this.props}
                        polaris={polarisContext}
                      />
                    );
                  }}
                </ThemeProviderConsumer>
              );
            }}
          </AppProviderConsumer>
        );
      }
    }

    let WithScrollable;
    if (inScrollable) {
      WithScrollable = withScrollable(WithProvider);
    }

    const FinalComponent = hoistStatics(
      WithScrollable || WithProvider,
      WrappedComponent as React.ComponentClass<any>,
    );

    return FinalComponent as React.ComponentClass<OwnProps> & C;
  };
}
