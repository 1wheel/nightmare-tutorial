const { csvFormat } = require('d3-dsv');
const d3 = require('d3');
const Nightmare = require('nightmare');
const {readFileSync, writeFileSync } = require('fs');

const numbers = readFileSync('./tesco-title-numbers.csv', { encoding: 'utf8' }).trim().split('\n')

const START = 'http://ireports.wrapsnet.org/Interactive-Reporting/EnumType/Report?ItemPath=/rpt_WebArrivalsReports/MX%20-%20Arrivals%20by%20Nationality%20and%20Religion';

const getAddress = async date => {
  var date = '2/9/2017'
  console.log(`Now checking ${date}`);
  const nightmare = new Nightmare({ show: true });

  // Go to initial start page, navigate to "Detailed enquiry"
  try {
    var reportURL = await nightmare
      .goto(START)
      .wait('input[name="dnn$ctr513$View$ReportViewer1$ctl04$ctl07$txtValue"]')
      .type('input[name="dnn$ctr513$View$ReportViewer1$ctl04$ctl07$txtValue"]', date)
      .type('input[name="dnn$ctr513$View$ReportViewer1$ctl04$ctl11$txtValue"]', date)
      .click('#dnn_ctr513_View_ReportViewer1_ctl04_ctl05_ddDropDownButton')
      .click('#dnn_ctr513_View_ReportViewer1_ctl04_ctl05_divDropDown_ctl00')
      .click('#dnn_ctr513_View_ReportViewer1_ctl04_ctl09_ddDropDownButton')
      .click('#dnn_ctr513_View_ReportViewer1_ctl04_ctl09_divDropDown_ctl00')
      .select('#dnn_ctr513_View_ReportViewer1_ctl04_ctl03_ddValue', 2)
      .select('#dnn_ctr513_View_ReportViewer1_ctl04_ctl13_ddValue', 1)
      .click('#dnn_ctr513_View_ReportViewer1_ctl04_ctl00')
      // .wait('#dnn_ctr513_View_ReportViewer1_ctl05_ctl04_ctl00_ButtonImgDown')
      // .click('#dnn_ctr513_View_ReportViewer1_ctl05_ctl04_ctl00_ButtonImgDown')
      // .click('#dnn_ctr513_View_ReportViewer1_ctl05_ctl04_ctl00_Menu :nth-child(2)')
      // .click('.bodylinkcopy:first-child');
      // .wait('#VisibleReportContentdnn_ctr513_View_ReportViewer1_ctl09')
      .wait('#dnn_ctr513_View_ReportViewer1_ctl09 table')
      .evaluate(function(){
        var sel = $find('dnn_ctr513_View_ReportViewer1')
        var internalSel = sel._getInternalViewer()
        return internalSel.ExportUrlBase + 'CSV'

        // $find('dnn_ctr513_View_ReportViewer1').exportReport('CSV')
      })
      .then()

    await nightmare.goto('http://ireports.wrapsnet.org' + reportURL)

    console.log(reportURL)
  } catch(e) {
    console.error(e);
  }

  // // On the next page, type the title number into the appropriate box; click submit
  // try {
  //   // await nightmare
  //   //   .wait('input[name="titleNo"]')
  //   //   .type('input[name="dnn$ctr513$View$ReportViewer1$ctl04$ctl07$txtValue"]', id)
  //   //   .click('input[value="Search »"]');
  // } catch(e) {
  //   console.error(e);
  // }

  // try {
  //   const result = await nightmare
  //     .wait('.w80p')
  //     .evaluate(() => {
  //       return [...document.querySelectorAll('.w80p')].map(el => el.innerText);
  //     })
  //     .end();

  //     return { date, address: result[0], lease: result[1] };
  // } catch(e) {
  //   console.error(e);
  //   return undefined;
  // }
};

// getAddress(numbers[0]).then(a => console.dir(a));

const series = numbers.filter((d, i) => !i).reduce(async (queue, number) => {
  const dataArray = await queue;
  dataArray.push(await getAddress(number));
  return dataArray;
}, Promise.resolve([]));

series.then(data => {
  const csvData = csvFormat(data.filter(i => i));
  writeFileSync('./output.csv', csvData, { encoding: 'utf8' })
})
.catch(e => console.error(e));
