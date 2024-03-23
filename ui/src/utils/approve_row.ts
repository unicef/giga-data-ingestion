interface Item {
  info?: {
    header?: string;
  };
  /* eslint-disable @typescript-eslint/no-explicit-any */
  value?: any;
}

export function getValueByHeader(array: Item[], header: string) {
  const item = array.find(obj => obj.info?.header === header);
  return item ? item.value : undefined;
}
