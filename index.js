const { csvFormat } = require('d3-dsv');
const d3 = require('d3');
const Nightmare = require('nightmare');
const {readFileSync, writeFileSync } = require('fs');
const fs = require('fs')
const glob = require('glob')


//delete recent dates (current day gets updated throughout day)
d3.timeDay.range(new Date(2017, 5, 16), new Date(), 1)
  .map(d3.timeFormat('%m/%d/%Y'))
  .forEach(function(d){
    var path = __dirname + '/raw/' + d.replace(/\//g, '-') + '.csv'
    if (fs.existsSync(path)) fs.unlinkSync(path)
    
})

var prevDownloaded = glob.sync(__dirname + '/raw/*.csv')
  .map(d => d.split('raw/')[1].replace('.csv', '').replace(/-/g, '/'))

const dates = d3.timeDay.range(new Date(2002, 0, 1), new Date(), 1)
  .map(d3.timeFormat('%m/%d/%Y'))
  .map(d => d.replace(' ', ''))
  .filter(d => !prevDownloaded.includes(d))

const START = 'http://ireports.wrapsnet.org/Interactive-Reporting/EnumType/Report?ItemPath=/rpt_WebArrivalsReports/MX%20-%20Arrivals%20by%20Nationality%20and%20Religion';

const getAddress = async date => {
  console.log(`scraping ${date}`);
  const nightmare = new Nightmare({ show: false });

  try {
    var outData = await nightmare
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
      .wait('#dnn_ctr513_View_ReportViewer1_ctl09 table')
      .evaluate(function(){
        var sel = $find('dnn_ctr513_View_ReportViewer1')
        var internalSel = sel._getInternalViewer()
        var url = internalSel.ExportUrlBase + 'CSV'

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.overrideMimeType("text/plain; charset=x-user-defined");
        xhr.send();
        return xhr.responseText;
      })
      .end()

    writeFileSync(__dirname + '/raw/' + date.replace(/\//g, '-') + '.csv', outData)

  } catch(e) {
    console.error(e);
  }

};

const series = dates.reduce(async (queue, number) => {
  const dataArray = await queue;
  dataArray.push(await getAddress(number));
  return dataArray;
}, Promise.resolve([]));
