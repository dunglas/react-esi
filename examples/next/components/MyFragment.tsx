import { Component } from "react";
import PropTypes from "prop-types";

interface MyFragmentProps {
  greeting: string;
  dataFromAnAPI?: string;
}

export default class MyFragment extends Component<MyFragmentProps> {
  public static propTypes: PropTypes.InferProps<MyFragmentProps>;
  render() {
    return (
      <section>
        <h1>A fragment that can have its own TTL</h1>

        <p>{this.props.greeting /* access to the props as usual */}</p>
        <p>{this.props.dataFromAnAPI}</p>
      </section>
    );
  }

  static async getInitialProps({ props, res }) {
    return new Promise((resolve) => {
      if (res) {
        // Set a TTL for this fragment
        res.set("Cache-Control", "s-maxage=60, max-age=30");
      }

      // Simulate a delay (call to a remote service such as a web API)
      setTimeout(
        () =>
          resolve({
            ...props, // Props coming from index.js, passed through the internal URL
            dataFromAnAPI: "Hello there"
          }),
        2000
      );
    });
  }
}

MyFragment.propTypes = {
  greeting: PropTypes.string,
  dataFromAnAPI: PropTypes.string
};
