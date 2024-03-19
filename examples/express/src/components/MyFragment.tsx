import type { Request, Response } from "express";
import PropTypes from "prop-types";
import React from "react";

interface MyFragmentProps {
  greeting: string;
  dataFromAnAPI?: string;
}

type GetInitialProps = {
  props: MyFragmentProps;
  res?: Response;
  req?: Request;
};

export default class MyFragment extends React.Component<MyFragmentProps> {
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

  static async getInitialProps({ props, res }: GetInitialProps) {
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
            dataFromAnAPI: "Hello there",
          }),
        2000
      );
    });
  }
}

MyFragment.propTypes = {
  greeting: PropTypes.string,
  dataFromAnAPI: PropTypes.string,
};
