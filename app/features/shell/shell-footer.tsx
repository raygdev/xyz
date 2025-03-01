const links = [
  { link: "https://metricsdao.gitbook.io/metrics-app/", label: "Documentation" },
  {
    link: "https://github.com/MetricsDAO/xyz/issues/new?assignees=gnomadic&labels=triage&template=public_issue.yaml&title=%5Bpublic+report%5D%3A+",
    label: "Report a Bug",
  },
];

export function AppFooter() {
  const items = links.map((link) => (
    <a key={link.link} href={link.link} target="_blank" rel="noreferrer" className="block py-6 text-neutral-600">
      {link.label}
    </a>
  ));

  return (
    <footer id="bottom">
      <menu className="flex flex-row items-center space-x-4 text-xs px-6 justify-end">{items}</menu>
    </footer>
  );
}
