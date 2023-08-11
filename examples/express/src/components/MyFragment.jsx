import React from "react";

export default class MyFragment extends React.Component {
  render() {
    return (
      <section>
        <h1>A fragment that can have its own TTL</h1>

        <div>{this.props.greeting /* access to the props as usual */}</div>
        <div>{this.props.dataFromAnAPI}</div>
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
