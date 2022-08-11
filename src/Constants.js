const PDF_OPTIONS = {
  orientation: 'potrait',
  unit: 'in',
  format: [15,15]
};

const SUMMARY_TABLE_HEAD = [
  {title: 'Initiative Name'},
  {title: 'Ingestion Timelines'},
  {title: 'Total Number of files'},
  {title: 'Total File Size in GB'},
  {title: 'Total no of ADP transforms'},
  {title: 'Load Window'},
]

const SUMMARY_TABLE_APPERANCE = {
  fullWidth: true,
  highlightHeader: true,
  stripeBody: true,
  highlightFooter: true,
  headerTopBorderColor: 'green',
  columnTextAlign: ['left', 'left'],
  cellSizing: 'condensed',
  rowSpacing: '0px',
  columnDivider: false,
  rowDivider: false
}

const SYSTEMS = ["SoBIH", "Interconnect", "DTaaS", "ADP", "BIF"]
const SYSTEM_LABELS = [
  "File processing increase/day",
  "Bandwidth load increase/hour",
  "File processing increase/hour",
  "Transformations increase/sec",
  "File processing increase/hour"
]

export {PDF_OPTIONS, SUMMARY_TABLE_HEAD, SUMMARY_TABLE_APPERANCE, SYSTEMS, SYSTEM_LABELS}
