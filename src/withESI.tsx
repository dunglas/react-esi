import PropTypes from "prop-types";
import type {
  ComponentClass,
  ComponentType,
  JSX,
  WeakValidationMap
} from "react";
import React, { Component } from "react";
import { IWebpackProcess } from "./types";

declare global {
  interface Window {
    __REACT_ESI__: { [s: string]: object };
  }
}

declare let process: IWebpackProcess;

interface IWithESIProps {
  esi?: {
    attrs?: {
      [key: string]: string | null;
    };
  };
}
/**
 * Higher Order Component generating a <esi:include> tag server-side,
 * and rendering the wrapped component client-side.
 */
export default function withESI<P extends Record<PropertyKey, unknown>>(
  WrappedComponent: ComponentType<P>,
  fragmentID: string
): ComponentClass<IWithESIProps & P> {
  return class WithESI extends Component<P & IWithESIProps> {
    public static WrappedComponent = WrappedComponent;
    public static displayName = `WithESI(${
      WrappedComponent.displayName || WrappedComponent.name || "Component"
    })`;
    public static propTypes = {
      esi: PropTypes.shape({
        attrs: PropTypes.objectOf(PropTypes.string) // extra attributes to add to the <esi:include> tag
      })
    } as unknown as WeakValidationMap<IWithESIProps & P>;
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

      if (!process.browser) {
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

      // TODO: add support for getServerSideProps
      if ("getInitialProps" in WrappedComponent) {
        // No server-side rendering for this component, getInitialProps will be called during componentDidMount
        this.state.initialChildPropsLoaded = false;
      }
    }

    public componentDidMount() {
      if (this.state.initialChildPropsLoaded) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      if (process.browser) {
        return (
          <div>
            <WrappedComponent
              {...(this.state.childProps as JSX.IntrinsicAttributes & P)}
            />
          </div>
        );
      }

      // Prevent Webpack and other bundlers to ship server.js
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
