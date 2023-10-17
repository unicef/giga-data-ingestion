import { Link } from "react-router-dom";

import { CollapseProps } from "antd";

const groups = [
  {
    name: "School Data",
    types: [
      "School Geolocation and Key Indicators",
      "School Demographics",
      "School Contact Information",
    ],
  },
  {
    name: "School Internet",
    types: ["Test"],
  },
  {
    name: "Geospatial Data",
    types: ["Test"],
  },
  {
    name: "Infrastructure Data",
    types: ["Test"],
  },
  {
    name: "Others",
    types: ["Test"],
  },
];

export const uploadFileGroups: CollapseProps["items"] = groups.map(group => ({
  key: group.name,
  label: group.name,
  children: group.types.map(type => {
    const groupSlug = group.name.toLowerCase().replace(/\s+/g, "-");
    const typeSlug = type.toLowerCase().replace(/\s+/g, "-");

    return (
      <li key={typeSlug}>
        <Link to={`${groupSlug}/${typeSlug}`} unstable_viewTransition>
          {type}
        </Link>
      </li>
    );
  }),
}));
