import React from "react";
import renderer from "react-test-renderer";
import withESI from "../../withESI";

const Dummy = (props: { name?: string }) => <div>Hello {props.name}</div>;

test("server-side", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI.displayName).toBe("WithESI(Dummy)");

  process.env.REACT_ESI_SECRET = "dummy";
  const component = renderer.create(
    <DummyESI esi={{ attrs: { onerror: "continue" } }} name="Kévin" />
  );
  expect(component).toMatchSnapshot();
});
