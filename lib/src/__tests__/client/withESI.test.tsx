import renderer from "react-test-renderer";
import withESI from "../../withESI";

declare let global: typeof globalThis & {
  __REACT_ESI__: { [s: string]: object };
};

const Dummy = (props: { name?: string }) => <div>Hello {props.name}</div>;

test("exposes WrappedComponent", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI).toHaveProperty("WrappedComponent", Dummy);
});

test("client-side", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI.displayName).toBe("WithESI(Dummy)");

  const component = renderer.create(<DummyESI name="Kévin" />);
  expect(component).toMatchSnapshot();
});

test("client-side with serialized props", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI.displayName).toBe("WithESI(Dummy)");

  global.__REACT_ESI__ = { id: { name: "Anne" } };
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

  renderer.create(<ComponentESI />);
  expect(called).toBe(true);
});
