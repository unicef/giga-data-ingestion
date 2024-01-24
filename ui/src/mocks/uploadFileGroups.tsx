import { Link } from "react-router-dom";

const datasets = ["School Geolocation", "School Coverage", "School QoS"];

export const uploadFileGroups = datasets.map(dataset => {
  const datasetSlug = dataset.toLowerCase().replace(/\s+/g, "-");

  return (
    <Link to={`${datasetSlug}`} unstable_viewTransition>
      {dataset}
    </Link>
  );
});
