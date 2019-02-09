import PropTypes from "prop-types";
import React from "react";

declare global {
  // tslint:disable-next-line
  interface Window {
    __REACT_ESI__: { [s: string]: object };
  }
}

interface IWebpackProcess extends NodeJS.Process {
  browser?: boolean;
}

interface IWithESIProps {
  esi?: {
    attrs?: object;
  };
}

/**
 * Higher Order Component generating a <esi:include> tag server-side, and rendering the wrapped component client-side.
 */
export default function withESI<P>(
  WrappedComponent: React.ComponentType<P>,
  fragmentID: string
) {
  return class WithESI extends React.Component<P> {
    public static displayName = `WithESI(${WrappedComponent.displayName ||
      WrappedComponent.name ||
      "Component"})`;
    public static propTypes = {
      esi: PropTypes.shape({
        attrs: PropTypes.objectOf(PropTypes.string) // extra attributes to add to the <esi:include> tag
      })
    };
    public state = {
      childProps: {},
      initialChildPropsLoaded: true
    };
    private esi = {};

    constructor(props: P & IWithESIProps) {
      super(props);
      const { esi, ...childProps } = props;
      this.esi = esi || {};
      this.state.childProps = childProps;

      if (!(process as IWebpackProcess).browser) {
        return;
      }

      if (window.__REACT_ESI__ && window.__REACT_ESI__[fragmentID]) {
        // Inject server-side computed initial props
        this.state.childProps = {
          ...window.__REACT_ESI__[fragmentID],
          ...this.state.childProps
        };
        return;
      }

      if ((WrappedComponent as any).getInitialProps) {
        // No server-side rendering for this component, getInitialProps will be called during componentDidMount
        this.state.initialChildPropsLoaded = false;
      }
    }

    public componentDidMount() {
      if (this.state.initialChildPropsLoaded) {
        return;
      }

      (WrappedComponent as any)
        .getInitialProps({ props: this.state.childProps })
        .then((initialProps: object) =>
          this.setState({
            childProps: initialProps,
            initialChildPropsLoaded: true
          })
        );
    }

    public render() {
      if ((process as IWebpackProcess).browser) {
        return (
          <div>
            <WrappedComponent {...this.state.childProps as P} />
          </div>
        );
      }

      // Prevent Webpack and other bundlers to ship server.js
      // tslint:disable-next-line
      const server = eval('require("./server")');
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: server.createIncludeElement(
              fragmentID,
              this.props,
              this.esi
            )
          }}
        />
      );
    }
  };
}
