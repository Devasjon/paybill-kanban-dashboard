// Shim for @radix-ui/primitive's "./is-development" conditional export subpath.
// Parcel's bundler does not fully resolve the nested custom-condition export
// map (development/production/default) that this package version ships, so
// we alias the subpath straight to a production-mode stub via package.json's
// "alias" field. This is a production build, so IS_DEVELOPMENT is false.
export const IS_DEVELOPMENT = false;
