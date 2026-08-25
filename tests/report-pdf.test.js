const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('downloaded reports use a local PDF runtime with uniform page margins', () => {
  const ReportPdf = require('../js/report-pdf.js');
  const options = ReportPdf.buildOptions('academic-report.pdf');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const vendorPath = path.join(root, 'js', 'vendor', 'html2pdf.bundle.min.js');

  assert.deepEqual(options.margin, [0.5, 0.4, 0.5, 0.4]);
  assert.deepEqual(options.pagebreak, {
    mode: ['css', 'legacy'],
    avoid: ['.report-semester-block', '.report-planned-block']
  });
  assert.equal(options.jsPDF.format, 'a4');
  assert.equal(options.filename, 'academic-report.pdf');
  assert.match(html, /src="js\/vendor\/html2pdf\.bundle\.min\.js"/);
  assert.match(html, /src="js\/report-pdf\.js"/);
  assert.doesNotMatch(html, /cdnjs\.cloudflare\.com\/ajax\/libs\/html2pdf/);
  assert.ok(fs.statSync(vendorPath).size > 100000, 'local html2pdf bundle is present');
});

test('report download coordinator applies the approved options without print fallback', async () => {
  const ReportPdf = require('../js/report-pdf.js');
  const reportElement = { id: 'reportContent' };
  const calls = [];
  const worker = {
    set(options) { calls.push(['set', options]); return this; },
    from(element) { calls.push(['from', element]); return this; },
    async save() { calls.push(['save']); }
  };

  await ReportPdf.download({
    html2pdf: () => worker,
    element: reportElement,
    filename: 'report.pdf'
  });

  assert.deepEqual(calls[0][1].margin, [0.5, 0.4, 0.5, 0.4]);
  assert.deepEqual(calls.slice(1), [['from', reportElement], ['save']]);
  await assert.rejects(
    () => ReportPdf.download({ html2pdf: null, element: reportElement, filename: 'report.pdf' }),
    /PDF generator is unavailable/
  );
});
