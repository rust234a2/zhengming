export function selectClusterLinks(links) {
  return links.filter((link) => link.relation === "same-claim");
}
