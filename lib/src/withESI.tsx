import PropTypes from "prop-types";
import type { WeakValidationMap, ComponentType, ComponentClass } from "react";
import React from "react";

declare global {
  interface Window {
    __REACT_ESI__: { [s: string]: object };
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      browser?: boolean;
    }
  }
}

interface IWithESIProps {
  esi?: {
    attrs?: {
      [key: string]: string | null;
    };
  };
}

// Prevent bundlers to bundle server.js
const safeRequireServer = () => {
  try {
    // Necessary for NextJS
    return eval("require('react-esi/lib/server')");
  } catch (error) {
    // Necessary for Express and others
    return eval("require('./server')");
  }
};

const isClient = () => {
  return (
    (typeof process !== "undefined" && process?.browser) ||
    typeof window !== "undefined"
  );
};

const isServer = () => !isClient();

interface State {
  childProps: object;
  initialChildPropsLoaded: boolean;
}
/**
 * Higher Order Component generating a <esi:include> tag server-side,
 * and rendering the wrapped component client-side.
 */
export default function withESI<P>(
  WrappedComponent: ComponentType<P>,
  fragmentID: string
): ComponentClass<IWithESIProps & P> {
  return class WithESI extends React.Component<P & IWithESIProps, State> {
    public static WrappedComponent = WrappedComponent;
    public static displayName = `WithESI(${
      WrappedComponent.displayName || WrappedComponent.name || "Component"
    })`;
    public static propTypes = {
      esi: PropTypes.shape({
        attrs: PropTypes.objectOf(PropTypes.string), // extra attributes to add to the <esi:include> tag
      }),
    } as unknown as WeakValidationMap<IWithESIProps & P>;
    public state: State = {
      childProps: {},
      initialChildPropsLoaded: true,
    };
    private esi = {};

    constructor(props: P & IWithESIProps) {
      super(props);
      const { esi, ...childProps } = props;
      this.esi = esi || {};
      this.state.childProps = childProps;

      if (isServer()) {
        return;
      }

      if (window.__REACT_ESI__?.[fragmentID]) {
        // Inject server-side computed initial props
        this.state.childProps = {
          ...window.__REACT_ESI__[fragmentID],
          ...this.state.childProps,
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
            initialChildPropsLoaded: true,
          })
        );
    }

    public render() {
      if (isClient()) {
        return (
          <WrappedComponent
            {...(this.state.childProps as JSX.IntrinsicAttributes & P)}
          />
        );
      }

      const server = safeRequireServer();

      return server.createIncludeElement(fragmentID, this.props, this.esi);
    }
  };
}
