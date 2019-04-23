import React from "react";
import renderer from "react-test-renderer";
import withESI from "./withESI";

const Dummy = (props: { name?: string }) => <div>Hello {props.name}</div>;

test("client-side", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI.displayName).toBe("WithESI(Dummy)");

  (global as any).navigator = {};
  const component = renderer.create(<DummyESI name="Kévin" />);
  expect(component).toMatchSnapshot();
});

test("client-side with serialized props", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI.displayName).toBe("WithESI(Dummy)");

  (global as any).navigator = {};
  ((global as any).__REACT_ESI__ as any) = { id: { name: "Anne" } };
  const component = renderer.create(<DummyESI />);
  expect(component).toMatchSnapshot();
});

test("client-side call getInitialProps", async () => {
  let called = false;

  const Component = (props: { name?: string }) => <div>Hello {props.name}</div>;
  Component.getInitialProps = async () => {
    called = true;
    return { name: "Kévin" };
  };

  const ComponentESI = withESI(Component, "initial-props");

  (global as any).navigator = {};
  renderer.create(<ComponentESI />);
  expect(called).toBe(true);
});

test("server-side", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI.displayName).toBe("WithESI(Dummy)");

  process.env.REACT_ESI_SECRET = "dummy";
  delete (global as any).navigator;
  const component = renderer.create(
    <DummyESI esi={{ attrs: { onerror: "continue" } }} name="Kévin" />
  );
  expect(component).toMatchSnapshot();
});
