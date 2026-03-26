export const isValidModelFile = (fileName) => {
  const name = fileName.toLowerCase();
  return name.endsWith('.glb') || name.endsWith('.gltf') || name.endsWith('.ply');
};

export const getFileType = (fileName) => {
  const name = fileName.toLowerCase();
  if (name.endsWith('.ply')) return 'ply';
  return 'gltf';
};

export const createNewProperty = (propertyData) => {
  const { id, title, location, image, type, beds, baths, sqft, ...extra } = propertyData;
  return {
    id,
    title,
    location,
    price: 'Price TBD',
    image,
    type,
    beds,
    baths,
    sqft,
    ...extra,
  };
};
