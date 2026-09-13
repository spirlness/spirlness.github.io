import { describe, expect, it } from "vitest";
import { updateIcons } from "../content-schemas";
import {
  updateIconClassName,
  updateIconComponents,
} from "../update-icons";

describe("update icons (S-maint single source)", () => {
  it("covers exactly the schema icon set", () => {
    expect(Object.keys(updateIconComponents).sort()).toEqual(
      [...updateIcons].sort()
    );
    expect(Object.keys(updateIconClassName).sort()).toEqual(
      [...updateIcons].sort()
    );
  });

  it("exposes renderable components", () => {
    for (const icon of updateIcons) {
      expect(updateIconComponents[icon]).toBeDefined();
      expect(updateIconClassName[icon]).toMatch(/text-/);
    }
  });
});
